import shared from "../styles/tasks.shared.module.css";

import styles from "./TaskCard.module.css";

import type { TaskOccurrence } from "@/types/task";

const LEVEL_META: Record<
  string,
  { stripe: string; badgeClass: string; label: string }
> = {
  hard: {
    stripe: "oklch(62% 0.22 25)",
    badgeClass: shared.badgeRed,
    label: "HIGH",
  },
  medium: {
    stripe: "oklch(80% 0.18 80)",
    badgeClass: shared.badgeYellow,
    label: "MEDIUM",
  },
  easy: {
    stripe: "oklch(72% 0.22 220)",
    badgeClass: shared.badgeBlue,
    label: "EASY",
  },
  no_rank: {
    stripe: "oklch(45% 0.04 240)",
    badgeClass: shared.badgeMuted,
    label: "NO RANK",
  },
};

const RECUR_LABELS: Record<string, string> = {
  daily: "DIÁRIO",
  weekly: "SEMANAL",
  monthly: "MENSAL",
  custom: "PERSONALIZADO",
};

interface TaskCardProps {
  task: TaskOccurrence;
  onComplete: (id: string, occurrenceDate: string) => void;
  onViewDetail: (task: TaskOccurrence) => void;
  isPending: boolean;
}

export function TaskCard({
  task,
  onComplete,
  onViewDetail,
  isPending,
}: TaskCardProps) {
  const meta = LEVEL_META[task.level] ?? LEVEL_META.no_rank;
  const recurLabel = RECUR_LABELS[task.recurrence_type];

  return (
    <div
      className={`${styles.card} ${task.is_completed ? styles.completed : ""}`}
      onClick={() => onViewDetail(task)}
    >
      <div className={styles.levelStripe} style={{ background: meta.stripe }} />
      <button
        className={[
          styles.checkBtn,
          task.is_completed ? styles.checkDone : "",
          task.is_completed || isPending ? styles.checkDisabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          if (!task.is_completed && !isPending) {
            onComplete(task.id, task.occurrence_date);
          }
        }}
        type="button"
      >
        {task.is_completed && (
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className={styles.body}>
        <div className={styles.title}>{task.title}</div>
        <div className={styles.meta}>
          <span className={`${shared.badge} ${meta.badgeClass}`}>
            {meta.label}
          </span>
          {recurLabel && (
            <span className={styles.recurChip}>↺ {recurLabel}</span>
          )}
          {task.is_optional && (
            <span className={styles.optionalTag}>OPCIONAL</span>
          )}
        </div>
        {task.description && (
          <div className={styles.desc}>{task.description}</div>
        )}
      </div>
    </div>
  );
}
