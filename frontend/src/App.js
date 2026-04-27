import { html, useMemo, useState } from "./lib.js";
import { Header } from "./components/Header.js";
import { ExerciseModal } from "./components/ExerciseModal.js";
import { ProfileModal } from "./components/ProfileModal.js";
import { AiSupportWidget } from "./components/AiSupportWidget.js";
import { HomePage } from "./pages/HomePage.js";
import { CatalogPage } from "./pages/CatalogPage.js";
import { BlogPage } from "./pages/BlogPage.js";
import { ReviewsPage } from "./pages/ReviewsPage.js";
import { WorkoutPage } from "./pages/WorkoutPage.js";
import { bodyParts, blogPosts, exercises, muscleGroups, muscleGroupsByBodyPart, reviewsMock } from "./data/mockData.js";
import { daysOfWeek, includesText } from "./utils/helpers.js";

const initialProfile = {
  name: "Даниил Сергеев",
  email: "student@gydex.local",
  authenticated: false
};

function withLabels(items) {
  return items.map((exercise) => {
    const group = muscleGroups.find((item) => item.id === exercise.muscleGroup);
    return { ...exercise, muscleGroupLabel: group ? group.name : exercise.muscleGroup };
  });
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [activeBodyPart, setActiveBodyPart] = useState(null);
  const [activeMuscleGroup, setActiveMuscleGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [favorites, setFavorites] = useState([]);
  const [workouts, setWorkouts] = useState(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );

  const visibleMuscleGroups = useMemo(() => {
    if (!activeBodyPart) return muscleGroups;
    const ids = muscleGroupsByBodyPart[activeBodyPart] || [];
    return muscleGroups.filter((group) => ids.includes(group.id));
  }, [activeBodyPart]);

  const exerciseList = useMemo(() => withLabels(exercises), []);

  const filteredExercises = useMemo(() => {
    const byBodyPart = activeBodyPart
      ? exerciseList.filter((item) => (muscleGroupsByBodyPart[activeBodyPart] || []).includes(item.muscleGroup))
      : exerciseList;
    const bySelectedGroup = activeMuscleGroup ? byBodyPart.filter((item) => item.muscleGroup === activeMuscleGroup) : byBodyPart;
    if (!searchTerm.trim()) return bySelectedGroup;
    return bySelectedGroup.filter((item) => includesText(item.name, searchTerm) || includesText(item.description, searchTerm));
  }, [exerciseList, activeBodyPart, activeMuscleGroup, searchTerm]);

  function openExercise(exercise) {
    setSelectedExercise(exercise);
  }

  function addToFavorite(exercise) {
    setFavorites((prev) => (prev.some((item) => item.id === exercise.id) ? prev : [exercise, ...prev]));
  }

  function addToWorkout(exercise) {
    const targetDay = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    setWorkouts((prev) => ({
      ...prev,
      [targetDay]: prev[targetDay].some((item) => item.id === exercise.id) ? prev[targetDay] : [...prev[targetDay], exercise]
    }));
  }

  function performSearch() {
    setCurrentPage("catalog");
  }

  function selectBodyPart(bodyPartId) {
    setActiveBodyPart(bodyPartId);
    setActiveMuscleGroup(null);
  }

  function selectMuscleGroup(groupId) {
    if (muscleGroupsByBodyPart[groupId]) {
      setActiveBodyPart(groupId);
      setActiveMuscleGroup(muscleGroupsByBodyPart[groupId]?.[0] || null);
      setCurrentPage("catalog");
      return;
    }

    const linkedBodyPartId = bodyParts.find((part) => (muscleGroupsByBodyPart[part.id] || []).includes(groupId))?.id;
    if (linkedBodyPartId) {
      setActiveBodyPart(linkedBodyPartId);
      setActiveMuscleGroup(groupId);
    } else {
      setActiveMuscleGroup(groupId);
    }
    setCurrentPage("catalog");
  }

  function resetCatalogFilters() {
    setActiveBodyPart(null);
    setActiveMuscleGroup(null);
    setCurrentPage("catalog");
  }

  function renderPage() {
    if (currentPage === "home") {
      return html`
        <${HomePage}
          searchTerm=${searchTerm}
          onSearchChange=${setSearchTerm}
          onSearch=${performSearch}
          onMuscleSelect=${selectMuscleGroup}
        />
      `;
    }

    if (currentPage === "catalog") {
      return html`
        <${CatalogPage}
          bodyParts=${bodyParts}
          activeBodyPart=${activeBodyPart}
          onBodyPartSelect=${selectBodyPart}
          muscleGroups=${visibleMuscleGroups}
          activeMuscleGroup=${activeMuscleGroup}
          onMuscleGroupSelect=${selectMuscleGroup}
          onResetFilters=${resetCatalogFilters}
          isResetDisabled=${!activeBodyPart && !activeMuscleGroup}
          exercises=${filteredExercises}
          onOpenExercise=${openExercise}
        />
      `;
    }

    if (currentPage === "blog") {
      return html`<${BlogPage} posts=${blogPosts} />`;
    }

    if (currentPage === "reviews") {
      return html`<${ReviewsPage} initialReviews=${reviewsMock} />`;
    }

    return html`<${WorkoutPage} workouts=${workouts} />`;
  }

  return html`
    <${Header}
      currentPage=${currentPage}
      onNavigate=${setCurrentPage}
      onOpenProfile=${() => setIsProfileOpen(true)}
    />
    <main>
      <div className="container">${renderPage()}</div>
    </main>
    <${ExerciseModal}
      exercise=${selectedExercise}
      onClose=${() => setSelectedExercise(null)}
      onAddFavorite=${addToFavorite}
      onAddToWorkout=${addToWorkout}
    />
    ${
      isProfileOpen &&
      html`
        <${ProfileModal}
          profile=${profile}
          favorites=${favorites}
          workouts=${workouts}
          onClose=${() => setIsProfileOpen(false)}
          onToggleAuth=${() => setProfile((prev) => ({ ...prev, authenticated: !prev.authenticated }))}
        />
      `
    }
    <${AiSupportWidget} />
  `;
}
