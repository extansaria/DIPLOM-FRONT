import { useEffect, useRef, useState } from "react";
import { ReviewsIcon, WorkoutIcon } from "./icons";
import { daysOfWeek } from "../utils/helpers.js";
import type { Exercise } from "../types";

const EXERCISE_MODAL_CLOSE_MS = 220;

type ExerciseModalProps = {
  exercise: Exercise | null;
  onClose: () => void;
  onAddFavorite: (exercise: Exercise) => void;
  onAddToWorkout: (exercise: Exercise, day: string) => boolean;
};

export function ExerciseModal({ exercise, onClose, onAddFavorite, onAddToWorkout }: ExerciseModalProps) {
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [addedDayLabel, setAddedDayLabel] = useState("");
  const [phase, setPhase] = useState<"open" | "closing">("open");
  const resetTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (exercise) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setPhase("open");
    }
  }, [exercise]);

  useEffect(() => {
    setIsDayPickerOpen(false);
    setAddedDayLabel("");
  }, [exercise?.id]);

  if (!exercise) return null;
  const ex = exercise;

  const dayToCase: Record<string, string> = {
    Понедельник: "понедельник",
    Вторник: "вторник",
    Среда: "среду",
    Четверг: "четверг",
    Пятница: "пятницу",
    Суббота: "субботу",
    Воскресенье: "воскресенье"
  };

  function requestClose() {
    if (phase === "closing") return;
    setPhase("closing");
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, EXERCISE_MODAL_CLOSE_MS);
  }

  function handlePickDay(day: string) {
    const added = onAddToWorkout(ex, day);
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

  const animClass = phase === "open" ? "open" : "closing";

  return (
    <>
      <button
        type="button"
        className={`exercise-modal-dim ${animClass}`}
        aria-label="Закрыть карточку упражнения"
        onMouseDown={(e) => {
          e.preventDefault();
          requestClose();
        }}
      />
      <div className="exercise-modal-stage">
        <div className={`exercise-modal-panel ${animClass}`} onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0 }}>{ex.name}</h2>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  Мышечная группа: {ex.muscleGroupLabel ?? ex.muscleGroup}
                </p>
              </div>
              <button type="button" className="close-btn" onClick={requestClose}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="exercise-detail-layout">
                <div className="exercise-text-col">
                  <h3>Подробное описание</h3>
                  <p className="muted">{ex.detailedDescription || ex.description}</p>
                  <h3>Техника выполнения</h3>
                  {Array.isArray(ex.techniqueSteps) && ex.techniqueSteps.length > 0 ? (
                    <ol className="exercise-technique-list">
                      {ex.techniqueSteps.map((step, idx) => (
                        <li key={`${ex.id}-step-${idx}`}>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="muted">{ex.technique}</p>
                  )}
                  <h3>Частые ошибки</h3>
                  <p className="muted">{ex.mistakes}</p>
                </div>
                <aside className="exercise-media-col" aria-label="Видео демонстрация упражнения">
                  <div className={`preview-box ${ex.videoUrl ? "has-video" : ""}`}>
                    {ex.videoUrl ? (
                      <video controls preload="metadata" playsInline poster={ex.posterUrl}>
                        <source src={ex.videoUrl} type="video/mp4" />
                        Ваш браузер не поддерживает воспроизведение видео.
                      </video>
                    ) : (
                      "Видео / Preview зона"
                    )}
                  </div>
                </aside>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => onAddFavorite(ex)}>
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
                  <p className="day-picker-title" style={{ margin: 0, fontSize: "1.1rem" }}>
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
      </div>
    </>
  );
}
