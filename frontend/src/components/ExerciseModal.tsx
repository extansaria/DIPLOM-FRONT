import { ReviewsIcon, WorkoutIcon } from "./icons";
import type { Exercise } from "../types";

type ExerciseModalProps = {
  exercise: Exercise | null;
  onClose: () => void;
  onAddFavorite: (exercise: Exercise) => void;
  onAddToWorkout: (exercise: Exercise) => void;
};

export function ExerciseModal({ exercise, onClose, onAddFavorite, onAddToWorkout }: ExerciseModalProps) {
  if (!exercise) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>{exercise.name}</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Мышечная группа: {exercise.muscleGroupLabel ?? exercise.muscleGroup}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="preview-box">Видео / Preview зона</div>
          <h3>Краткое описание</h3>
          <p className="muted">{exercise.description}</p>
          <h3>Техника выполнения</h3>
          <p className="muted">{exercise.technique}</p>
          <h3>Частые ошибки</h3>
          <p className="muted">{exercise.mistakes}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={() => onAddFavorite(exercise)}>
            {ReviewsIcon({ className: "ui-icon", size: 14 })}
            Добавить в избранное
          </button>
          <button type="button" className="btn primary" onClick={() => onAddToWorkout(exercise)}>
            {WorkoutIcon({ className: "ui-icon", size: 14 })}
            Добавить в мою тренировку
          </button>
        </div>
      </div>
    </div>
  );
}
