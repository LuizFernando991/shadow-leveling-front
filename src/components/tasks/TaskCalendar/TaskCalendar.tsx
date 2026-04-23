import shared from "../styles/tasks.shared.module.css";

import styles from "./TaskCalendar.module.css";

import type { TaskOccurrence } from "@/types/task";

const DAY_NAMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const LEVEL_COLORS: Record<string, string> = {
  hard: "oklch(62% 0.22 25)",
  medium: "oklch(80% 0.18 80)",
  easy: "oklch(72% 0.22 220)",
  no_rank: "oklch(45% 0.04 240)",
};

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface TaskCalendarProps {
  monthTasks: TaskOccurrence[];
  selectedDate: string;
  today: string;
  calYear: number;
  calMonth: number;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function TaskCalendar({
  monthTasks,
  selectedDate,
  today,
  calYear,
  calMonth,
  onSelect,
  onPrev,
  onNext,
}: TaskCalendarProps) {
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startWd = firstDay.getDay();
  const totalCells = Math.ceil((startWd + lastDay.getDate()) / 7) * 7;

  function cellInfo(idx: number) {
    const day = idx - startWd + 1;
    const d = new Date(calYear, calMonth, day);
    const iso = isoFromDate(d);
    const isOther = day < 1 || day > lastDay.getDate();
    const dayTasks = isOther
      ? []
      : monthTasks.filter((t) => t.occurrence_date.slice(0, 10) === iso);
    return { iso, day: d.getDate(), isOther, dayTasks };
  }

  return (
    <div className={styles.calWrap}>
      <div className={styles.scan} />
      <div className={styles.calHeader}>
        <div className={styles.calMonth}>
          {MONTH_NAMES[calMonth].toUpperCase()} {calYear}
        </div>
        <div className={styles.calNav}>
          <button className={shared.iconBtn} onClick={onPrev} type="button">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className={shared.iconBtn} onClick={onNext} type="button">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.calGrid}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={styles.calDayName}>
            {d}
          </div>
        ))}
        {Array.from({ length: totalCells }, (_, i) => {
          const { iso, day, isOther, dayTasks } = cellInfo(i);
          const isToday = iso === today;
          const isSel = iso === selectedDate;
          const completed = dayTasks.filter((t) => t.is_completed);
          const allDone =
            dayTasks.length > 0 && completed.length === dayTasks.length;
          const pending = dayTasks.filter((t) => !t.is_completed);

          return (
            <div
              key={iso}
              className={[
                styles.calDay,
                isOther ? styles.otherMonth : "",
                isToday ? styles.isToday : "",
                isSel ? styles.selected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(iso)}
            >
              <div className={styles.calDayNum}>{day}</div>
              {dayTasks.length > 0 && (
                <div className={styles.calDots}>
                  {allDone ? (
                    <div
                      className={styles.calDot}
                      style={{ background: "var(--green)" }}
                    />
                  ) : (
                    pending
                      .slice(0, 4)
                      .map((t, j) => (
                        <div
                          key={j}
                          className={styles.calDot}
                          style={{
                            background: LEVEL_COLORS[t.level] ?? "var(--muted)",
                          }}
                        />
                      ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
