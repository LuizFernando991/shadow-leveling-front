import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import styles from "./WorkoutDetailPage.module.css";

import { workoutSchema, type WorkoutFormInput } from "@/schemas/workout.schema";
import { listExercises } from "@/services/exercise.service";
import { createWorkoutSession } from "@/services/workout-session.service";
import {
  getWorkout,
  updateWorkout,
  deleteWorkout,
  addWorkoutExercise,
  updateWorkoutExercise,
  removeWorkoutExercise,
} from "@/services/workout.service";
import type { Exercise } from "@/types/exercise";
import type { WorkoutDetail, WorkoutExercise, WeekDay } from "@/types/workout";

const DAYS: { key: WeekDay; label: string }[] = [
  { key: "monday", label: "SEG" },
  { key: "tuesday", label: "TER" },
  { key: "wednesday", label: "QUA" },
  { key: "thursday", label: "QUI" },
  { key: "friday", label: "SEX" },
];

function setLabel(we: WorkoutExercise): string {
  if (we.exercise.type === "time") return `${we.sets}×${we.duration}s`;
  return `${we.sets}×${we.reps_min}${we.reps_max && we.reps_max !== we.reps_min ? `–${we.reps_max}` : ""} reps`;
}

/* ── Edit workout sheet — receives workout directly to avoid form empty-on-open ── */
interface EditSheetProps {
  open: boolean;
  onClose: () => void;
  workout: WorkoutDetail;
}

function EditWorkoutSheet({ open, onClose, workout }: EditSheetProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<WorkoutFormInput>({
    resolver: zodResolver(workoutSchema),
    values: {
      name: workout.name,
      description: workout.description ?? "",
      days_of_week: workout.days_of_week,
      active: workout.active,
    },
  });

  const days = useWatch({ control, name: "days_of_week" }) ?? [];
  const active = useWatch({ control, name: "active" });

  function toggleDay(key: WeekDay) {
    setValue(
      "days_of_week",
      days.includes(key) ? days.filter((d) => d !== key) : [...days, key],
    );
  }

  const updateMutation = useMutation({
    mutationFn: (data: WorkoutFormInput) => updateWorkout(workout.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workout.id] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkout(workout.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      navigate({ to: "/workout" });
    },
  });

  return (
    <div
      className={`${styles.overlay} ${open ? "" : styles.overlayHidden}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>EDITAR TREINO</div>
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>NOME DO TREINO</label>
            <input className={styles.input} {...register("name")} />
            {errors.name && (
              <span className={styles.fieldError}>{errors.name.message}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>DESCRIÇÃO (OPCIONAL)</label>
            <textarea
              className={styles.textarea}
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

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>TREINO ATIVO</div>
              <div className={styles.toggleDesc}>
                Aparece no planejamento semanal
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={active ?? true}
                onChange={(e) => setValue("active", e.target.checked)}
              />
              <div className={styles.toggleTrack} />
              <div className={styles.toggleThumb} />
            </label>
          </div>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            ✕ EXCLUIR TREINO
          </button>
          <button
            type="submit"
            className={styles.btn}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "SALVANDO..." : "✓ SALVAR ALTERAÇÕES"}
          </button>
          {updateMutation.isError && (
            <p className={styles.serverError}>{updateMutation.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── Add / edit exercise sheet ── */
interface ExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  workoutId: string;
  exerciseCount: number;
  editing: WorkoutExercise | null;
}

function ExerciseSheet({
  open,
  onClose,
  workoutId,
  exerciseCount,
  editing,
}: ExerciseSheetProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(
    editing?.exercise ?? null,
  );
  const [sets, setSets] = useState(String(editing?.sets ?? 3));
  const [repsMin, setRepsMin] = useState(String(editing?.reps_min ?? 8));
  const [repsMax, setRepsMax] = useState(String(editing?.reps_max ?? 12));
  const [duration, setDuration] = useState(String(editing?.duration ?? 60));
  const [note, setNote] = useState(editing?.note ?? "");

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => listExercises(),
    enabled: open,
  });

  const isTime = selectedEx?.type === "time";
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  function buildData() {
    return {
      exercise_id: selectedEx!.id,
      sets: parseInt(sets) || 3,
      reps_min: isTime ? null : parseInt(repsMin) || null,
      reps_max: isTime ? null : parseInt(repsMax) || null,
      duration: isTime ? parseInt(duration) || null : null,
      note: note || null,
    };
  }

  const addMutation = useMutation({
    mutationFn: () =>
      addWorkoutExercise(workoutId, {
        ...buildData(),
        sort_order: exerciseCount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      handleClose();
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateWorkoutExercise(workoutId, editing!.id, buildData()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      handleClose();
    },
  });

  function handleClose() {
    setSearch("");
    setSelectedEx(null);
    onClose();
  }

  function save() {
    if (!selectedEx && !editing) return;
    if (editing) {
      editMutation.mutate();
    } else {
      addMutation.mutate();
    }
  }

  const isPending = addMutation.isPending || editMutation.isPending;
  const error = addMutation.error ?? editMutation.error;

  return (
    <div
      className={`${styles.overlay} ${open ? "" : styles.overlayHidden}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>
          {editing ? "EDITAR EXERCÍCIO" : "ADICIONAR EXERCÍCIO"}
        </div>

        {!editing && (
          <>
            <div className={styles.searchBar}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Buscar exercício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.exList}>
              {filtered.map((ex) => (
                <div
                  key={ex.id}
                  className={`${styles.exPickItem} ${selectedEx?.id === ex.id ? styles.exPickItemSel : ""}`}
                  onClick={() => setSelectedEx(ex)}
                >
                  <div className={styles.exTypeIcon}>
                    {ex.type === "time" ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 5v14M6 5l3 3M6 5l-3 3M18 19V5M18 19l3-3M18 19l-3-3" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={styles.exPickName}>{ex.name}</div>
                    <div className={styles.exPickDetail}>
                      {ex.type === "time" ? "Tempo" : "Repetições"} · {ex.unit}
                    </div>
                  </div>
                  {selectedEx?.id === ex.id && (
                    <span className={styles.exPickCheck}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {(selectedEx ?? editing) && (
          <>
            {selectedEx && (
              <div className={styles.selectedExBadge}>{selectedEx.name}</div>
            )}
            <div className={styles.inputGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>SÉRIES</label>
                <input
                  className={styles.input}
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  min="1"
                />
              </div>
              {!isTime ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>REPS MÍN</label>
                    <input
                      className={styles.input}
                      type="number"
                      value={repsMin}
                      onChange={(e) => setRepsMin(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>REPS MÁX</label>
                    <input
                      className={styles.input}
                      type="number"
                      value={repsMax}
                      onChange={(e) => setRepsMax(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>TEMPO (SEG)</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>NOTA (OPCIONAL)</label>
              <input
                className={styles.input}
                placeholder="Ex: Controlar descida..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </>
        )}

        <button
          className={styles.btn}
          onClick={save}
          disabled={isPending || (!selectedEx && !editing)}
        >
          {isPending ? "SALVANDO..." : editing ? "✓ SALVAR" : "+ ADICIONAR"}
        </button>
        {error && <p className={styles.serverError}>{error.message}</p>}
      </div>
    </div>
  );
}

/* ── Main page ── */
interface WorkoutDetailPageProps {
  workoutId: string;
}

export function WorkoutDetailPage({ workoutId }: WorkoutDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddEx, setShowAddEx] = useState(false);
  const [editingWE, setEditingWE] = useState<WorkoutExercise | null>(null);

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => getWorkout(workoutId),
  });

  const removeExMutation = useMutation({
    mutationFn: (weId: string) => removeWorkoutExercise(workoutId, weId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: () =>
      createWorkoutSession({
        workout_id: workoutId,
        date: new Date().toISOString(),
        status: "incomplete",
      }),
    onSuccess: (session) => {
      navigate({
        to: "/workout/$workoutId/session",
        params: { workoutId },
        search: { sessionId: session.id },
      });
    },
  });

  const exercises =
    workout?.exercises?.slice().sort((a, b) => a.sort_order - b.sort_order) ??
    [];

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate({ to: "/workout" })}
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
          <span className={styles.topbarTitle}>EXERCÍCIOS</span>
        </div>
        {workout && (
          <button
            className={`${styles.btn} ${styles.btnSm}`}
            onClick={() => setShowEdit(true)}
          >
            EDITAR
          </button>
        )}
      </header>

      <div className={styles.content}>
        {workout && (
          <div className={styles.workoutHeader}>
            <div className={styles.workoutName}>{workout.name}</div>
            {workout.description && (
              <div className={styles.workoutDesc}>{workout.description}</div>
            )}
            <div className={styles.workoutMeta}>
              <span
                className={`${styles.badge} ${workout.active ? styles.badgeBlue : styles.badgeMuted}`}
              >
                {workout.active ? "ATIVO" : "INATIVO"}
              </span>
              <span className={styles.metaText}>
                {exercises.length} exercício{exercises.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>CARREGANDO...</div>
          </div>
        )}

        {!isLoading && exercises.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>SEM EXERCÍCIOS</div>
            <div className={styles.emptyDesc}>
              Adicione exercícios ao treino
            </div>
          </div>
        )}

        {exercises.map((we, i) => (
          <div
            key={we.id}
            className={styles.exRow}
            onClick={() => {
              setEditingWE(we);
              setShowAddEx(false);
            }}
          >
            <span className={styles.exNum}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.exInfo}>
              <div className={styles.exName}>{we.exercise.name}</div>
              <div className={styles.exDetail}>
                {setLabel(we)} ·{" "}
                {we.exercise.type === "time" ? "Tempo" : "Repetições"}
                {we.note ? ` · ${we.note}` : ""}
              </div>
            </div>
            <button
              className={styles.iconBtn}
              onClick={(e) => {
                e.stopPropagation();
                removeExMutation.mutate(we.id);
              }}
              disabled={removeExMutation.isPending}
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
            </button>
          </div>
        ))}

        {workout && exercises.length > 0 && (
          <button
            className={`${styles.btn} ${styles.btnGreen}`}
            style={{ marginTop: "1.5rem" }}
            onClick={() => startSessionMutation.mutate()}
            disabled={startSessionMutation.isPending}
          >
            {startSessionMutation.isPending
              ? "INICIANDO..."
              : "⚡ INICIAR SESSÃO"}
          </button>
        )}
        {startSessionMutation.isError && (
          <p className={styles.serverError}>
            {startSessionMutation.error.message}
          </p>
        )}
      </div>

      <button
        className={styles.fab}
        onClick={() => {
          setEditingWE(null);
          setShowAddEx(true);
        }}
        aria-label="Adicionar exercício"
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

      {workout && (
        <EditWorkoutSheet
          open={showEdit}
          onClose={() => setShowEdit(false)}
          workout={workout}
        />
      )}
      <ExerciseSheet
        open={showAddEx || !!editingWE}
        onClose={() => {
          setShowAddEx(false);
          setEditingWE(null);
        }}
        workoutId={workoutId}
        exerciseCount={exercises.length}
        editing={editingWE}
      />
    </div>
  );
}
