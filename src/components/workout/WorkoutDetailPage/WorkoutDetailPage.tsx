import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import shared from "../styles/workout.shared.module.css";
import { WorkoutModal } from "../WorkoutModal/WorkoutModal";

import styles from "./WorkoutDetailPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { Input } from "@/components/ui/Input/Input";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  reorderWorkoutExercises,
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

/* ── Edit workout sheet ── */
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
    <WorkoutModal open={open} onClose={onClose} title="EDITAR TREINO">
      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
        <FormField label="NOME DO TREINO" error={errors.name?.message}>
          <Input {...register("name")} />
        </FormField>
        <FormField label="DESCRIÇÃO (OPCIONAL)">
          <Textarea {...register("description")} />
        </FormField>

        <div className={shared.sectionLabel}>DIAS DA SEMANA</div>
        <div className={shared.daysRow}>
          {DAYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${shared.dayPill} ${days.includes(key) ? shared.dayPillOn : ""}`}
              onClick={() => toggleDay(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.days_of_week && (
          <span className={shared.fieldError}>
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

        <Button
          variant="unstyled"
          type="button"
          className={`${shared.btn} ${shared.btnDanger}`}
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          ✕ EXCLUIR TREINO
        </Button>
        <Button
          variant="unstyled"
          type="submit"
          className={shared.btn}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "SALVANDO..." : "✓ SALVAR ALTERAÇÕES"}
        </Button>
        {updateMutation.isError && (
          <p className={shared.serverError}>{updateMutation.error.message}</p>
        )}
      </form>
    </WorkoutModal>
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
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ["exercises", debouncedSearch],
    queryFn: () => listExercises(debouncedSearch || undefined),
    enabled: open && !editing,
  });

  const isTime = selectedEx?.type === "time";

  function buildData() {
    return {
      exercise_id: selectedEx!.id,
      sets: parseInt(sets, 10) || 3,
      reps_min: isTime ? null : parseInt(repsMin, 10) || null,
      reps_max: isTime ? null : parseInt(repsMax, 10) || null,
      duration: isTime ? parseInt(duration, 10) || null : null,
      note: note || null,
    };
  }

  function handleClose() {
    setSearch("");
    setSelectedEx(null);
    setSets("3");
    setRepsMin("8");
    setRepsMax("12");
    setDuration("60");
    setNote("");
    onClose();
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

  function save() {
    if (!selectedEx && !editing) return;
    if (editing) {
      editMutation.mutate();
      return;
    }
    addMutation.mutate();
  }

  const isPending = addMutation.isPending || editMutation.isPending;
  const error = addMutation.error ?? editMutation.error;

  return (
    <WorkoutModal
      open={open}
      onClose={handleClose}
      title={editing ? "EDITAR EXERCÍCIO" : "ADICIONAR EXERCÍCIO"}
    >
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
            {isLoadingExercises && (
              <div className={styles.exListHint}>Buscando exercícios...</div>
            )}
            {!isLoadingExercises && exercises.length === 0 && (
              <div className={styles.exListHint}>
                Nenhum exercício encontrado
              </div>
            )}
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`${styles.exPickItem} ${selectedEx?.id === exercise.id ? styles.exPickItemSel : ""}`}
                onClick={() => setSelectedEx(exercise)}
              >
                <div className={styles.exTypeIcon}>
                  {exercise.type === "time" ? (
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
                  <div className={styles.exPickName}>{exercise.name}</div>
                  <div className={styles.exPickDetail}>
                    {exercise.type === "time" ? "Tempo" : "Repetições"} ·{" "}
                    {exercise.unit}
                  </div>
                </div>
                {selectedEx?.id === exercise.id && (
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
            <FormField label="SÉRIES">
              <Input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
              />
            </FormField>
            {!isTime ? (
              <>
                <FormField label="REPS MÍN">
                  <Input
                    type="number"
                    value={repsMin}
                    onChange={(e) => setRepsMin(e.target.value)}
                  />
                </FormField>
                <FormField label="REPS MÁX">
                  <Input
                    type="number"
                    value={repsMax}
                    onChange={(e) => setRepsMax(e.target.value)}
                  />
                </FormField>
              </>
            ) : (
              <FormField label="TEMPO (SEG)">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </FormField>
            )}
          </div>
          <FormField label="NOTA (OPCIONAL)">
            <Input
              placeholder="Ex: Controlar descida..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
        </>
      )}

      <Button
        variant="unstyled"
        className={shared.btn}
        onClick={save}
        disabled={isPending || (!selectedEx && !editing)}
      >
        {isPending
          ? "SALVANDO..."
          : editing
            ? "SALVAR EXERCÍCIO"
            : "ADICIONAR EXERCÍCIO"}
      </Button>
      {error && <p className={shared.serverError}>{error.message}</p>}
    </WorkoutModal>
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

  const reorderMutation = useMutation({
    mutationFn: (nextExercises: WorkoutExercise[]) =>
      reorderWorkoutExercises(
        workoutId,
        nextExercises.map((ex, i) => ({ id: ex.id, sort_order: i })),
      ),
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
  const completedToday = workout?.done_today ?? false;

  function moveExercise(weId: string, direction: -1 | 1) {
    const currentIndex = exercises.findIndex((ex) => ex.id === weId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= exercises.length)
      return;
    const next = exercises.slice();
    [next[currentIndex], next[nextIndex]] = [
      next[nextIndex],
      next[currentIndex],
    ];
    reorderMutation.mutate(next);
  }

  return (
    <div className={shared.page}>
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <button
            className={shared.iconBtn}
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
          <span className={shared.topbarTitle}>EXERCÍCIOS</span>
        </div>
        {workout && (
          <Button
            variant="unstyled"
            className={`${shared.btn} ${shared.btnSm}`}
            style={{ marginTop: 0 }}
            onClick={() => setShowEdit(true)}
          >
            EDITAR
          </Button>
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
                className={`${shared.badge} ${workout.active ? shared.badgeBlue : shared.badgeMuted}`}
              >
                {workout.active ? "ATIVO" : "INATIVO"}
              </span>
              <span className={styles.metaText}>
                {exercises.length} exercício{exercises.length !== 1 ? "s" : ""}
              </span>
              {completedToday && (
                <span className={`${shared.badge} ${shared.badgeDone}`}>
                  FEITO HOJE
                </span>
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className={shared.empty}>
            <div className={shared.emptyTitle}>CARREGANDO...</div>
          </div>
        )}

        {!isLoading && exercises.length === 0 && (
          <div className={shared.empty}>
            <div className={shared.emptyTitle}>SEM EXERCÍCIOS</div>
            <div className={shared.emptyDesc}>
              Adicione exercícios ao treino
            </div>
          </div>
        )}

        {exercises.map((we, index) => (
          <div
            key={we.id}
            className={styles.exRow}
            onClick={() => {
              setEditingWE(we);
              setShowAddEx(false);
            }}
          >
            <span className={styles.exNum}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className={styles.exInfo}>
              <div className={styles.exName}>{we.exercise.name}</div>
              <div className={styles.exDetail}>
                {setLabel(we)} ·{" "}
                {we.exercise.type === "time" ? "Tempo" : "Repetições"}
                {we.note ? ` · ${we.note}` : ""}
              </div>
            </div>
            <div className={styles.exActions}>
              <button
                className={styles.orderBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  moveExercise(we.id, -1);
                }}
                disabled={reorderMutation.isPending || index === 0}
                aria-label="Mover para cima"
              >
                ↑
              </button>
              <button
                className={styles.orderBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  moveExercise(we.id, 1);
                }}
                disabled={
                  reorderMutation.isPending || index === exercises.length - 1
                }
                aria-label="Mover para baixo"
              >
                ↓
              </button>
              <button
                className={shared.iconBtn}
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
          </div>
        ))}

        {reorderMutation.isError && (
          <p className={shared.serverError}>{reorderMutation.error.message}</p>
        )}
        {startSessionMutation.isError && (
          <p className={shared.serverError}>
            {startSessionMutation.error.message}
          </p>
        )}

        {workout && exercises.length > 0 && (
          <Button
            variant="unstyled"
            className={shared.btn}
            style={{ marginTop: "1.5rem" }}
            onClick={() => startSessionMutation.mutate()}
            disabled={startSessionMutation.isPending}
          >
            {startSessionMutation.isPending
              ? "INICIANDO..."
              : "⚡ INICIAR SESSÃO"}
          </Button>
        )}
      </div>

      <Button
        variant="unstyled"
        className={shared.fab}
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
      </Button>

      {workout && (
        <EditWorkoutSheet
          open={showEdit}
          onClose={() => setShowEdit(false)}
          workout={workout}
        />
      )}
      <ExerciseSheet
        key={editingWE?.id ?? (showAddEx ? "new" : "idle")}
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
