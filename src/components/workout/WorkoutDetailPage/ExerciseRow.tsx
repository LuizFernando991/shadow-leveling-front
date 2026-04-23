import shared from "../styles/workout.shared.module.css";

import styles from "./WorkoutDetailPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { exSetLabel } from "@/helpers/workout-split.helper";
import type { WorkoutExercise } from "@/types/workout";

interface ExerciseRowProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  isReordering: boolean;
  isRemoving: boolean;
  onEdit: (exercise: WorkoutExercise) => void;
  onMove: (exerciseId: string, direction: -1 | 1) => void;
  onRemove: (exerciseId: string) => void;
}

export function ExerciseRow({
  exercise,
  index,
  totalExercises,
  isReordering,
  isRemoving,
  onEdit,
  onMove,
  onRemove,
}: ExerciseRowProps) {
  return (
    <div className={styles.exRow} onClick={() => onEdit(exercise)}>
      <span className={styles.exNum}>{String(index + 1).padStart(2, "0")}</span>
      <div className={styles.exInfo}>
        <div className={styles.exName}>{exercise.exercise.name}</div>
        <div className={styles.exDetail}>
          {exSetLabel(exercise)} ·{" "}
          {exercise.exercise.type === "time" ? "Tempo" : "Repetições"}
          {exercise.note ? ` · ${exercise.note}` : ""}
        </div>
      </div>
      <div className={styles.exActions}>
        <Button
          variant="unstyled"
          className={styles.orderBtn}
          onClick={(event) => {
            event.stopPropagation();
            onMove(exercise.id, -1);
          }}
          disabled={isReordering || index === 0}
          aria-label="Mover para cima"
        >
          ↑
        </Button>
        <Button
          variant="unstyled"
          className={styles.orderBtn}
          onClick={(event) => {
            event.stopPropagation();
            onMove(exercise.id, 1);
          }}
          disabled={isReordering || index === totalExercises - 1}
          aria-label="Mover para baixo"
        >
          ↓
        </Button>
        <Button
          variant="unstyled"
          className={shared.iconBtn}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(exercise.id);
          }}
          disabled={isRemoving}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
