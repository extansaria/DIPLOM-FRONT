import { SearchBar } from "../components/SearchBar";
import { OpenCardIcon, ResetIcon } from "../components/icons";
import type { BodyPart, Exercise, MuscleGroupRow, SearchSuggestionItem } from "../types";

type CatalogPageProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void | Promise<void>;
  suggestions: SearchSuggestionItem[];
  isSuggesting: boolean;
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  isSearching: boolean;
  searchError: string;
  bodyParts: BodyPart[];
  activeBodyPart: string | null;
  onBodyPartSelect: (bodyPartId: string) => void;
  muscleGroups: MuscleGroupRow[];
  activeMuscleGroup: string | null;
  onMuscleGroupSelect: (groupId: string) => void;
  onResetFilters: () => void;
  isResetDisabled: boolean;
  exercises: Exercise[];
  onOpenExercise: (exercise: Exercise) => void;
};

export function CatalogPage({
  searchTerm,
  onSearchChange,
  onSearch,
  suggestions,
  isSuggesting,
  onSelectSuggestion,
  isSearching,
  searchError,
  bodyParts,
  activeBodyPart,
  onBodyPartSelect,
  muscleGroups,
  activeMuscleGroup,
  onMuscleGroupSelect,
  onResetFilters,
  isResetDisabled,
  exercises,
  onOpenExercise
}: CatalogPageProps) {
  return (
    <>
      <section className="hero" style={{ marginBottom: "14px" }}>
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          onSearch={onSearch}
          suggestions={suggestions}
          isSuggesting={isSuggesting}
          onSelectSuggestion={onSelectSuggestion}
        />
        {isSearching ? <p className="muted" style={{ margin: "8px 4px 0" }}>Идет поиск по базе...</p> : null}
        {searchError ? (
          <p className="muted" style={{ margin: "8px 4px 0", color: "#b91c1c" }}>
            {searchError}
          </p>
        ) : null}
      </section>
      <section className="layout-two">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Части тела</h2>
            <div className="tags">
              {bodyParts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={`chip ${part.id === activeBodyPart ? "active" : ""}`}
                  onClick={() => onBodyPartSelect(part.id)}
                >
                  {part.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button
              type="button"
              className="btn ghost"
              onClick={onResetFilters}
              disabled={isResetDisabled}
              style={isResetDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {ResetIcon({ className: "ui-icon", size: 14 })}
              Сбросить фильтр
            </button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Группы мышц</h2>
          <div className="tags">
            {muscleGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`chip ${group.id === activeMuscleGroup ? "active" : ""}`}
                onClick={() => onMuscleGroupSelect(group.id)}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      </section>
      <h3 className="section-title">Список упражнений</h3>
      <div className="card-grid">
        {exercises.length === 0 ? (
          <p className="empty">По выбранному фильтру пока нет упражнений.</p>
        ) : (
          exercises.map((exercise) => (
            <article key={exercise.id} className="card">
              <h3>{exercise.name}</h3>
              <p>{exercise.description}</p>
              <div className="card-footer">
                <span className="muted">{exercise.muscleGroupLabel ?? exercise.muscleGroup}</span>
                <button type="button" className="btn primary" onClick={() => onOpenExercise(exercise)}>
                  {OpenCardIcon({ className: "ui-icon", size: 14 })}
                  Открыть карточку
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
