import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import shared from "../styles/workout.shared.module.css";
import { WorkoutModal } from "../WorkoutModal/WorkoutModal";

import styles from "./WorkoutDetailPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { Input } from "@/components/ui/Input/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { sanitizeNonNegativeNumber } from "@/lib/number-input";
import {
  workoutExerciseSchema,
  type WorkoutExerciseFormInput,
} from "@/schemas/workout.schema";
import { listExercises } from "@/services/exercise.service";
import {
  addWorkoutExercise,
  updateWorkoutExercise,
} from "@/services/workout.service";
import type { Exercise } from "@/types/exercise";
import type { WorkoutExercise } from "@/types/workout";

interface ExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  workoutId: string;
  exerciseCount: number;
  editing: WorkoutExercise | null;
}

export function ExerciseSheet({
  open,
  onClose,
  workoutId,
  exerciseCount,
  editing,
}: ExerciseSheetProps) {
  const queryClient = useQueryClient();
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(
    editing?.exercise ?? null,
  );
  const exerciseFormValues = useMemo<WorkoutExerciseFormInput>(
    () => ({
      search: "",
      sets: String(editing?.sets ?? 3),
      reps_min: String(editing?.reps_min ?? 8),
      reps_max: String(editing?.reps_max ?? 12),
      duration: String(editing?.duration ?? 60),
      note: editing?.note ?? "",
    }),
    [editing],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WorkoutExerciseFormInput>({
    resolver: zodResolver(workoutExerciseSchema),
    values: exerciseFormValues,
  });

  const search = useWatch({ control, name: "search" }) ?? "";
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ["exercises", debouncedSearch],
    queryFn: () => listExercises(debouncedSearch || undefined),
    enabled: open && !editing,
  });

  const isTime = selectedEx?.type === "time";

  function sanitizeNumberChange(event: ChangeEvent<HTMLInputElement>) {
    event.target.value = sanitizeNonNegativeNumber(event.target.value);
  }

  function parseOptionalInt(value: string) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function buildData(data: WorkoutExerciseFormInput) {
    return {
      exercise_id: selectedEx!.id,
      sets: parseInt(data.sets, 10),
      reps_min: isTime ? null : parseOptionalInt(data.reps_min),
      reps_max: isTime ? null : parseOptionalInt(data.reps_max),
      duration: isTime ? parseOptionalInt(data.duration) : null,
      note: data.note || null,
    };
  }

  function handleClose() {
    setSelectedEx(null);
    reset({
      search: "",
      sets: "3",
      reps_min: "8",
      reps_max: "12",
      duration: "60",
      note: "",
    });
    onClose();
  }

  const addMutation = useMutation({
    mutationFn: (data: WorkoutExerciseFormInput) =>
      addWorkoutExercise(workoutId, {
        ...buildData(data),
        sort_order: exerciseCount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      handleClose();
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: WorkoutExerciseFormInput) =>
      updateWorkoutExercise(workoutId, editing!.id, buildData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      handleClose();
    },
  });

  function save(data: WorkoutExerciseFormInput) {
    if (!selectedEx && !editing) return;
    if (editing) {
      editMutation.mutate(data);
      return;
    }
    addMutation.mutate(data);
  }

  const isPending = addMutation.isPending || editMutation.isPending;
  const error = addMutation.error ?? editMutation.error;

  return (
    <WorkoutModal
      open={open}
      onClose={handleClose}
      title={editing ? "EDITAR EXERCÍCIO" : "ADICIONAR EXERCÍCIO"}
    >
      <form onSubmit={handleSubmit(save)}>
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
              <Input
                className={styles.searchInput}
                placeholder="Buscar exercício..."
                {...register("search")}
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
              <FormField label="SÉRIES" error={errors.sets?.message}>
                <Input
                  type="number"
                  min="1"
                  {...register("sets", {
                    onChange: sanitizeNumberChange,
                  })}
                />
              </FormField>
              {!isTime ? (
                <>
                  <FormField label="REPS MÍN" error={errors.reps_min?.message}>
                    <Input
                      type="number"
                      {...register("reps_min", {
                        onChange: sanitizeNumberChange,
                      })}
                    />
                  </FormField>
                  <FormField label="REPS MÁX" error={errors.reps_max?.message}>
                    <Input
                      type="number"
                      {...register("reps_max", {
                        onChange: sanitizeNumberChange,
                      })}
                    />
                  </FormField>
                </>
              ) : (
                <FormField label="TEMPO (SEG)" error={errors.duration?.message}>
                  <Input
                    type="number"
                    {...register("duration", {
                      onChange: sanitizeNumberChange,
                    })}
                  />
                </FormField>
              )}
            </div>
            <FormField label="NOTA (OPCIONAL)" error={errors.note?.message}>
              <Input
                placeholder="Ex: Controlar descida..."
                {...register("note")}
              />
            </FormField>
          </>
        )}

        <Button
          variant="unstyled"
          type="submit"
          className={shared.btn}
          disabled={isPending || (!selectedEx && !editing)}
        >
          {isPending
            ? "SALVANDO..."
            : editing
              ? "SALVAR EXERCÍCIO"
              : "ADICIONAR EXERCÍCIO"}
        </Button>
        {error && <p className={shared.serverError}>{error.message}</p>}
      </form>
    </WorkoutModal>
  );
}
