import { useState } from "react";
import { OpenCardIcon } from "../components/icons";
import { daysOfWeek } from "../utils/helpers.js";
import type { Exercise, WorkoutsByDay } from "../types";

type WorkoutPageProps = {
  workouts: WorkoutsByDay;
  onOpenExercise: (exercise: Exercise) => void;
  onRemoveExercise: (day: string, exerciseId: string) => void;
  onMoveExercise: (fromDay: string, toDay: string, exerciseId: string) => boolean;
};

type DragState = {
  fromDay: string;
  exerciseId: string;
} | null;

export function WorkoutPage({ workouts, onOpenExercise, onRemoveExercise, onMoveExercise }: WorkoutPageProps) {
  const [dragState, setDragState] = useState<DragState>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  function handleDragStart(fromDay: string, exerciseId: string) {
    setDragState({ fromDay, exerciseId });
  }

  function handleDrop(toDay: string) {
    if (!dragState) return;
    onMoveExercise(dragState.fromDay, toDay, dragState.exerciseId);
    setDragState(null);
    setHoverDay(null);
  }

  return (
    <>
      <h2 className="section-title">Моя тренировка</h2>
      <p className="muted">Выбирайте упражнения из каталога и составляйте свою тренировку</p>
      <section className="day-grid">
        {daysOfWeek.map((day) => (
          <article
            key={day}
            className={`day-col workout-day-col ${(workouts[day]?.length ?? 0) > 0 ? "has-workout" : "is-empty-day"} ${hoverDay === day ? "is-drop-target" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setHoverDay(day);
            }}
            onDragLeave={() => {
              if (hoverDay === day) setHoverDay(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(day);
            }}
          >
            <h4>{day}</h4>
            {(workouts[day]?.length ?? 0) === 0 ? (
              <p className="empty">Пока пусто. Перетащите сюда карточку.</p>
            ) : (
              (workouts[day] ?? []).map((exercise, index) => (
                <article
                  key={exercise.id}
                  className="workout-item-card"
                  draggable
                  onDragStart={() => handleDragStart(day, exercise.id)}
                  onDragEnd={() => {
                    setDragState(null);
                    setHoverDay(null);
                  }}
                >
                  <div className="workout-item-top">
                    <p className="workout-item-title">
                      <span className="workout-item-index" aria-label={`Упражнение номер ${index + 1}`}>
                        {index + 1}.
                      </span>{" "}
                      {exercise.name}
                    </p>
                    <button
                      type="button"
                      className="workout-remove-btn"
                      onClick={() => onRemoveExercise(day, exercise.id)}
                      aria-label="Удалить из тренировки"
                    >
                      ×
                    </button>
                  </div>
                  <p className="workout-item-muscle">{exercise.muscleGroupLabel ?? exercise.muscleGroup ?? "не указана"}</p>
                  <div className="workout-item-actions">
                    <button type="button" className="btn primary workout-more-btn" onClick={() => onOpenExercise(exercise)}>
                      {OpenCardIcon({ className: "ui-icon", size: 13 })}
                      Подробнее
                    </button>
                  </div>
                </article>
              ))
            )}
          </article>
        ))}
      </section>
    </>
  );
}
