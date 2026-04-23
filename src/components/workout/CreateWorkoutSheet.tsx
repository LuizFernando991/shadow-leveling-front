import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import styles from "./WorkoutListPage.module.css";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { WorkoutModal } from "@/components/workout/WorkoutModal";
import { WORKOUT_DAYS } from "@/helpers/workout-split.helper";
import { workoutSchema, type WorkoutFormInput } from "@/schemas/workout.schema";
import { createWorkout } from "@/services/workout.service";

interface CreateWorkoutSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkoutSheet({ open, onClose }: CreateWorkoutSheetProps) {
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

  function toggleDay(key: WorkoutFormInput["days_of_week"][number]) {
    setValue(
      "days_of_week",
      days.includes(key) ? days.filter((day) => day !== key) : [...days, key],
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
    <WorkoutModal open={open} onClose={onClose} title="NOVO TREINO">
      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <FormField label="NOME DO TREINO" error={errors.name?.message}>
          <Input
            placeholder="Ex: Treino A - Peito/Triceps"
            {...register("name")}
          />
        </FormField>
        <FormField label="DESCRIÇÃO (OPCIONAL)">
          <Textarea placeholder="Observações..." {...register("description")} />
        </FormField>
        <div className={styles.sectionLabel}>DIAS DA SEMANA</div>
        <div className={styles.daysRow}>
          {WORKOUT_DAYS.map(({ key, label }) => (
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
        <Button
          variant="unstyled"
          type="submit"
          className={styles.btn}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "CRIANDO..." : "+ CRIAR TREINO"}
        </Button>
        {createMutation.isError && (
          <p className={styles.serverError}>{createMutation.error.message}</p>
        )}
      </form>
    </WorkoutModal>
  );
}
