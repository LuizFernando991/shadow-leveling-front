import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";

import shared from "../styles/workout.shared.module.css";
import { WorkoutModal } from "../WorkoutModal/WorkoutModal";

import styles from "./WorkoutDetailPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { Input } from "@/components/ui/Input/Input";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import { WORKOUT_DAYS } from "@/helpers/workout-split.helper";
import { workoutSchema, type WorkoutFormInput } from "@/schemas/workout.schema";
import { deleteWorkout, updateWorkout } from "@/services/workout.service";
import type { WorkoutDetail } from "@/types/workout";

interface EditWorkoutSheetProps {
  open: boolean;
  onClose: () => void;
  workout: WorkoutDetail;
}

export function EditWorkoutSheet({
  open,
  onClose,
  workout,
}: EditWorkoutSheetProps) {
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

  function toggleDay(key: WorkoutFormInput["days_of_week"][number]) {
    setValue(
      "days_of_week",
      days.includes(key) ? days.filter((day) => day !== key) : [...days, key],
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
          {WORKOUT_DAYS.map(({ key, label }) => (
            <Button
              variant="unstyled"
              key={key}
              type="button"
              className={`${shared.dayPill} ${days.includes(key) ? shared.dayPillOn : ""}`}
              onClick={() => toggleDay(key)}
            >
              {label}
            </Button>
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
              onChange={(event) => setValue("active", event.target.checked)}
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
