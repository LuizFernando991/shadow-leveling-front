import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { WorkoutModal } from "../../workout/WorkoutModal/WorkoutModal";
import shared from "../styles/tasks.shared.module.css";

import styles from "./TaskFormSheet.module.css";

import { Button } from "@/components/ui/Button/Button";
import { FormField } from "@/components/ui/FormField/FormField";
import { Input } from "@/components/ui/Input/Input";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import {
  DAYS_OF_WEEK,
  RECURRENCE_TYPES,
  TASK_LEVELS,
  taskSchema,
  type TaskFormInput,
} from "@/schemas/task.schema";
import { createTask } from "@/services/task.service";

const LEVEL_META: Record<
  string,
  { label: string; selClass: string; dotColor: string }
> = {
  hard: {
    label: "HIGH",
    selClass: styles.selHard,
    dotColor: "oklch(62% 0.22 25)",
  },
  medium: {
    label: "MEDIUM",
    selClass: styles.selMedium,
    dotColor: "oklch(80% 0.18 80)",
  },
  easy: {
    label: "EASY",
    selClass: styles.selEasy,
    dotColor: "oklch(72% 0.22 220)",
  },
  no_rank: {
    label: "NO RANK",
    selClass: styles.selNoRank,
    dotColor: "oklch(45% 0.04 240)",
  },
};

const RECUR_OPTS: {
  value: (typeof RECURRENCE_TYPES)[number];
  label: string;
}[] = [
  { value: "one_time", label: "UMA VEZ" },
  { value: "daily", label: "DIÁRIO" },
  { value: "weekly", label: "SEMANAL" },
  { value: "monthly", label: "MENSAL" },
  { value: "custom", label: "PERSONALIZADO" },
];

const DAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function oneYearLater(from: string): string {
  if (!from) return "";
  const d = new Date(from + "T00:00:00");
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface TaskFormSheetProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function TaskFormSheet({
  open,
  onClose,
  defaultDate,
}: TaskFormSheetProps) {
  const queryClient = useQueryClient();
  const today = todayIso();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "medium",
      initial_date: defaultDate ?? today,
      final_date: oneYearLater(defaultDate ?? today),
      recurrence_type: "one_time",
      custom_days_of_week: [],
      is_optional: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        level: "medium",
        initial_date: defaultDate ?? today,
        final_date: oneYearLater(defaultDate ?? today),
        recurrence_type: "one_time",
        custom_days_of_week: [],
        is_optional: false,
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const level = useWatch({ control, name: "level" });
  const recurrenceType = useWatch({ control, name: "recurrence_type" });
  const customDays = useWatch({ control, name: "custom_days_of_week" }) ?? [];
  const isOptional = useWatch({ control, name: "is_optional" });

  function toggleDay(day: (typeof DAYS_OF_WEEK)[number]) {
    setValue(
      "custom_days_of_week",
      customDays.includes(day)
        ? customDays.filter((d) => d !== day)
        : [...customDays, day],
    );
  }

  const createMutation = useMutation({
    mutationFn: (data: TaskFormInput) =>
      createTask({
        level: data.level,
        title: data.title,
        description: data.description || null,
        initial_date: data.initial_date,
        final_date:
          data.recurrence_type === "one_time"
            ? data.initial_date
            : data.final_date,
        recurrence_type: data.recurrence_type,
        custom_days_of_week:
          data.recurrence_type === "custom" ? data.custom_days_of_week : [],
        is_optional: data.is_optional,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-month"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-day"] });
      reset();
      onClose();
    },
  });

  return (
    <WorkoutModal open={open} onClose={onClose} title="NOVA MISSÃO">
      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <FormField label="TÍTULO DA MISSÃO" error={errors.title?.message}>
          <Input placeholder="Descreva a missão..." {...register("title")} />
        </FormField>

        <FormField label="DESCRIÇÃO (OPCIONAL)">
          <Textarea
            placeholder="Detalhes adicionais..."
            {...register("description")}
          />
        </FormField>

        {/* Level selector */}
        <div className={styles.fieldLabel}>NÍVEL DE PRIORIDADE</div>
        <div className={styles.levelGrid}>
          {TASK_LEVELS.map((v) => {
            const m = LEVEL_META[v];
            const sel = level === v;
            return (
              <button
                key={v}
                type="button"
                className={`${styles.levelOpt} ${sel ? m.selClass : ""}`}
                onClick={() => setValue("level", v)}
              >
                <div
                  className={styles.levelDot}
                  style={{ background: sel ? m.dotColor : "var(--muted)" }}
                />
                <span
                  className={styles.levelLabel}
                  style={{ color: sel ? m.dotColor : "var(--muted)" }}
                >
                  {m.label}
                </span>
                <span
                  className={styles.levelCheck}
                  style={{
                    color: m.dotColor,
                    visibility: sel ? "visible" : "hidden",
                  }}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* Recurrence */}
        <div className={styles.fieldLabel}>RECORRÊNCIA</div>
        <div className={styles.recurGrid}>
          {RECUR_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.recurPill} ${recurrenceType === o.value ? styles.recurPillActive : ""}`}
              onClick={() => setValue("recurrence_type", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Custom weekdays */}
        {recurrenceType === "custom" && (
          <>
            <div className={styles.fieldLabel}>DIAS DA SEMANA</div>
            <div className={shared.daysRow}>
              {DAYS_OF_WEEK.map((day, i) => (
                <Button
                  key={day}
                  type="button"
                  variant="unstyled"
                  className={`${shared.dayPill} ${customDays.includes(day) ? shared.dayPillOn : ""}`}
                  onClick={() => toggleDay(day)}
                >
                  {DAY_LABELS[i]}
                </Button>
              ))}
            </div>
            {errors.custom_days_of_week && (
              <span className={shared.fieldError}>
                {errors.custom_days_of_week.message}
              </span>
            )}
          </>
        )}

        {/* Dates */}
        <FormField label="DATA DE INÍCIO" error={errors.initial_date?.message}>
          <Input
            type="date"
            style={{ colorScheme: "dark" }}
            {...register("initial_date")}
          />
        </FormField>

        {recurrenceType !== "one_time" && (
          <FormField label="DATA FIM" error={errors.final_date?.message}>
            <Input
              type="date"
              style={{ colorScheme: "dark" }}
              {...register("final_date")}
            />
          </FormField>
        )}

        {/* Optional toggle */}
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleTitle}>MISSÃO OPCIONAL</div>
            <div className={styles.toggleDesc}>
              Não penaliza se não for concluída
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={!!isOptional}
              onChange={(e) => setValue("is_optional", e.target.checked)}
            />
            <div className={styles.toggleTrack} />
            <div className={styles.toggleThumb} />
          </label>
        </div>

        <Button
          variant="unstyled"
          type="submit"
          className={shared.btn}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "CRIANDO..." : "+ CRIAR MISSÃO"}
        </Button>

        {createMutation.isError && (
          <p className={shared.serverError}>{createMutation.error.message}</p>
        )}
      </form>
    </WorkoutModal>
  );
}
