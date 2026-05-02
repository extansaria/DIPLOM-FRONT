import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { ExerciseModal } from "./components/ExerciseModal";
import { ProfileModal } from "./components/ProfileModal";
import { AiSupportWidget } from "./components/AiSupportWidget";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { BlogPage } from "./pages/BlogPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { bodyParts, blogPosts, exercises, muscleGroups, muscleGroupsByBodyPart, reviewsMock } from "./data/mockData.js";
import { daysOfWeek } from "./utils/helpers.js";
import type { Exercise, PageId, Profile, SearchSuggestionItem, WorkoutsByDay } from "./types";

const AUTH_STORAGE_KEY = "gydex-auth-token-v1";
const PAGE_STORAGE_KEY = "gydex-current-page-v1";
const ALLOWED_PAGES = new Set<PageId>(["home", "catalog", "blog", "reviews", "workout"]);
const API_BASE_URL =
  (typeof window !== "undefined" && (window as Window & { __AI_API_URL__?: string }).__AI_API_URL__) || "http://localhost:3001";

const guestProfile: Profile = {
  id: null,
  nickname: null,
  name: "Гость",
  email: "",
  authenticated: false
};

function emptyWorkouts(): WorkoutsByDay {
  return daysOfWeek.reduce<WorkoutsByDay>((acc, day) => ({ ...acc, [day]: [] }), {});
}

function slugsFromFavorites(favorites: Exercise[]) {
  return favorites.map((e) => e.slug || e.id);
}

function slugsFromWorkouts(workouts: WorkoutsByDay) {
  const out: Record<string, string[]> = {};
  for (const day of daysOfWeek) {
    out[day] = (workouts[day] || []).map((e) => e.slug || e.id);
  }
  return out;
}

function findExerciseBySlug(list: Exercise[], slug: string) {
  return list.find((e) => e.id === slug || e.slug === slug) || null;
}

function exercisesFromSlugs(slugs: string[], list: Exercise[]): Exercise[] {
  const seen = new Set<string>();
  const result: Exercise[] = [];
  for (const s of slugs) {
    const ex = findExerciseBySlug(list, s);
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      result.push(ex);
    }
  }
  return result;
}

function workoutsFromApi(workouts: Record<string, unknown> | undefined, list: Exercise[]): WorkoutsByDay {
  const base = emptyWorkouts();
  if (!workouts || typeof workouts !== "object") return base;
  for (const day of daysOfWeek) {
    const slugs = workouts[day];
    base[day] = Array.isArray(slugs) ? exercisesFromSlugs(slugs.map(String), list) : [];
  }
  return base;
}

function withLabels(items: Exercise[]): Exercise[] {
  return items.map((exercise) => {
    const group = muscleGroups.find((item) => item.id === exercise.muscleGroup);
    return { ...exercise, muscleGroupLabel: group ? group.name : exercise.muscleGroup };
  });
}

function isPageId(value: string): value is PageId {
  return ALLOWED_PAGES.has(value as PageId);
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    try {
      const saved = window.localStorage.getItem(PAGE_STORAGE_KEY);
      if (saved && isPageId(saved)) return saved;
    } catch {
      /* ignore storage read errors */
    }
    return "home";
  });
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string | null>(null);
  const [equipmentFilters, setEquipmentFilters] = useState<
    Array<"machine" | "free-weight" | "cardio" | "bodyweight" | "functional" | "kettlebell" | "barbell-dumbbell" | "stretching">
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isCatalogSearching, setIsCatalogSearching] = useState(false);
  const [catalogSearchError, setCatalogSearchError] = useState("");
  const [catalogDbResults, setCatalogDbResults] = useState<Exercise[] | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [libraryHydrated, setLibraryHydrated] = useState(false);
  const [profile, setProfile] = useState<Profile>(guestProfile);
  const [favorites, setFavorites] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutsByDay>(() => emptyWorkouts());

  useEffect(() => {
    try {
      window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
    } catch {
      /* ignore storage write errors */
    }
  }, [currentPage]);

  const visibleMuscleGroups = useMemo(() => {
    if (!activeBodyPart) return muscleGroups;
    const ids = muscleGroupsByBodyPart[activeBodyPart as keyof typeof muscleGroupsByBodyPart] || [];
    return muscleGroups.filter((group) => ids.includes(group.id));
  }, [activeBodyPart]);

  const exerciseList = useMemo(() => withLabels(exercises as Exercise[]), []);

  useEffect(() => {
    if (!authToken) {
      setLibraryHydrated(false);
      setProfile(guestProfile);
      setFavorites([]);
      setWorkouts(emptyWorkouts());
      return;
    }
    setLibraryHydrated(false);
    let cancelled = false;
    void (async () => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
        if (!meRes.ok) throw new Error("me");
        const me = (await meRes.json()) as { id: string; nickname: string; email?: string; displayName?: string };
        if (cancelled) return;
        setProfile({
          id: me.id,
          nickname: me.nickname,
          name: me.displayName || me.nickname,
          email: me.email || "",
          authenticated: true
        });
        const libRes = await fetch(`${API_BASE_URL}/api/user/library`, { headers });
        const lib = (await libRes.json()) as { favorites?: string[]; workouts?: Record<string, unknown> };
        if (cancelled) return;
        if (libRes.ok) {
          setFavorites(exercisesFromSlugs(Array.isArray(lib.favorites) ? lib.favorites : [], exerciseList));
          setWorkouts(workoutsFromApi(lib.workouts, exerciseList));
        } else {
          setFavorites([]);
          setWorkouts(emptyWorkouts());
        }
        setLibraryHydrated(true);
      } catch {
        if (cancelled) return;
        try {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setAuthToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, exerciseList]);

  useEffect(() => {
    if (!authToken || !libraryHydrated) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/user/library`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              favorites: slugsFromFavorites(favorites),
              workouts: slugsFromWorkouts(workouts)
            })
          });
          if (!res.ok) {
            /* silent; user keeps local state */
          }
        } catch {
          /* ignore network errors */
        }
      })();
    }, 750);
    return () => window.clearTimeout(timer);
  }, [favorites, workouts, authToken, libraryHydrated]);

  const filteredExercises = useMemo(() => {
    const source = Array.isArray(catalogDbResults) ? catalogDbResults : exerciseList;
    const byBodyPart = activeBodyPart
      ? source.filter((item) =>
          (muscleGroupsByBodyPart[activeBodyPart as keyof typeof muscleGroupsByBodyPart] || []).includes(item.muscleGroup)
        )
      : source;
    const bySelectedGroup = activeMuscleGroup ? byBodyPart.filter((item) => item.muscleGroup === activeMuscleGroup) : byBodyPart;
    const byEquipment =
      equipmentFilters.length === 0
        ? bySelectedGroup
        : bySelectedGroup.filter((item) => {
            const eq = String(item.equipment || "")
              .toLowerCase()
              .replace(/ё/g, "е");
            const isMachine = eq.includes("тренажер") || eq.includes("блок");
            const isFreeWeight = eq.includes("штанг") || eq.includes("гантел") || eq.includes("гриф") || eq.includes("блин");
            const isCardio = eq.includes("кардио") || eq.includes("дорожк") || eq.includes("велотренаж") || eq.includes("эллипс");
            const isBodyweight = eq.includes("собственн") || eq.includes("свой вес") || eq.includes("вес тела");
            const isFunctional = eq.includes("функцион") || eq.includes("trx") || eq.includes("петл");
            const isKettlebell = eq.includes("гир");
            const isBarbellDumbbell = eq.includes("штанг") || eq.includes("гантел");
            const isStretching = eq.includes("растяж") || eq.includes("мобил");
            const hitMachine = equipmentFilters.includes("machine") && isMachine;
            const hitFreeWeight = equipmentFilters.includes("free-weight") && isFreeWeight;
            const hitCardio = equipmentFilters.includes("cardio") && isCardio;
            const hitBodyweight = equipmentFilters.includes("bodyweight") && isBodyweight;
            const hitFunctional = equipmentFilters.includes("functional") && isFunctional;
            const hitKettlebell = equipmentFilters.includes("kettlebell") && isKettlebell;
            const hitBarbellDumbbell = equipmentFilters.includes("barbell-dumbbell") && isBarbellDumbbell;
            const hitStretching = equipmentFilters.includes("stretching") && isStretching;
            return hitMachine || hitFreeWeight || hitCardio || hitBodyweight || hitFunctional || hitKettlebell || hitBarbellDumbbell || hitStretching;
          });
    return byEquipment;
  }, [exerciseList, catalogDbResults, activeBodyPart, activeMuscleGroup, equipmentFilters, searchTerm]);

  async function searchCatalogInDb() {
    const query = searchTerm.trim();
    if (!query) {
      setCatalogDbResults(null);
      setCatalogSearchError("");
      return;
    }
    setIsCatalogSearching(true);
    setCatalogSearchError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/exercises/search?q=${encodeURIComponent(query)}`);
      const data: { error?: string; items?: unknown[] } = await res.json();
      if (!res.ok) throw new Error(data?.error || "Ошибка поиска по базе");
      const rows = Array.isArray(data.items) ? data.items : [];
      const mapped: Exercise[] = rows.map((row: unknown) => {
        const r = row as Record<string, string | undefined>;
        return {
          id: r.slug || r.id || "",
          name: r.title || "",
          muscleGroup: r.muscleGroupSlug || "",
          muscleGroupLabel: r.muscleGroup,
          description: r.shortDescription || "",
          technique: r.technique || "",
          mistakes: r.commonMistakes || "",
          equipment: r.equipment || ""
        };
      });
      setCatalogDbResults(mapped);
    } catch (error) {
      setCatalogSearchError(String(error instanceof Error ? error.message : error));
      setCatalogDbResults([]);
    } finally {
      setIsCatalogSearching(false);
    }
  }

  useEffect(() => {
    const query = searchTerm.trim();
    if (!query) {
      setSearchSuggestions([]);
      setIsSuggesting(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setIsSuggesting(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/exercises/search?q=${encodeURIComponent(query)}`);
          const data: { error?: string; items?: SearchSuggestionItem[] } = await res.json();
          if (!res.ok) throw new Error(data?.error || "Ошибка подсказок");
          if (cancelled) return;
          setSearchSuggestions((Array.isArray(data.items) ? data.items : []).slice(0, 6));
        } catch {
          if (!cancelled) setSearchSuggestions([]);
        } finally {
          if (!cancelled) setIsSuggesting(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  function openExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
  }

  function addToFavorite(exercise: Exercise) {
    setFavorites((prev) => (prev.some((item) => item.id === exercise.id) ? prev : [exercise, ...prev]));
  }

  function removeFromFavorite(exercise: Exercise) {
    setFavorites((prev) => prev.filter((item) => item.id !== exercise.id));
  }

  async function handleAuthGoogle(credential: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential })
      });
      const data = (await res.json()) as { error?: string; token?: string };
      if (!res.ok) return data.error || "Не удалось войти через Google.";
      if (!data.token) return "Нет токена в ответе.";
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, data.token);
      } catch {
        /* ignore */
      }
      setAuthToken(data.token);
      return null;
    } catch {
      return "Сеть недоступна.";
    }
  }

  async function handleAuthLogin(login: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password })
      });
      const data = (await res.json()) as { error?: string; token?: string };
      if (!res.ok) return data.error || "Не удалось войти.";
      if (!data.token) return "Нет токена в ответе.";
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, data.token);
      } catch {
        /* ignore */
      }
      setAuthToken(data.token);
      return null;
    } catch {
      return "Сеть недоступна.";
    }
  }

  async function handleAuthCheckLoginEmail(email: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) return data.error || "Не удалось проверить email.";
      return null;
    } catch {
      return "Сеть недоступна.";
    }
  }

  async function handleAuthRegister(payload: { nickname: string; password: string; email: string }): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, displayName: "" })
      });
      const data = (await res.json()) as { error?: string; token?: string };
      if (!res.ok) return data.error || "Не удалось зарегистрироваться.";
      if (!data.token) return "Нет токена в ответе.";
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, data.token);
      } catch {
        /* ignore */
      }
      setAuthToken(data.token);
      return null;
    } catch {
      return "Сеть недоступна.";
    }
  }

  function handleAuthLogout() {
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    setIsProfileOpen(false);
  }

  async function handleAuthForgotPassword(nicknameOrEmail: string): Promise<{ error: string | null; message?: string; resetToken?: string }> {
    try {
      const v = nicknameOrEmail.trim();
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, nickname: v })
      });
      const data = (await res.json()) as { error?: string; message?: string; resetToken?: string };
      if (!res.ok) return { error: data.error || "Не удалось отправить запрос." };
      return { error: null, message: data.message, resetToken: data.resetToken };
    } catch {
      return { error: "Сеть недоступна." };
    }
  }

  async function handleAuthResetPassword(token: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) return data.error || "Не удалось сменить пароль.";
      return null;
    } catch {
      return "Сеть недоступна.";
    }
  }

  function addToWorkout(exercise: Exercise, targetDay: string): boolean {
    if (!targetDay) return false;
    const alreadyExists = (workouts[targetDay] || []).some((item) => item.id === exercise.id);
    if (alreadyExists) return false;
    setWorkouts((prev) => ({
      ...prev,
      [targetDay]: [...(prev[targetDay] || []), exercise]
    }));
    return true;
  }

  function removeWorkoutExercise(day: string, exerciseId: string) {
    setWorkouts((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((item) => item.id !== exerciseId)
    }));
  }

  function moveWorkoutExercise(fromDay: string, toDay: string, exerciseId: string): boolean {
    if (!fromDay || !toDay || fromDay === toDay) return false;
    const source = workouts[fromDay] || [];
    const moving = source.find((item) => item.id === exerciseId);
    if (!moving) return false;
    const existsInTarget = (workouts[toDay] || []).some((item) => item.id === exerciseId);
    if (existsInTarget) return false;

    setWorkouts((prev) => ({
      ...prev,
      [fromDay]: (prev[fromDay] || []).filter((item) => item.id !== exerciseId),
      [toDay]: [...(prev[toDay] || []), moving]
    }));
    return true;
  }

  function performSearch() {
    setCurrentPage("catalog");
    setSearchSuggestions([]);
    void searchCatalogInDb();
  }

  function selectBodyPart(bodyPartId: string) {
    setActiveBodyPart(bodyPartId);
    setActiveMuscleGroup(null);
  }

  const selectMuscleGroup = useCallback((groupId: string) => {
    if (muscleGroupsByBodyPart[groupId as keyof typeof muscleGroupsByBodyPart]) {
      setActiveBodyPart(groupId);
      setActiveMuscleGroup(muscleGroupsByBodyPart[groupId as keyof typeof muscleGroupsByBodyPart]?.[0] || null);
      setCurrentPage("catalog");
      return;
    }

    const linkedBodyPartId = bodyParts.find((part) =>
      (muscleGroupsByBodyPart[part.id as keyof typeof muscleGroupsByBodyPart] || []).includes(groupId)
    )?.id;
    if (linkedBodyPartId) {
      setActiveBodyPart(linkedBodyPartId);
      setActiveMuscleGroup(groupId);
    } else {
      setActiveMuscleGroup(groupId);
    }
    setCurrentPage("catalog");
  }, []);

  function resetCatalogFilters() {
    setActiveBodyPart(null);
    setActiveMuscleGroup(null);
    setEquipmentFilters([]);
    setCatalogDbResults(null);
    setCatalogSearchError("");
    setSearchTerm("");
    setCurrentPage("catalog");
  }

  function toggleEquipmentFilter(
    value: "machine" | "free-weight" | "cardio" | "bodyweight" | "functional" | "kettlebell" | "barbell-dumbbell" | "stretching"
  ) {
    setEquipmentFilters((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  function openCatalogByMuscleGroup(groupId: string) {
    if (!groupId) return;
    selectMuscleGroup(groupId);
    setCurrentPage("catalog");
  }

  function openExerciseBySlug(slug: string) {
    if (!slug) return;
    const exercise = exerciseList.find((item) => item.slug === slug || item.id === slug);
    if (!exercise) return;
    const linkedBodyPartId =
      bodyParts.find((part) =>
        (muscleGroupsByBodyPart[part.id as keyof typeof muscleGroupsByBodyPart] || []).includes(exercise.muscleGroup)
      )?.id || null;
    setActiveBodyPart(linkedBodyPartId);
    setActiveMuscleGroup(exercise.muscleGroup);
    setCurrentPage("catalog");
    setSelectedExercise(exercise);
  }

  function handleSelectSuggestion(item: SearchSuggestionItem) {
    if (!item) return;
    setSearchTerm(item.title || "");
    setSearchSuggestions([]);
    openExerciseBySlug(item.slug || "");
  }

  function renderPage() {
    if (currentPage === "home") {
      return <HomePage onMuscleSelect={selectMuscleGroup} onNavigate={setCurrentPage} />;
    }

    if (currentPage === "catalog") {
      return (
        <CatalogPage
          bodyParts={bodyParts}
          activeBodyPart={activeBodyPart}
          onBodyPartSelect={selectBodyPart}
          muscleGroups={visibleMuscleGroups}
          activeMuscleGroup={activeMuscleGroup}
          onMuscleGroupSelect={selectMuscleGroup}
          equipmentFilters={equipmentFilters}
          onEquipmentFilterToggle={toggleEquipmentFilter}
          onResetFilters={resetCatalogFilters}
          isResetDisabled={!activeBodyPart && !activeMuscleGroup && equipmentFilters.length === 0}
          exercises={filteredExercises}
          onOpenExercise={openExercise}
        />
      );
    }

    if (currentPage === "blog") {
      return <BlogPage posts={blogPosts} />;
    }

    if (currentPage === "reviews") {
      return <ReviewsPage initialReviews={reviewsMock} />;
    }

    return (
      <WorkoutPage
        workouts={workouts}
        onOpenExercise={openExercise}
        onRemoveExercise={removeWorkoutExercise}
        onMoveExercise={moveWorkoutExercise}
      />
    );
  }

  return (
    <>
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenProfile={() => setIsProfileOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={performSearch}
        suggestions={searchSuggestions}
        isSuggesting={isSuggesting}
        onSelectSuggestion={handleSelectSuggestion}
      />
      <main>
        <div className="container">{renderPage()}</div>
      </main>
      <ExerciseModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onAddFavorite={addToFavorite}
        onAddToWorkout={addToWorkout}
      />
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          favorites={favorites}
          workouts={workouts}
          apiBaseUrl={API_BASE_URL}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleAuthLogout}
          onLogin={handleAuthLogin}
          onCheckLoginEmail={handleAuthCheckLoginEmail}
          onRegister={handleAuthRegister}
          onGoogleSignIn={handleAuthGoogle}
          onRequestPasswordReset={handleAuthForgotPassword}
          onResetPassword={handleAuthResetPassword}
          onRemoveFavorite={removeFromFavorite}
        />
      )}
      <AiSupportWidget onOpenCatalogByMuscleGroup={openCatalogByMuscleGroup} onOpenExerciseBySlug={openExerciseBySlug} />
    </>
  );
}
