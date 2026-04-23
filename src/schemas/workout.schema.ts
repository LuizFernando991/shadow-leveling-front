import { z } from "zod";

const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export const workoutSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  days_of_week: z.array(z.enum(weekDays)).min(1, "Selecione ao menos um dia"),
  active: z.boolean(),
});

const nonNegativeIntegerString = z
  .string()
  .min(1, "Campo obrigatório")
  .regex(/^\d+$/, "Use um número válido");

const optionalNonNegativeIntegerString = z
  .string()
  .regex(/^\d*$/, "Use um número válido");

export const workoutExerciseSchema = z.object({
  search: z.string().optional(),
  sets: nonNegativeIntegerString.refine(
    (value) => Number(value) >= 1,
    "Use ao menos 1 série",
  ),
  reps_min: optionalNonNegativeIntegerString,
  reps_max: optionalNonNegativeIntegerString,
  duration: optionalNonNegativeIntegerString,
  note: z.string().optional(),
});

export type WorkoutFormInput = z.infer<typeof workoutSchema>;
export type WorkoutExerciseFormInput = z.infer<typeof workoutExerciseSchema>;
