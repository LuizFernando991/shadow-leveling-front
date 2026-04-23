import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import styles from "./WorkoutListPage.module.css";

import { pruneStaleSession } from "@/lib/session-storage";
import { workoutSchema, type WorkoutFormInput } from "@/schemas/workout.schema";
import { createWorkoutSession } from "@/services/workout-session.service";
import { listWorkouts, createWorkout } from "@/services/workout.service";
import type { WorkoutDetail, WeekDay } from "@/types/workout";

const DAYS: { key: WeekDay; label: string }[] = [
  { key: "monday", label: "SEG" },
  { key: "tuesday", label: "TER" },
  { key: "wednesday", label: "QUA" },
  { key: "thursday", label: "QUI" },
  { key: "friday", label: "SEX" },
];

function getTodayKey(): WeekDay | null {
  const map: Partial<Record<number, WeekDay>> = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
  };
  return map[new Date().getDay()] ?? null;
}

function exSetLabel(we: WorkoutDetail["exercises"][number]): string {
  if (we.exercise.type === "time") return `${we.sets}×${we.duration}s`;
  return `${we.sets}×${we.reps_min}${we.reps_max && we.reps_max !== we.reps_min ? `–${we.reps_max}` : ""} reps`;
}

/* ── Create workout sheet ── */
function CreateWorkoutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<WorkoutFormInput>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      description: "",
      days_of_week: [],
      active: true,
    },
  });

  const days = useWatch({ control, name: "days_of_week" }) ?? [];

  function toggleDay(key: WeekDay) {
    setValue(
      "days_of_week",
      days.includes(key) ? days.filter((d) => d !== key) : [...days, key],
    );
  }

  const createMutation = useMutation({
    mutationFn: (data: WorkoutFormInput) =>
      createWorkout({
        name: data.name,
        description: data.description || null,
        days_of_week: data.days_of_week,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      reset();
      onClose();
    },
  });

  return (
    <div
      className={`${styles.overlay} ${open ? "" : styles.overlayHidden}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>NOVO TREINO</div>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>NOME DO TREINO</label>
            <input
              className={styles.input}
              placeholder="Ex: Treino A — Peito/Tríceps"
              {...register("name")}
            />
            {errors.name && (
              <span className={styles.fieldError}>{errors.name.message}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>DESCRIÇÃO (OPCIONAL)</label>
            <textarea
              className={styles.textarea}
              placeholder="Observações..."
              {...register("description")}
            />
          </div>
          <div className={styles.sectionLabel}>DIAS DA SEMANA</div>
          <div className={styles.daysRow}>
            {DAYS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`${styles.dayPill} ${days.includes(key) ? styles.dayPillOn : ""}`}
                onClick={() => toggleDay(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.days_of_week && (
            <span className={styles.fieldError}>
              {errors.days_of_week.message}
            </span>
          )}
          <button
            type="submit"
            className={styles.btn}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "CRIANDO..." : "+ CRIAR TREINO"}
          </button>
          {createMutation.isError && (
            <p className={styles.serverError}>{createMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── Today card ── */
interface TodayCardProps {
  workout: WorkoutDetail;
  onStart: () => void;
  isStarting: boolean;
  onNavigate: () => void;
}

function TodayCard({
  workout,
  onStart,
  isStarting,
  onNavigate,
}: TodayCardProps) {
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
              {workout.exercises.reduce((a, e) => a + e.sets, 0)} séries
            </span>
          </div>
        </div>
        <span className={styles.badgeBlue}>HOJE</span>
      </div>

      <div className={styles.exPreview}>
        {workout.exercises
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .slice(0, 4)
          .map((we, i) => (
            <div key={we.id} className={styles.exPreviewRow}>
              <span className={styles.exPreviewNum}>
                {String(i + 1).padStart(2, "0")}
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

      <button
        className={`${styles.btn} ${styles.btnGreen}`}
        onClick={onStart}
        disabled={isStarting}
      >
        {isStarting ? "INICIANDO..." : "⚡ INICIAR SESSÃO"}
      </button>
    </div>
  );
}

/* ── Regular workout card ── */
interface WorkoutCardProps {
  workout: WorkoutDetail;
  onStart?: () => void;
  isStarting?: boolean;
  onNavigate: () => void;
}

function WorkoutCard({
  workout,
  onStart,
  isStarting,
  onNavigate,
}: WorkoutCardProps) {
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
            {DAYS.map(({ key, label }) => (
              <div
                key={key}
                className={`${styles.dayDot} ${workout.days_of_week.includes(key) ? styles.dayDotOn : ""}`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <span
          className={`${styles.badge} ${workout.active ? styles.badgeGreen : styles.badgeMuted}`}
        >
          {workout.active ? "ATIVO" : "INATIVO"}
        </span>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.metaText} style={{ fontSize: "0.75rem" }}>
          {workout.exercises.length} exercício
          {workout.exercises.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            EDITAR
          </button>
          {onStart && workout.active && (
            <button
              className={`${styles.btn} ${styles.btnSm}`}
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              disabled={isStarting}
              style={{ marginTop: 0 }}
            >
              {isStarting ? "..." : "▶ INICIAR"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export function WorkoutListPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Prune stale localStorage session on page load
  pruneStaleSession();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: listWorkouts,
  });

  const startSessionMutation = useMutation({
    mutationFn: (workoutId: string) =>
      createWorkoutSession({
        workout_id: workoutId,
        date: new Date().toISOString(),
        status: "incomplete",
      }),
    onSuccess: (session, workoutId) => {
      setStartingId(null);
      navigate({
        to: "/workout/$workoutId/session",
        params: { workoutId },
        search: { sessionId: session.id },
      });
    },
    onError: () => setStartingId(null),
  });

  function startSession(workoutId: string) {
    setStartingId(workoutId);
    startSessionMutation.mutate(workoutId);
  }

  const today = getTodayKey();
  const todayWorkouts = workouts.filter(
    (w) => w.active && today && w.days_of_week.includes(today),
  );
  const otherWorkouts = workouts.filter((w) => !todayWorkouts.includes(w));

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.iconBtn}
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
          <span className={styles.topbarTitle}>SHADOW GYM</span>
        </div>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          style={{ marginTop: 0 }}
          onClick={() => setShowCreate(true)}
        >
          + NOVO
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.greeting}>
          <div className={styles.greetingTitle}>MEUS TREINOS</div>
          <div className={styles.greetingDate}>{dateStr}</div>
        </div>

        {isLoading && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>CARREGANDO...</div>
          </div>
        )}

        {!isLoading && workouts.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>NENHUM TREINO</div>
            <div className={styles.emptyDesc}>Crie seu primeiro treino</div>
          </div>
        )}

        {todayWorkouts.length > 0 && (
          <>
            <div className={styles.sectionLabel}>TREINO DE HOJE</div>
            {todayWorkouts.map((w) => (
              <TodayCard
                key={w.id}
                workout={w}
                onStart={() => startSession(w.id)}
                isStarting={startingId === w.id}
                onNavigate={() =>
                  navigate({
                    to: "/workout/$workoutId",
                    params: { workoutId: w.id },
                  })
                }
              />
            ))}
          </>
        )}

        {todayWorkouts.length === 0 && !isLoading && (
          <>
            <div className={styles.sectionLabel}>HOJE</div>
            <div className={styles.restCard}>
              <div className={styles.restIcon}>☽ ☽</div>
              <div className={styles.restTitle}>DIA DE DESCANSO</div>
              <div className={styles.restDesc}>
                Nenhum treino planejado para hoje
              </div>
            </div>
          </>
        )}

        {otherWorkouts.length > 0 && (
          <>
            <div
              className={styles.sectionLabel}
              style={{ marginTop: "0.5rem" }}
            >
              {todayWorkouts.length > 0 ? "OUTROS TREINOS" : "TODOS OS TREINOS"}
            </div>
            {otherWorkouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onStart={() => startSession(w.id)}
                isStarting={startingId === w.id}
                onNavigate={() =>
                  navigate({
                    to: "/workout/$workoutId",
                    params: { workoutId: w.id },
                  })
                }
              />
            ))}
          </>
        )}
      </div>

      <button
        className={styles.fab}
        onClick={() => setShowCreate(true)}
        aria-label="Novo treino"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <CreateWorkoutSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
