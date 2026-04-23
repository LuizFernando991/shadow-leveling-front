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

export type WorkoutFormInput = z.infer<typeof workoutSchema>;
