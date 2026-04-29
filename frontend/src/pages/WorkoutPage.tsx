import { daysOfWeek } from "../utils/helpers.js";
import type { WorkoutsByDay } from "../types";

type WorkoutPageProps = {
  workouts: WorkoutsByDay;
};

export function WorkoutPage({ workouts }: WorkoutPageProps) {
  return (
    <>
      <h2 className="section-title">Моя тренировка</h2>
      <p className="muted">Выбирайте упражнения и составляйте свою тренировку</p>
      <section className="day-grid">
        {daysOfWeek.map((day) => (
          <article key={day} className="day-col">
            <h4>{day}</h4>
            {(workouts[day]?.length ?? 0) === 0 ? (
              <p className="empty">Пока пусто</p>
            ) : (
              (workouts[day] ?? []).map((exercise) => (
                <div key={exercise.id + day} className="day-item">
                  {exercise.name}
                </div>
              ))
            )}
          </article>
        ))}
      </section>
    </>
  );
}
