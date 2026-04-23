import styles from "./WorkoutListPage.module.css";

import { Button } from "@/components/ui/Button";
import { WORKOUT_DAYS } from "@/helpers/workout-split.helper";
import type { WorkoutDetail } from "@/types/workout";

interface WorkoutSummaryCardProps {
  workout: WorkoutDetail;
  onStart: () => void;
  isStarting: boolean;
  onNavigate: () => void;
  isCompletedToday: boolean;
}

export function WorkoutSummaryCard({
  workout,
  onStart,
  isStarting,
  onNavigate,
  isCompletedToday,
}: WorkoutSummaryCardProps) {
  return (
    <div className={styles.card}>
      <div
        className={styles.cardAccent}
        style={{ background: workout.active ? "var(--blue)" : "var(--muted)" }}
      />
      <div
        className={styles.cardTop}
        onClick={onNavigate}
        style={{ cursor: "pointer" }}
      >
        <div style={{ flex: 1 }}>
          <div className={styles.cardTitle}>{workout.name}</div>
          {workout.description && (
            <div className={styles.cardDesc}>{workout.description}</div>
          )}
          <div className={styles.daysRow} style={{ marginTop: "0.5rem" }}>
            {WORKOUT_DAYS.map(({ key, label }) => (
              <div
                key={key}
                className={`${styles.dayDot} ${workout.days_of_week.includes(key) ? styles.dayDotOn : ""}`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.badgeStack}>
          <span
            className={`${styles.badge} ${workout.active ? styles.badgeBlue : styles.badgeMuted}`}
          >
            {workout.active ? "ATIVO" : "INATIVO"}
          </span>
          {isCompletedToday && (
            <span className={styles.badgeDone}>FEITO HOJE</span>
          )}
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.metaText} style={{ fontSize: "0.75rem" }}>
          {workout.exercises.length} exercício
          {workout.exercises.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Button
            variant="unstyled"
            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
            onClick={(event) => {
              event.stopPropagation();
              onNavigate();
            }}
          >
            EDITAR
          </Button>
          {workout.active && (
            <Button
              variant="unstyled"
              className={`${styles.btn} ${styles.btnSm}`}
              onClick={(event) => {
                event.stopPropagation();
                onStart();
              }}
              disabled={isStarting}
              style={{ marginTop: 0 }}
            >
              {isStarting
                ? "..."
                : isCompletedToday
                  ? "↻ REPETIR"
                  : "▶ INICIAR"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
