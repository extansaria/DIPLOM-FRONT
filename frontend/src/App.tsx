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
import { bodyParts, blogPosts, exercises, muscleGroups, muscleGroupsByBodyPart } from "./data/mockData.js";
import { daysOfWeek } from "./utils/helpers.js";
import type { AiMatch, AiProgramQuestionnaire, Exercise, PageId, Profile, SearchSuggestionItem, WorkoutsByDay } from "./types";
import { getApiBaseUrl } from "./apiBaseUrl";

const AUTH_STORAGE_KEY = "gydex-auth-token-v1";
const PAGE_STORAGE_KEY = "gydex-current-page-v1";
const ALLOWED_PAGES = new Set<PageId>(["home", "catalog", "blog", "workout"]);
const API_BASE_URL = getApiBaseUrl();

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

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string) {
  return normalizeText(value).replace(/[\s-]+/g, "");
}

function findMatchByTitle(title: string, matches: AiMatch[]): AiMatch | null {
  const normalizedTitle = normalizeText(title.replace(/^\d+[.)]\s*/, ""));
  const compactTitle = compactText(title);
  if (!normalizedTitle) return null;
  return (
    matches.find((m) => {
      const dbTitle = normalizeText(m.title);
      const dbCompact = compactText(m.title);
      return (
        dbTitle === normalizedTitle ||
        dbTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(dbTitle) ||
        dbCompact === compactTitle ||
        dbCompact.includes(compactTitle) ||
        compactTitle.includes(dbCompact)
      );
    }) || null
  );
}

function parseWeeklyPlanTitles(answer: string): Record<string, string[]> {
  const byDay = Object.fromEntries(daysOfWeek.map((d) => [d, [] as string[]])) as Record<string, string[]>;
  const lines = String(answer || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let currentDay: string | null = null;
  for (const line of lines) {
    const day = daysOfWeek.find((d) => new RegExp(`^${d}\\s*:?$`, "i").test(line));
    if (day) {
      currentDay = day;
      continue;
    }
    if (!currentDay) continue;
    if (/^отдых\b/i.test(line)) {
      byDay[currentDay] = [];
      continue;
    }
    const numbered = line.match(/^(?:[-*]\s*|\d+[.)]\s*)(.+)$/);
    const rawTitle = (numbered ? numbered[1] : line).replace(/\s*[—-]\s*почему.+$/i, "").trim();
    if (rawTitle) byDay[currentDay].push(rawTitle);
  }
  return byDay;
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
  const [activeMuscleGroups, setActiveMuscleGroups] = useState<string[]>([]);
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
    const bySelectedGroups =
      activeMuscleGroups.length > 0 ? source.filter((item) => activeMuscleGroups.includes(item.muscleGroup)) : source;
    const byEquipment =
      equipmentFilters.length === 0
        ? bySelectedGroups
        : bySelectedGroups.filter((item) => {
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
  }, [exerciseList, catalogDbResults, activeMuscleGroups, equipmentFilters, searchTerm]);

  async function searchCatalogInDb() {
    const query = searchTerm.trim();
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      setCatalogDbResults(null);
      setCatalogSearchError("");
      return;
    }
    if (normalizedQuery.length < 2) {
      setCatalogDbResults([]);
      setCatalogSearchError("Введите минимум 2 буквы для поиска.");
      return;
    }
    setIsCatalogSearching(true);
    setCatalogSearchError("");
    try {
      const localMatches = exerciseList.filter((item) => normalizeText(item.name).includes(normalizedQuery));
      setCatalogDbResults(localMatches);
    } catch (error) {
      setCatalogSearchError(String(error instanceof Error ? error.message : error));
      setCatalogDbResults([]);
    } finally {
      setIsCatalogSearching(false);
    }
  }

  useEffect(() => {
    const query = searchTerm.trim();
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery || normalizedQuery.length < 2) {
      setSearchSuggestions([]);
      setIsSuggesting(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsSuggesting(true);
      const localSuggestions: SearchSuggestionItem[] = exerciseList
        .filter((item) => normalizeText(item.name).includes(normalizedQuery))
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          slug: item.slug || item.id,
          title: item.name,
          muscleGroup: item.muscleGroupLabel || item.muscleGroup
        }));
      if (!cancelled) {
        setSearchSuggestions(localSuggestions);
        setIsSuggesting(false);
      }
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

  async function generateAiProgram(payload: AiProgramQuestionnaire): Promise<string | null> {
    const cleanDays = Math.min(7, Math.max(1, Number(payload.daysPerWeek) || 3));
    const safePayload = { ...payload, daysPerWeek: cleanDays };

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safePayload)
      });
      const data: { answer?: string; error?: string; matches?: AiMatch[] } = await res.json();
      if (!res.ok) return data?.error || "AI не смог собрать программу.";
      const answer = String(data.answer || "");
      const matches = Array.isArray(data.matches) ? data.matches : [];
      const byDayTitles = parseWeeklyPlanTitles(answer);

      const next: WorkoutsByDay = emptyWorkouts();
      for (const day of daysOfWeek) {
        const titles = byDayTitles[day] || [];
        const seen = new Set<string>();
        const exercisesForDay: Exercise[] = [];
        for (const title of titles) {
          const matched = findMatchByTitle(title, matches);
          const exByMatch = matched ? findExerciseBySlug(exerciseList, matched.slug) : null;
          const exByTitle =
            exByMatch ||
            exerciseList.find((ex) => {
              const exName = normalizeText(ex.name);
              const t = normalizeText(title);
              return exName === t || exName.includes(t) || t.includes(exName);
            }) ||
            null;
          if (exByTitle && !seen.has(exByTitle.id)) {
            seen.add(exByTitle.id);
            exercisesForDay.push(exByTitle);
          }
        }
        next[day] = exercisesForDay;
      }

      const totalAdded = daysOfWeek.reduce((acc, day) => acc + next[day].length, 0);
      if (totalAdded === 0) return "AI ответил, но не удалось сопоставить упражнения с базой.";
      setWorkouts(next);
      setCurrentPage("workout");
      return null;
    } catch {
      return "Сеть недоступна при генерации плана.";
    }
  }

  function performSearch() {
    setCurrentPage("catalog");
    setSearchSuggestions([]);
    void searchCatalogInDb();
  }

  function selectBodyPart(bodyPartId: string) {
    setActiveBodyPart(bodyPartId);
    setActiveMuscleGroups([]);
  }

  const selectMuscleGroup = useCallback((groupId: string) => {
    if (muscleGroupsByBodyPart[groupId as keyof typeof muscleGroupsByBodyPart]) {
      setActiveBodyPart(groupId);
      setActiveMuscleGroups(muscleGroupsByBodyPart[groupId as keyof typeof muscleGroupsByBodyPart] || []);
      setCurrentPage("catalog");
      return;
    }

    const linkedBodyPartId = bodyParts.find((part) =>
      (muscleGroupsByBodyPart[part.id as keyof typeof muscleGroupsByBodyPart] || []).includes(groupId)
    )?.id;
    if (linkedBodyPartId) {
      setActiveBodyPart(linkedBodyPartId);
    }
    setActiveMuscleGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
    setCurrentPage("catalog");
  }, []);

  function resetCatalogFilters() {
    setActiveBodyPart(null);
    setActiveMuscleGroups([]);
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
    setActiveMuscleGroups([exercise.muscleGroup]);
    setCurrentPage("catalog");
    setSelectedExercise(exercise);
  }

  function openFavoriteFromProfile(exercise: Exercise) {
    if (!exercise) return;
    setIsProfileOpen(false);
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
      return (
        <HomePage
          onMuscleSelect={selectMuscleGroup}
          onNavigate={setCurrentPage}
          exercises={exerciseList}
          onOpenExercise={openExercise}
        />
      );
    }

    if (currentPage === "catalog") {
      return (
        <CatalogPage
          muscleGroups={muscleGroups}
          activeMuscleGroups={activeMuscleGroups}
          onMuscleGroupSelect={selectMuscleGroup}
          equipmentFilters={equipmentFilters}
          onEquipmentFilterToggle={toggleEquipmentFilter}
          onResetFilters={resetCatalogFilters}
          isResetDisabled={!activeBodyPart && activeMuscleGroups.length === 0 && equipmentFilters.length === 0}
          exercises={filteredExercises}
          onOpenExercise={openExercise}
        />
      );
    }

    if (currentPage === "blog") {
      return <BlogPage posts={blogPosts} />;
    }

    return (
      <WorkoutPage
        workouts={workouts}
        onOpenExercise={openExercise}
        onRemoveExercise={removeWorkoutExercise}
        onMoveExercise={moveWorkoutExercise}
        onGenerateAiProgram={generateAiProgram}
        isAuthenticated={profile.authenticated}
        onOpenProfile={() => setIsProfileOpen(true)}
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
          onOpenFavorite={openFavoriteFromProfile}
        />
      )}
      <AiSupportWidget onOpenCatalogByMuscleGroup={openCatalogByMuscleGroup} onOpenExerciseBySlug={openExerciseBySlug} />
    </>
  );
}
