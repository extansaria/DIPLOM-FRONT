import { useEffect, useState } from "react";
import {
  BarbellIcon,
  BodyweightIcon,
  CardioIcon,
  DumbbellIcon,
  FunctionalIcon,
  KettlebellIcon,
  MachineIcon,
  OpenCardIcon,
  ResetIcon,
  StretchIcon
} from "../components/icons";
import type { BodyPart, Exercise, MuscleGroupRow } from "../types";

type CatalogPageProps = {
  bodyParts: BodyPart[];
  activeBodyPart: string | null;
  onBodyPartSelect: (bodyPartId: string) => void;
  muscleGroups: MuscleGroupRow[];
  activeMuscleGroup: string | null;
  onMuscleGroupSelect: (groupId: string) => void;
  equipmentFilters: Array<
    "machine" | "free-weight" | "cardio" | "bodyweight" | "functional" | "kettlebell" | "barbell-dumbbell" | "stretching"
  >;
  onEquipmentFilterToggle: (
    value: "machine" | "free-weight" | "cardio" | "bodyweight" | "functional" | "kettlebell" | "barbell-dumbbell" | "stretching"
  ) => void;
  onResetFilters: () => void;
  isResetDisabled: boolean;
  exercises: Exercise[];
  onOpenExercise: (exercise: Exercise) => void;
};

export function CatalogPage({
  bodyParts,
  activeBodyPart,
  onBodyPartSelect,
  muscleGroups,
  activeMuscleGroup,
  onMuscleGroupSelect,
  equipmentFilters,
  onEquipmentFilterToggle,
  onResetFilters,
  isResetDisabled,
  exercises,
  onOpenExercise
}: CatalogPageProps) {
  const [isAppearing, setIsAppearing] = useState(false);

  useEffect(() => {
    setIsAppearing(true);
    const timer = window.setTimeout(() => setIsAppearing(false), 260);
    return () => window.clearTimeout(timer);
  }, [exercises, activeBodyPart, activeMuscleGroup]);

  return (
    <>
      <section className="layout-two" style={{ alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Части тела</h2>
            <div className="tags filter-tags">
              {bodyParts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={`chip ${part.id === activeBodyPart ? "active" : ""}`}
                  onClick={() => onBodyPartSelect(part.id)}
                >
                  {part.name}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Оборудование</h2>
            <div className="equipment-checklist">
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("machine")}
                  onChange={() => onEquipmentFilterToggle("machine")}
                />
                <span>{MachineIcon({ className: "ui-icon equipment-icon", size: 14 })}Тренажер</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("free-weight")}
                  onChange={() => onEquipmentFilterToggle("free-weight")}
                />
                <span>{DumbbellIcon({ className: "ui-icon equipment-icon", size: 14 })}Свободный вес</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("cardio")}
                  onChange={() => onEquipmentFilterToggle("cardio")}
                />
                <span>{CardioIcon({ className: "ui-icon equipment-icon", size: 14 })}Кардио</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("bodyweight")}
                  onChange={() => onEquipmentFilterToggle("bodyweight")}
                />
                <span>{BodyweightIcon({ className: "ui-icon equipment-icon", size: 14 })}Собственный вес</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("functional")}
                  onChange={() => onEquipmentFilterToggle("functional")}
                />
                <span>{FunctionalIcon({ className: "ui-icon equipment-icon", size: 14 })}Функционал</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("kettlebell")}
                  onChange={() => onEquipmentFilterToggle("kettlebell")}
                />
                <span>{KettlebellIcon({ className: "ui-icon equipment-icon", size: 14 })}Гири</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("barbell-dumbbell")}
                  onChange={() => onEquipmentFilterToggle("barbell-dumbbell")}
                />
                <span>{BarbellIcon({ className: "ui-icon equipment-icon", size: 14 })}Штанга / Гантели</span>
              </label>
              <label className="equipment-check">
                <input
                  type="checkbox"
                  checked={equipmentFilters.includes("stretching")}
                  onChange={() => onEquipmentFilterToggle("stretching")}
                />
                <span>{StretchIcon({ className: "ui-icon equipment-icon", size: 14 })}Растяжка</span>
              </label>
            </div>
          </div>
        </div>
        <div className="card catalog-muscle-groups-card" style={{ height: "100%" }}>
          <h2 style={{ marginTop: 0 }}>Группы мышц</h2>
          <div className="tags filter-tags catalog-muscle-groups-tags">
            {muscleGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`chip ${group.id === activeMuscleGroup ? "active" : ""}`}
                onClick={() => onMuscleGroupSelect(group.id)}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            className="btn ghost"
            onClick={onResetFilters}
            disabled={isResetDisabled}
            style={isResetDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            {ResetIcon({ className: "ui-icon", size: 14 })}
            Сбросить фильтр
          </button>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", paddingRight: "14px" }}>
        <h2 className="section-title">Список упражнений</h2>
        <p className="muted" style={{ margin: 0 }}>Показано {exercises.length}</p>
      </div>
      <div className={`card-grid smooth-appear ${isAppearing ? "is-entering" : ""}`}>
        {exercises.length === 0 ? (
          <p className="empty">По выбранному фильтру пока нет упражнений.</p>
        ) : (
          exercises.map((exercise) => (
            <article key={exercise.id} className="card catalog-card">
              <h3>{exercise.name}</h3>
              <p className="catalog-muscle-label">{exercise.muscleGroupLabel ?? exercise.muscleGroup}</p>
              <div className="exercise-preview-zone">Превью зона</div>
              <p>{exercise.description}</p>
              <div className="card-footer">
                <button type="button" className="btn primary card-open-btn" onClick={() => onOpenExercise(exercise)}>
                  {OpenCardIcon({ className: "ui-icon", size: 14 })}
                  Смотреть упражнения
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
