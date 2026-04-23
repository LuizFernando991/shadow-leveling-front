import { apiFetch } from "@/lib/api-fetch";
import type { Workout, WorkoutDetail, WorkoutExercise } from "@/types/workout";

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? "Erro inesperado");
}

export async function listWorkouts(): Promise<WorkoutDetail[]> {
  const res = await apiFetch("/api/workouts");
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const res = await apiFetch(`/api/workouts/${id}`);
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function createWorkout(data: {
  name: string;
  description?: string | null;
  days_of_week: string[];
}): Promise<Workout> {
  const res = await apiFetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateWorkout(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    days_of_week?: string[];
    active?: boolean;
  },
): Promise<Workout> {
  const res = await apiFetch(`/api/workouts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function deleteWorkout(id: string): Promise<void> {
  const res = await apiFetch(`/api/workouts/${id}`, { method: "DELETE" });
  if (!res.ok) return parseError(res);
}

export async function addWorkoutExercise(
  workoutId: string,
  data: {
    exercise_id: string;
    sets: number;
    reps_min?: number | null;
    reps_max?: number | null;
    duration?: number | null;
    note?: string | null;
    sort_order?: number;
  },
): Promise<WorkoutExercise> {
  const res = await apiFetch(`/api/workouts/${workoutId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateWorkoutExercise(
  workoutId: string,
  weId: string,
  data: {
    sets?: number;
    reps_min?: number | null;
    reps_max?: number | null;
    duration?: number | null;
    note?: string | null;
    sort_order?: number;
  },
): Promise<WorkoutExercise> {
  const res = await apiFetch(`/api/workouts/${workoutId}/exercises/${weId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function removeWorkoutExercise(
  workoutId: string,
  weId: string,
): Promise<void> {
  const res = await apiFetch(`/api/workouts/${workoutId}/exercises/${weId}`, {
    method: "DELETE",
  });
  if (!res.ok) return parseError(res);
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exercises: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  const res = await apiFetch(`/api/workouts/${workoutId}/exercises/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exercises }),
  });
  if (!res.ok) return parseError(res);
}
