import { useState } from "react";
import { OpenCardIcon } from "../components/icons";
import { daysOfWeek } from "../utils/helpers.js";
import type { AiProgramQuestionnaire, Exercise, WorkoutsByDay } from "../types";

type WorkoutPageProps = {
  workouts: WorkoutsByDay;
  onOpenExercise: (exercise: Exercise) => void;
  onRemoveExercise: (day: string, exerciseId: string) => void;
  onMoveExercise: (fromDay: string, toDay: string, exerciseId: string) => boolean;
  onGenerateAiProgram: (payload: AiProgramQuestionnaire) => Promise<string | null>;
  isAuthenticated?: boolean;
  onOpenProfile?: () => void;
};

type DragState = {
  fromDay: string;
  exerciseId: string;
} | null;

export function WorkoutPage({
  workouts,
  onOpenExercise,
  onRemoveExercise,
  onMoveExercise,
  onGenerateAiProgram,
  isAuthenticated = false,
  onOpenProfile
}: WorkoutPageProps) {
  const [dragState, setDragState] = useState<DragState>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [form, setForm] = useState<AiProgramQuestionnaire>({
    sex: "male",
    age: 28,
    heightCm: 175,
    weightKg: 75,
    trainingPlace: "gym",
    goal: "Набор мышечной массы без перегруза поясницы",
    level: "beginner",
    daysPerWeek: 3,
    limitations: ""
  });

  function handleDragStart(fromDay: string, exerciseId: string) {
    setDragState({ fromDay, exerciseId });
  }

  function handleDrop(toDay: string) {
    if (!dragState) return;
    onMoveExercise(dragState.fromDay, toDay, dragState.exerciseId);
    setDragState(null);
    setHoverDay(null);
  }

  function updateForm<K extends keyof AiProgramQuestionnaire>(key: K, value: AiProgramQuestionnaire[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerateProgram() {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationMessage("");
    const err = await onGenerateAiProgram(form);
    setGenerationMessage(err ? `Ошибка: ${err}` : "Готово: AI сформировал недельный план. Можешь редактировать его вручную.");
    setIsGenerating(false);
    if (!err) {
      setIsAiModalOpen(false);
      setAiStep(0);
    }
  }

  function openAiModal() {
    setGenerationMessage("");
    setAiStep(0);
    setIsAiModalOpen(true);
  }

  return (
    <>
      <h2 className="section-title">Моя тренировка</h2>
      <p className="muted">Выбирайте упражнения из каталога и составляйте свою тренировку</p>
      {!isAuthenticated ? (
        <div className="workout-storage-note" role="note" aria-label="Примечание о хранении тренировок">
          <p className="workout-storage-note-text">Авторизуйтесь, чтобы ваши тренировки были доступны на любом устройстве</p>
          <button type="button" className="btn workout-storage-note-btn" onClick={() => onOpenProfile?.()}>
            Войти для синхронизации
          </button>
        </div>
      ) : null}
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
      <section className="card workout-ai-cta">
        <h3 className="workout-ai-cta-title">Создай свой план с AI</h3>
        <p className="muted">Ответь на вопросы анкеты по шагам, и мы соберем недельную программу под твои параметры.</p>
        <button type="button" className="btn primary" onClick={openAiModal}>
          Создать свой план
        </button>
        {generationMessage ? <p className="workout-ai-msg">{generationMessage}</p> : null}
      </section>

      {isAiModalOpen ? (
        <div className="workout-ai-modal-overlay" role="dialog" aria-modal="true" aria-label="Анкета для создания плана">
          <div className="workout-ai-modal card">
            <div className="workout-ai-modal-head">
              <h3 className="workout-ai-form-title">AI-анкета: шаг {aiStep + 1} из 3</h3>
              <button type="button" className="workout-ai-modal-close" onClick={() => setIsAiModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="workout-ai-grid">
              {aiStep === 0 ? (
                <>
                  <label>
                    Пол
                    <select value={form.sex} onChange={(e) => updateForm("sex", e.target.value as AiProgramQuestionnaire["sex"])}>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </label>
                  <label>
                    Возраст
                    <input
                      type="number"
                      min={12}
                      max={90}
                      value={form.age}
                      onChange={(e) => updateForm("age", Number(e.target.value || 0))}
                    />
                  </label>
                </>
              ) : null}

              {aiStep === 1 ? (
                <>
                  <label>
                    Рост (см)
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={form.heightCm}
                      onChange={(e) => updateForm("heightCm", Number(e.target.value || 0))}
                    />
                  </label>
                  <label>
                    Вес (кг)
                    <input
                      type="number"
                      min={30}
                      max={250}
                      value={form.weightKg}
                      onChange={(e) => updateForm("weightKg", Number(e.target.value || 0))}
                    />
                  </label>
                  <label className="workout-ai-wide">
                    Где тренируетесь
                    <select
                      value={form.trainingPlace}
                      onChange={(e) => updateForm("trainingPlace", e.target.value as AiProgramQuestionnaire["trainingPlace"])}
                    >
                      <option value="gym">В зале</option>
                      <option value="home">Дома</option>
                    </select>
                  </label>
                </>
              ) : null}

              {aiStep === 2 ? (
                <>
                  <label>
                    Уровень
                    <select
                      value={form.level}
                      onChange={(e) => updateForm("level", e.target.value as AiProgramQuestionnaire["level"])}
                    >
                      <option value="beginner">Новичок</option>
                      <option value="intermediate">Средний</option>
                      <option value="advanced">Продвинутый</option>
                    </select>
                  </label>
                  <label>
                    Тренировок в неделю
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={form.daysPerWeek}
                      onChange={(e) => updateForm("daysPerWeek", Number(e.target.value || 1))}
                    />
                  </label>
                  <label className="workout-ai-wide">
                    Цель
                    <input type="text" value={form.goal} onChange={(e) => updateForm("goal", e.target.value)} />
                  </label>
                  <label className="workout-ai-wide">
                    Ограничения / травмы (опционально)
                    <input type="text" value={form.limitations || ""} onChange={(e) => updateForm("limitations", e.target.value)} />
                  </label>
                </>
              ) : null}
            </div>

            <div className="workout-ai-actions">
              <button type="button" className="btn" onClick={() => (aiStep === 0 ? setIsAiModalOpen(false) : setAiStep((s) => s - 1))}>
                {aiStep === 0 ? "Отмена" : "Назад"}
              </button>
              {aiStep < 2 ? (
                <button type="button" className="btn primary" onClick={() => setAiStep((s) => s + 1)}>
                  Далее
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={() => void handleGenerateProgram()} disabled={isGenerating}>
                  {isGenerating ? "Генерация..." : "Сгенерировать программу"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
