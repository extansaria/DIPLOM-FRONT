import { html } from "../lib.js";

export function CatalogPage({
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
}) {
  return html`
    <section className="layout-two">
      <div style=${{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="card">
          <h2 style=${{ marginTop: 0 }}>Части тела</h2>
          <div className="tags">
            ${bodyParts.map(
              (part) => html`
                <button
                  key=${part.id}
                  className=${`chip ${part.id === activeBodyPart ? "active" : ""}`}
                  onClick=${() => onBodyPartSelect(part.id)}
                >
                  ${part.name}
                </button>
              `
            )}
          </div>
        </div>
        <div>
          <button
            className="btn ghost"
            onClick=${onResetFilters}
            disabled=${isResetDisabled}
            style=${isResetDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            Сбросить фильтр
          </button>
        </div>
      </div>
      <div className="card">
        <h2 style=${{ marginTop: 0 }}>Группы мышц</h2>
        <div className="tags">
          ${muscleGroups.map(
            (group) => html`
              <button
                key=${group.id}
                className=${`chip ${group.id === activeMuscleGroup ? "active" : ""}`}
                onClick=${() => onMuscleGroupSelect(group.id)}
              >
                ${group.name}
              </button>
            `
          )}
        </div>
      </div>
    </section>
    <h3 className="section-title">Список упражнений</h3>
    <div className="card-grid">
      ${
        exercises.length === 0
          ? html`<p className="empty">По выбранному фильтру пока нет упражнений.</p>`
          : exercises.map(
              (exercise) => html`
                <article key=${exercise.id} className="card">
                  <h3>${exercise.name}</h3>
                  <p>${exercise.description}</p>
                  <div className="card-footer">
                    <span className="muted">${exercise.muscleGroupLabel}</span>
                    <button className="btn" onClick=${() => onOpenExercise(exercise)}>Открыть карточку</button>
                  </div>
                </article>
              `
            )
      }
    </div>
  `;
}
