import { useEffect, useRef, useState } from "react";
import { ReviewsIcon, WorkoutIcon } from "./icons";
import { daysOfWeek } from "../utils/helpers.js";
import type { Exercise } from "../types";

type ExerciseModalProps = {
  exercise: Exercise | null;
  onClose: () => void;
  onAddFavorite: (exercise: Exercise) => void;
  onAddToWorkout: (exercise: Exercise, day: string) => boolean;
};

export function ExerciseModal({ exercise, onClose, onAddFavorite, onAddToWorkout }: ExerciseModalProps) {
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [addedDayLabel, setAddedDayLabel] = useState("");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsDayPickerOpen(false);
    setAddedDayLabel("");
  }, [exercise?.id]);

  if (!exercise) return null;

  const dayToCase: Record<string, string> = {
    Понедельник: "понедельник",
    Вторник: "вторник",
    Среда: "среду",
    Четверг: "четверг",
    Пятница: "пятницу",
    Суббота: "субботу",
    Воскресенье: "воскресенье"
  };

  function handlePickDay(day: string) {
    const added = onAddToWorkout(exercise, day);
    setIsDayPickerOpen(false);
    setAddedDayLabel(added ? dayToCase[day] || day.toLowerCase() : `duplicate:${dayToCase[day] || day.toLowerCase()}`);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setAddedDayLabel("");
      resetTimerRef.current = null;
    }, 2600);
  }

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
          <button
            type="button"
            className="btn primary"
            onClick={() => setIsDayPickerOpen(true)}
            disabled={Boolean(addedDayLabel)}
            style={addedDayLabel ? { opacity: 0.62, cursor: "not-allowed" } : {}}
          >
            {WorkoutIcon({ className: "ui-icon", size: 14 })}
            {addedDayLabel
              ? addedDayLabel.startsWith("duplicate:")
                ? `Уже есть в ${addedDayLabel.replace("duplicate:", "")}`
                : `Добавлено в ${addedDayLabel}`
              : "Добавить в мою тренировку"}
          </button>
        </div>
        {isDayPickerOpen ? (
          <>
            <div className="day-picker-dim" onMouseDown={() => setIsDayPickerOpen(false)} role="presentation" />
            <div className="day-picker-popover" onMouseDown={(e) => e.stopPropagation()}>
              <p className="section-title" style={{ margin: 0, fontSize: "1.1rem" }}>
                В какой день добавить упражнение?
              </p>
              <div className="tags" style={{ marginTop: 10 }}>
                {daysOfWeek.map((day) => (
                  <button key={day} type="button" className="chip" onClick={() => handlePickDay(day)}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
