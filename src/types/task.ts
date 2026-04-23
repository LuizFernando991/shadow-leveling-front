export type TaskLevel = "hard" | "medium" | "easy" | "no_rank";
export type RecurrenceType =
  | "one_time"
  | "weekly"
  | "daily"
  | "monthly"
  | "custom";
export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface Task {
  id: string;
  user_id: string;
  level: TaskLevel;
  title: string;
  description: string | null;
  initial_date: string;
  final_date: string;
  recurrence_type: RecurrenceType;
  custom_days_of_week: DayOfWeek[];
  is_optional: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskOccurrence extends Task {
  occurrence_date: string;
}
