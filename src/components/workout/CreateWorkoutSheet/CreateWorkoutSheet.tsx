import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import shared from "../styles/workout.shared.module.css";
import { WorkoutModal } from "../WorkoutModal/WorkoutModal";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { Input } from "@/components/ui/Input/Input";
import { Textarea } from "@/components/ui/Textarea/Textarea";
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

        <div className={shared.sectionLabel}>DIAS DA SEMANA</div>
        <div className={shared.daysRow}>
          {WORKOUT_DAYS.map(({ key, label }) => (
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

        <Button
          variant="unstyled"
          type="submit"
          className={shared.btn}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "CRIANDO..." : "+ CRIAR TREINO"}
        </Button>
        {createMutation.isError && (
          <p className={shared.serverError}>{createMutation.error.message}</p>
        )}
      </form>
    </WorkoutModal>
  );
}
