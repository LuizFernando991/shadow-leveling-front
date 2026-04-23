import { WorkoutModal } from "../../workout/WorkoutModal/WorkoutModal";
import shared from "../styles/tasks.shared.module.css";

import styles from "./TaskDetailSheet.module.css";

import type { TaskOccurrence } from "@/types/task";

const LEVEL_META: Record<string, { badgeClass: string; label: string }> = {
  hard: { badgeClass: shared.badgeRed, label: "HIGH" },
  medium: { badgeClass: shared.badgeYellow, label: "MEDIUM" },
  easy: { badgeClass: shared.badgeBlue, label: "EASY" },
  no_rank: { badgeClass: shared.badgeMuted, label: "NO RANK" },
};

const RECUR_LABELS: Record<string, string> = {
  one_time: "Uma vez",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  custom: "Personalizado",
};

const DAY_LABELS: Record<string, string> = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

interface TaskDetailSheetProps {
  task: TaskOccurrence | null;
  open: boolean;
  onClose: () => void;
  onComplete: (id: string, occurrenceDate: string) => void;
  isPending: boolean;
}

export function TaskDetailSheet({
  task,
  open,
  onClose,
  onComplete,
  isPending,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const meta = LEVEL_META[task.level] ?? LEVEL_META.no_rank;
  const recurLabel = RECUR_LABELS[task.recurrence_type] ?? task.recurrence_type;
  const customDays = task.custom_days_of_week?.length
    ? task.custom_days_of_week.map((d) => DAY_LABELS[d] ?? d).join(", ")
    : null;

  return (
    <WorkoutModal open={open} onClose={onClose} title="DETALHES DA MISSÃO">
      {/* Title + badges */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.title}>{task.title}</div>
          <div className={styles.badges}>
            <span className={`${shared.badge} ${meta.badgeClass}`}>
              {meta.label}
            </span>
            {task.recurrence_type !== "one_time" && (
              <span className={styles.recurChip}>↺ {recurLabel}</span>
            )}
            {task.is_optional && (
              <span className={styles.optionalTag}>OPCIONAL</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Info grid */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>INÍCIO</span>
          <span className={styles.infoValue}>{fmtDate(task.initial_date)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>FIM</span>
          <span className={styles.infoValue}>{fmtDate(task.final_date)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>RECORRÊNCIA</span>
          <span className={styles.infoValue}>{recurLabel}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>OCORRÊNCIA</span>
          <span className={styles.infoValue}>
            {fmtDate(task.occurrence_date)}
          </span>
        </div>
        {customDays && (
          <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
            <span className={styles.infoLabel}>DIAS</span>
            <span className={styles.infoValue}>{customDays}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <>
          <div className={styles.divider} />
          <div className={styles.descLabel}>DESCRIÇÃO</div>
          <p className={styles.desc}>{task.description}</p>
        </>
      )}

      {/* Action */}
      {task.is_completed ? (
        <div className={styles.completedState}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          CONCLUÍDA
        </div>
      ) : (
        <button
          className={styles.completeBtn}
          type="button"
          disabled={isPending}
          onClick={() => {
            onComplete(task.id, task.occurrence_date);
            onClose();
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {isPending ? "CONCLUINDO..." : "MARCAR COMO CONCLUÍDA"}
        </button>
      )}
    </WorkoutModal>
  );
}
