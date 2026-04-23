import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import shared from "../styles/workout.shared.module.css";

import { EditWorkoutSheet } from "./EditWorkoutSheet";
import { ExerciseRow } from "./ExerciseRow";
import { ExerciseSheet } from "./ExerciseSheet";
import styles from "./WorkoutDetailPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { createWorkoutSession } from "@/services/workout-session.service";
import {
  getWorkout,
  removeWorkoutExercise,
  reorderWorkoutExercises,
} from "@/services/workout.service";
import type { WorkoutExercise } from "@/types/workout";

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
        nextExercises.map((exercise, index) => ({
          id: exercise.id,
          sort_order: index,
        })),
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
    const currentIndex = exercises.findIndex(
      (exercise) => exercise.id === weId,
    );
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

  function openExerciseEditor(exercise: WorkoutExercise) {
    setEditingWE(exercise);
    setShowAddEx(false);
  }

  function openNewExerciseSheet() {
    setEditingWE(null);
    setShowAddEx(true);
  }

  function closeExerciseSheet() {
    setShowAddEx(false);
    setEditingWE(null);
  }

  return (
    <div className={shared.page}>
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <Button
            variant="unstyled"
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
          </Button>
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

        {exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            index={index}
            totalExercises={exercises.length}
            isReordering={reorderMutation.isPending}
            isRemoving={removeExMutation.isPending}
            onEdit={openExerciseEditor}
            onMove={moveExercise}
            onRemove={(exerciseId) => removeExMutation.mutate(exerciseId)}
          />
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
            {startSessionMutation.isPending ? "INICIANDO..." : "INICIAR SESSÃO"}
          </Button>
        )}
      </div>

      <Button
        variant="unstyled"
        className={shared.fab}
        onClick={openNewExerciseSheet}
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
        onClose={closeExerciseSheet}
        workoutId={workoutId}
        exerciseCount={exercises.length}
        editing={editingWE}
      />
    </div>
  );
}
