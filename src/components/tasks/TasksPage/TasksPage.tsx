import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import shared from "../styles/tasks.shared.module.css";
import { TaskCalendar } from "../TaskCalendar/TaskCalendar";
import { TaskCard } from "../TaskCard/TaskCard";
import { TaskDetailSheet } from "../TaskDetailSheet/TaskDetailSheet";
import { TaskFormSheet } from "../TaskFormSheet/TaskFormSheet";

import styles from "./TasksPage.module.css";

import {
  completeTask,
  getTasksForDay,
  getTasksForMonth,
} from "@/services/task.service";
import type { TaskOccurrence } from "@/types/task";

const MONTH_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const DAY_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const LEVEL_META: Record<string, { color: string; label: string }> = {
  hard: { color: "oklch(62% 0.22 25)", label: "HIGH" },
  medium: { color: "oklch(80% 0.18 80)", label: "MEDIUM" },
  easy: { color: "oklch(72% 0.22 220)", label: "EASY" },
  no_rank: { color: "var(--muted)", label: "NO RANK" },
};

const LEVEL_ORDER: Record<string, number> = {
  hard: 0,
  medium: 1,
  easy: 2,
  no_rank: 3,
};

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type StatusFilter = "all" | "pending" | "completed";
type LevelFilter = "all" | "hard" | "medium" | "easy" | "no_rank";

export function TasksPage() {
  const today = isoToday();
  const now = new Date();

  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskOccurrence | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const monthQuery = useQuery({
    queryKey: ["tasks-month", calYear, calMonth + 1],
    queryFn: () => getTasksForMonth(calYear, calMonth + 1),
  });

  const dayQuery = useQuery({
    queryKey: ["tasks-day", selectedDate],
    queryFn: () => getTasksForDay(selectedDate),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      completeTask(id, date),
    onSuccess: (_data, vars) => {
      const dateOnly = vars.date.slice(0, 10);
      queryClient.invalidateQueries({ queryKey: ["tasks-day", dateOnly] });
      const d = parseIso(dateOnly);
      queryClient.invalidateQueries({
        queryKey: ["tasks-month", d.getFullYear(), d.getMonth() + 1],
      });
    },
  });

  function handleCalSelect(iso: string) {
    setSelectedDate(iso);
    const d = parseIso(iso);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  }

  const allDayTasks: TaskOccurrence[] = dayQuery.data ?? [];
  const doneTasks = allDayTasks.filter((t) => t.is_completed);
  const pct =
    allDayTasks.length > 0
      ? Math.round((doneTasks.length / allDayTasks.length) * 100)
      : 0;

  let filtered = allDayTasks;
  if (statusFilter === "pending")
    filtered = filtered.filter((t) => !t.is_completed);
  if (statusFilter === "completed")
    filtered = filtered.filter((t) => t.is_completed);
  if (levelFilter !== "all")
    filtered = filtered.filter((t) => t.level === levelFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return (LEVEL_ORDER[a.level] ?? 3) - (LEVEL_ORDER[b.level] ?? 3);
  });

  const dateObj = parseIso(selectedDate);
  const isToday = selectedDate === today;
  const dateLabel = `${DAY_SHORT[dateObj.getDay()]} · ${String(dateObj.getDate()).padStart(2, "0")} ${MONTH_SHORT[dateObj.getMonth()]}${isToday ? " · HOJE" : ""}`;

  const pendingId = completeMutation.isPending
    ? completeMutation.variables?.id
    : null;

  return (
    <div className={shared.page}>
      {/* Topbar */}
      <div className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <button
            className={shared.iconBtn}
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </button>
          <span className={shared.topbarTitle}>MISSÕES</span>
        </div>
        <div className={shared.topbarRight}>
          {selectedDate !== today && (
            <button
              className={shared.iconBtn}
              type="button"
              onClick={() => handleCalSelect(today)}
              title="Hoje"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>
          )}
          <button
            className={shared.iconBtn}
            type="button"
            onClick={() => setSheetOpen(true)}
            title="Nova missão"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${styles.content} ${styles.fadeUp}`}>
        {/* Calendar */}
        <TaskCalendar
          monthTasks={monthQuery.data ?? []}
          selectedDate={selectedDate}
          today={today}
          calYear={calYear}
          calMonth={calMonth}
          onSelect={handleCalSelect}
          onPrev={prevMonth}
          onNext={nextMonth}
        />

        {/* Day header */}
        <div className={styles.dayHeader}>
          <div>
            <div className={styles.dayLabel}>{dateLabel}</div>
            <div className={styles.daySub}>
              {dayQuery.isLoading
                ? "Carregando..."
                : `${doneTasks.length}/${allDayTasks.length} concluídas`}
            </div>
          </div>
          {allDayTasks.length > 0 && (
            <div>
              <div
                className={styles.dayPct}
                style={{
                  color:
                    pct === 100
                      ? "var(--green)"
                      : pct > 50
                        ? "var(--blue)"
                        : "var(--muted)",
                  filter:
                    pct === 100 ? "drop-shadow(0 0 8px var(--green))" : "none",
                }}
              >
                {pct}%
              </div>
              <div className={styles.dayPctSub}>PROGRESSO</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {allDayTasks.length > 0 && (
          <div className={styles.progTrack}>
            <div
              className={styles.progFill}
              style={{
                width: `${pct}%`,
                background:
                  pct === 100
                    ? "linear-gradient(90deg, var(--green), oklch(72% 0.22 220))"
                    : "linear-gradient(90deg, var(--purple), var(--blue))",
                boxShadow:
                  pct === 100 ? "0 0 8px var(--green)" : "0 0 8px var(--blue)",
              }}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className={styles.filterTabs}>
          {(
            [
              ["all", "TODAS", allDayTasks.length],
              [
                "pending",
                "PENDENTES",
                allDayTasks.filter((t) => !t.is_completed).length,
              ],
              ["completed", "FEITAS", doneTasks.length],
            ] as const
          ).map(([v, label, count]) => (
            <button
              key={v}
              type="button"
              className={`${styles.filterTab} ${statusFilter === v ? styles.filterTabActive : ""}`}
              onClick={() => setStatusFilter(v)}
            >
              {label} <span className={styles.tabCount}>{count}</span>
            </button>
          ))}

          {Object.entries(LEVEL_META).map(([v, m]) => {
            const active = levelFilter === v;
            return (
              <button
                key={v}
                type="button"
                className={`${styles.filterTab} ${active ? styles.filterTabActive : ""}`}
                style={active ? { borderColor: m.color, color: m.color } : {}}
                onClick={() =>
                  setLevelFilter(active ? "all" : (v as LevelFilter))
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Task list */}
        {dayQuery.isLoading ? (
          <div className={shared.empty}>
            <div className={shared.emptyTitle}>CARREGANDO...</div>
          </div>
        ) : sorted.length === 0 ? (
          <div className={shared.empty}>
            <div className={shared.emptyIcon}>○ ○</div>
            <div className={shared.emptyTitle}>
              {allDayTasks.length === 0 ? "SEM MISSÕES" : "NENHUM RESULTADO"}
            </div>
            <div className={shared.emptyDesc}>
              {allDayTasks.length === 0
                ? "Nenhuma missão para este dia"
                : "Mude os filtros acima"}
            </div>
          </div>
        ) : (
          sorted.map((task) => (
            <TaskCard
              key={`${task.id}-${task.occurrence_date}`}
              task={task}
              onComplete={(id, date) => completeMutation.mutate({ id, date })}
              onViewDetail={setDetailTask}
              isPending={task.id === pendingId}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        className={shared.fab}
        type="button"
        onClick={() => setSheetOpen(true)}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>NOVA MISSÃO</span>
      </button>

      <TaskFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultDate={selectedDate}
      />

      <TaskDetailSheet
        task={detailTask}
        open={detailTask !== null}
        onClose={() => setDetailTask(null)}
        onComplete={(id, date) => completeMutation.mutate({ id, date })}
        isPending={detailTask?.id === pendingId}
      />
    </div>
  );
}
