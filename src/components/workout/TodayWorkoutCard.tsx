import styles from "./WorkoutListPage.module.css";

import { Button } from "@/components/ui/Button";
import { exSetLabel } from "@/helpers/workout-split.helper";
import type { WorkoutDetail } from "@/types/workout";

interface TodayWorkoutCardProps {
  workout: WorkoutDetail;
  onStart: () => void;
  isStarting: boolean;
  onNavigate: () => void;
  isCompletedToday: boolean;
}

export function TodayWorkoutCard({
  workout,
  onStart,
  isStarting,
  onNavigate,
  isCompletedToday,
}: TodayWorkoutCardProps) {
  return (
    <div className={styles.todayCard}>
      <div className={styles.todayAccent} />
      <div className={styles.scanLine} />
      <div className={styles.cardTop}>
        <div onClick={onNavigate} style={{ cursor: "pointer", flex: 1 }}>
          <div className={styles.cardTitle}>{workout.name}</div>
          {workout.description && (
            <div className={styles.cardDesc}>{workout.description}</div>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaText}>
              {workout.exercises.length} exercício
              {workout.exercises.length !== 1 ? "s" : ""}
            </span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaText}>
              {workout.exercises.reduce(
                (acc, exercise) => acc + exercise.sets,
                0,
              )}{" "}
              séries
            </span>
          </div>
        </div>
        <div className={styles.badgeStack}>
          <span className={styles.badgeBlue}>HOJE</span>
          {isCompletedToday && <span className={styles.badgeDone}>FEITO</span>}
        </div>
      </div>

      <div className={styles.exPreview}>
        {workout.exercises
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .slice(0, 4)
          .map((we, index) => (
            <div key={we.id} className={styles.exPreviewRow}>
              <span className={styles.exPreviewNum}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.exPreviewName}>{we.exercise.name}</span>
              <span className={styles.exPreviewSets}>{exSetLabel(we)}</span>
            </div>
          ))}
        {workout.exercises.length > 4 && (
          <div className={styles.exPreviewMore}>
            +{workout.exercises.length - 4} mais...
          </div>
        )}
      </div>

      <Button
        variant="unstyled"
        className={`${styles.btn}`}
        onClick={onStart}
        disabled={isStarting}
      >
        {isStarting
          ? "INICIANDO..."
          : isCompletedToday
            ? "TREINAR NOVAMENTE"
            : "INICIAR SESSÃO"}
      </Button>
    </div>
  );
}
