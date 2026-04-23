import { z } from "zod";

export const TASK_LEVELS = ["hard", "medium", "easy", "no_rank"] as const;
export const RECURRENCE_TYPES = [
  "one_time",
  "weekly",
  "daily",
  "monthly",
  "custom",
] as const;
export const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const taskSchema = z
  .object({
    title: z.string().min(1, "Título obrigatório").max(150),
    description: z.string().max(1000).optional(),
    level: z.enum(TASK_LEVELS),
    initial_date: z.string().min(1, "Data obrigatória"),
    final_date: z.string().min(1, "Data obrigatória"),
    recurrence_type: z.enum(RECURRENCE_TYPES),
    custom_days_of_week: z.array(z.enum(DAYS_OF_WEEK)),
    is_optional: z.boolean(),
  })
  .refine((d) => d.final_date >= d.initial_date, {
    message: "Data fim deve ser igual ou após data início",
    path: ["final_date"],
  })
  .refine(
    (d) => d.recurrence_type !== "custom" || d.custom_days_of_week.length > 0,
    { message: "Selecione ao menos um dia", path: ["custom_days_of_week"] },
  );

export type TaskFormInput = z.infer<typeof taskSchema>;
