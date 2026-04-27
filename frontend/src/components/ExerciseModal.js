import { html } from "../lib.js";

export function ExerciseModal({ exercise, onClose, onAddFavorite, onAddToWorkout }) {
  if (!exercise) return null;

  return html`
    <div className="modal-backdrop" onClick=${onClose}>
      <div className="modal" onClick=${(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style=${{ margin: 0 }}>${exercise.name}</h2>
            <p className="muted" style=${{ margin: "4px 0 0" }}>
              Мышечная группа: ${exercise.muscleGroupLabel}
            </p>
          </div>
          <button className="close-btn" onClick=${onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="preview-box">Видео / Preview зона</div>
          <h3>Краткое описание</h3>
          <p className="muted">${exercise.description}</p>
          <h3>Техника выполнения</h3>
          <p className="muted">${exercise.technique}</p>
          <h3>Частые ошибки</h3>
          <p className="muted">${exercise.mistakes}</p>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick=${() => onAddFavorite(exercise)}>Добавить в избранное</button>
          <button className="btn primary" onClick=${() => onAddToWorkout(exercise)}>Добавить в мою тренировку</button>
        </div>
      </div>
    </div>
  `;
}
