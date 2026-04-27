import { html } from "../lib.js";
import { daysOfWeek } from "../utils/helpers.js";

export function WorkoutPage({ workouts }) {
  return html`
    <h2 className="section-title">Моя тренировка</h2>
    <p className="muted">Планировщик по дням недели. Добавляйте упражнения из модального окна карточки.</p>
    <section className="day-grid">
      ${daysOfWeek.map(
        (day) => html`
          <article key=${day} className="day-col">
            <h4>${day}</h4>
            ${
              workouts[day].length === 0
                ? html`<p className="empty">Пока пусто</p>`
                : workouts[day].map((exercise) => html`<div key=${exercise.id + day} className="day-item">${exercise.name}</div>`)
            }
          </article>
        `
      )}
    </section>
  `;
}
