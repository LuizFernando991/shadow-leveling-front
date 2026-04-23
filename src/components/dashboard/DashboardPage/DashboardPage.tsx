import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import styles from "./DashboardPage.module.css";

import { useAuth } from "@/hooks/useAuth";
import { getTodayMissions } from "@/services/dashboard.service";
import { completeTask } from "@/services/task.service";
import type { TaskMission, WorkoutMission } from "@/types/dashboard";

const LEVEL_META: Record<
  string,
  { stripe: string; badgeClass: string; label: string }
> = {
  hard: {
    stripe: "oklch(62% 0.22 25)",
    badgeClass: styles.taskBadgeRed,
    label: "HIGH",
  },
  medium: {
    stripe: "oklch(80% 0.18 80)",
    badgeClass: styles.taskBadgeYellow,
    label: "MEDIUM",
  },
  easy: {
    stripe: "oklch(72% 0.22 220)",
    badgeClass: styles.taskBadgeBlue,
    label: "EASY",
  },
  no_rank: {
    stripe: "oklch(45% 0.04 240)",
    badgeClass: styles.taskBadgeMuted,
    label: "NO RANK",
  },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "BOM DIA";
  if (h >= 12 && h < 18) return "BOA TARDE";
  return "BOA NOITE";
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const size = 80;
  const strokeWidth = 5;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="oklch(72% 0.22 220 / 0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        style={{
          transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </svg>
  );
}

function WorkoutItem({
  item,
  onNavigate,
}: {
  item: WorkoutMission;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className={styles.workoutItem}>
      <div className={styles.workoutItemRow}>
        <div className={styles.workoutItemIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 5v14M6 5l3 3M6 5l-3 3M18 19V5M18 19l3-3M18 19l-3-3" />
          </svg>
        </div>
        <div className={styles.workoutItemInfo}>
          <div className={styles.workoutItemName}>{item.name}</div>
          {item.description && (
            <div className={styles.workoutItemDesc}>{item.description}</div>
          )}
        </div>
        <span
          className={`${styles.badge} ${item.is_completed ? styles.badgeGreen : styles.badgePending}`}
        >
          {item.is_completed ? "FEITO" : "PENDENTE"}
        </span>
      </div>
      <div className={styles.workoutItemCta}>
        <button
          type="button"
          className={styles.workoutBtn}
          onClick={() => onNavigate(item.id)}
        >
          {item.is_completed ? "↩ VER TREINO" : "⚡ INICIAR SESSÃO"}
        </button>
      </div>
    </div>
  );
}

function TaskItem({
  item,
  onComplete,
  isPending,
}: {
  item: TaskMission;
  onComplete: (id: string, date: string) => void;
  isPending: boolean;
}) {
  const meta = LEVEL_META[item.level] ?? LEVEL_META.no_rank;
  return (
    <div
      className={`${styles.taskItem} ${item.is_completed ? styles.taskItemDone : ""}`}
    >
      <div className={styles.taskStripe} style={{ background: meta.stripe }} />
      <button
        type="button"
        className={`${styles.taskDot} ${item.is_completed ? styles.taskDotDone : ""} ${item.is_completed || isPending ? styles.taskDotDisabled : ""}`}
        onClick={() => {
          if (!item.is_completed && !isPending) {
            onComplete(item.id, item.occurrence_date);
          }
        }}
      >
        {item.is_completed && (
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
      <div className={styles.taskItemBody}>
        <div className={styles.taskItemTitle}>{item.title}</div>
        <div className={styles.taskItemMeta}>
          <span className={`${styles.badge} ${meta.badgeClass}`}>
            {meta.label}
          </span>
          {item.is_optional && (
            <span className={styles.optionalTag}>OPCIONAL</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["today-missions"],
    queryFn: getTodayMissions,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      completeTask(id, date),
    onSuccess: (_data, vars) => {
      const dateOnly = vars.date.slice(0, 10);
      queryClient.invalidateQueries({ queryKey: ["today-missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-day", dateOnly] });
      const [y, m] = dateOnly.split("-").map(Number);
      queryClient.invalidateQueries({
        queryKey: ["tasks-month", y, m],
      });
    },
  });

  const pendingTaskId = completeMutation.isPending
    ? completeMutation.variables?.id
    : null;

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const progress = data?.progress;
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;
  const pending = progress?.pending ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && pending === 0;

  const ringColor = allDone
    ? "var(--green)"
    : pct > 60
      ? "var(--blue)"
      : "var(--purple)";

  const userHandle = user?.email.split("@")[0].toUpperCase() ?? "CAÇADOR";

  const workoutItems = data?.workouts.items ?? [];
  const taskItems = data?.tasks.items ?? [];
  const tasksDone = data?.tasks.progress.completed ?? 0;
  const tasksTotal = data?.tasks.progress.total ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.logo}>SHADOW GYM</div>
        <div className={styles.topbarRight}>
          <div className={styles.rankHex}>B</div>
          <div className={styles.userName}>{userHandle}</div>
        </div>
      </div>

      <div className={`${styles.content} ${styles.fadeUp}`}>
        {/* Hero */}
        <div className={styles.heroGreeting}>{getGreeting()}, CAÇADOR</div>
        <div className={styles.heroDate}>{dateStr}</div>

        {isLoading ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>CARREGANDO...</div>
          </div>
        ) : (
          <>
            {/* Overview card */}
            <div className={styles.overviewCard}>
              <div className={styles.scanLine} />
              <div className={styles.overviewTop}>
                <div>
                  <div className={styles.overviewLabel}>PROGRESSO DO DIA</div>
                  <div
                    className={styles.overviewFraction}
                    style={{
                      color: allDone ? "var(--green)" : "var(--blue)",
                      filter: allDone
                        ? "drop-shadow(0 0 12px var(--green))"
                        : "none",
                    }}
                  >
                    {completed}
                    <span className={styles.overviewFractionTotal}>
                      {" "}
                      / {total}
                    </span>
                  </div>
                  <div className={styles.overviewSub}>
                    {allDone
                      ? "✓ Tudo concluído hoje!"
                      : `${pending} ${pending === 1 ? "item restante" : "itens restantes"}`}
                  </div>
                </div>
                <div className={styles.ringWrap}>
                  <ProgressRing pct={pct} color={ringColor} />
                  <div className={styles.ringPct}>
                    <div
                      className={styles.ringPctNum}
                      style={{ color: ringColor }}
                    >
                      {pct}%
                    </div>
                    <div className={styles.ringPctLbl}>HOJE</div>
                  </div>
                </div>
              </div>
              <div className={styles.progScale}>
                <span>0</span>
                <span>{total}</span>
              </div>
              <div className={styles.progTrack}>
                <div
                  className={styles.progFill}
                  style={{
                    width: `${pct}%`,
                    background: allDone
                      ? "linear-gradient(90deg, var(--green), oklch(72% 0.22 220))"
                      : "linear-gradient(90deg, var(--purple), var(--blue))",
                    boxShadow: allDone
                      ? "0 0 10px var(--green)"
                      : "0 0 10px var(--blue)",
                  }}
                />
              </div>
            </div>

            {/* Stat boxes */}
            <div className={styles.statRow}>
              <div className={`${styles.statBox} ${styles.statBoxTotal}`}>
                <div
                  className={styles.statVal}
                  style={{ color: "var(--blue)" }}
                >
                  {total}
                </div>
                <div className={styles.statLbl}>TOTAL</div>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxDone}`}>
                <div
                  className={styles.statVal}
                  style={{ color: "var(--green)" }}
                >
                  {completed}
                </div>
                <div className={styles.statLbl}>FEITOS</div>
              </div>
              <div className={`${styles.statBox} ${styles.statBoxLeft}`}>
                <div
                  className={styles.statVal}
                  style={{
                    color: pending === 0 ? "var(--muted)" : "var(--red)",
                  }}
                >
                  {pending}
                </div>
                <div className={styles.statLbl}>FALTAM</div>
              </div>
            </div>

            {/* All-done banner */}
            {allDone && (
              <div className={styles.completeBanner}>
                <div className={styles.completeBannerTitle}>
                  ✓ MISSÃO CUMPRIDA
                </div>
                <div className={styles.completeBannerSub}>
                  Você completou todos os objetivos de hoje, Caçador
                </div>
              </div>
            )}

            {/* Workout section */}
            <div className={styles.sectionLabel}>TREINO DO DIA</div>
            {workoutItems.length === 0 ? (
              <div className={styles.restCard}>
                <div className={styles.restNum}>☽ ☽</div>
                <div className={styles.restTitle}>DIA DE DESCANSO</div>
                <div className={styles.restDesc}>
                  Nenhum treino planejado para hoje
                </div>
              </div>
            ) : (
              workoutItems.map((w) => (
                <WorkoutItem
                  key={w.id}
                  item={w}
                  onNavigate={(id) =>
                    navigate({
                      to: "/workout/$workoutId",
                      params: { workoutId: id },
                    })
                  }
                />
              ))
            )}

            {/* Tasks section */}
            <div
              className={styles.sectionLabel}
              style={{ marginTop: "0.25rem" }}
            >
              MISSÕES DO DIA
              <span
                className={styles.sectionCount}
                style={{
                  color:
                    tasksDone === tasksTotal && tasksTotal > 0
                      ? "var(--green)"
                      : "var(--blue)",
                }}
              >
                {tasksDone}/{tasksTotal}
              </span>
            </div>
            {taskItems.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>SEM MISSÕES HOJE</div>
              </div>
            ) : (
              taskItems.map((t) => (
                <TaskItem
                  key={t.id}
                  item={t}
                  onComplete={(id, date) =>
                    completeMutation.mutate({ id, date })
                  }
                  isPending={t.id === pendingTaskId}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
