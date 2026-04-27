import type { Exercise, Profile, WorkoutsByDay } from "../types";

type ProfileModalProps = {
  profile: Profile;
  favorites: Exercise[];
  workouts: WorkoutsByDay;
  onToggleAuth: () => void;
  onClose: () => void;
};

export function ProfileModal({ profile, favorites, workouts, onToggleAuth, onClose }: ProfileModalProps) {
  const savedDays = Object.values(workouts).filter((list) => list.length > 0).length;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Личный кабинет</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {profile.name}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="muted">Email: {profile.email}</p>
          <p className="muted">Статус: {profile.authenticated ? "В системе" : "Гость"}</p>
          <h3>Избранные упражнения</h3>
          {favorites.length === 0 ? (
            <p className="empty">Пока нет добавленных упражнений.</p>
          ) : (
            <div className="tags">
              {favorites.map((item) => (
                <span key={item.id} className="chip">
                  {item.name}
                </span>
              ))}
            </div>
          )}
          <h3>Сохраненные тренировки</h3>
          <p className="muted">Заполнено тренировочных дней: {savedDays}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Закрыть
          </button>
          <button
            type="button"
            className={profile.authenticated ? "btn" : "btn primary"}
            onClick={onToggleAuth}
          >
            {profile.authenticated ? "Выйти" : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
