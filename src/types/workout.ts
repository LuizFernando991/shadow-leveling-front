import type { Exercise } from "./exercise";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  days_of_week: WeekDay[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise: Exercise;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
}

export interface WorkoutDetail extends Workout {
  exercises: WorkoutExercise[];
  done_today: boolean;
}

export interface WorkoutSession {
  id: string;
  workout_id: string;
  date: string;
  status: "complete" | "incomplete" | "skipped";
  created_at: string;
  updated_at: string;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  created_at: string;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  sets: ExerciseSet[];
}
