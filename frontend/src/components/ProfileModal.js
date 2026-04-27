import { html } from "../lib.js";

export function ProfileModal({ profile, favorites, workouts, onToggleAuth, onClose }) {
  const savedDays = Object.values(workouts).filter((list) => list.length > 0).length;

  return html`
    <div className="modal-backdrop" onClick=${onClose}>
      <div className="modal" onClick=${(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style=${{ margin: 0 }}>Личный кабинет</h2>
            <p className="muted" style=${{ margin: "4px 0 0" }}>${profile.name}</p>
          </div>
          <button className="close-btn" onClick=${onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="muted">Email: ${profile.email}</p>
          <p className="muted">Статус: ${profile.authenticated ? "В системе" : "Гость"}</p>
          <h3>Избранные упражнения</h3>
          ${
            favorites.length === 0
              ? html`<p className="empty">Пока нет добавленных упражнений.</p>`
              : html`<div className="tags">${favorites.map((item) => html`<span key=${item.id} className="chip">${item.name}</span>`)}</div>`
          }
          <h3>Сохраненные тренировки</h3>
          <p className="muted">Заполнено тренировочных дней: ${savedDays}</p>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick=${onClose}>Закрыть</button>
          <button className="btn ${profile.authenticated ? "" : "primary"}" onClick=${onToggleAuth}>
            ${profile.authenticated ? "Выйти" : "Войти"}
          </button>
        </div>
      </div>
    </div>
  `;
}
