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

const initialProfile: Profile = {
  name: "Даниил Сергеев",
  email: "student@gydex.local",
  authenticated: false
};
const PAGE_STORAGE_KEY = "gydex-current-page-v1";
const ALLOWED_PAGES = new Set<PageId>(["home", "catalog", "blog", "reviews", "workout"]);
const API_BASE_URL =
  (typeof window !== "undefined" && (window as Window & { __AI_API_URL__?: string }).__AI_API_URL__) || "http://localhost:3001";

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
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [favorites, setFavorites] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutsByDay>(() =>
    daysOfWeek.reduce<WorkoutsByDay>((acc, day) => ({ ...acc, [day]: [] }), {})
  );

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

  function addToWorkout(exercise: Exercise, targetDay: string) {
    if (!targetDay) return;
    setWorkouts((prev) => ({
      ...prev,
      [targetDay]: [...(prev[targetDay] || []), exercise]
    }));
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

    return <WorkoutPage workouts={workouts} />;
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
          onClose={() => setIsProfileOpen(false)}
          onToggleAuth={() => setProfile((prev) => ({ ...prev, authenticated: !prev.authenticated }))}
        />
      )}
      <AiSupportWidget onOpenCatalogByMuscleGroup={openCatalogByMuscleGroup} onOpenExerciseBySlug={openExerciseBySlug} />
    </>
  );
}
