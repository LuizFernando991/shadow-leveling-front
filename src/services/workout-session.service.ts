import { apiFetch } from "@/lib/api-fetch";
import type { WorkoutSession, ExerciseSet } from "@/types/workout";

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? "Erro inesperado");
}

export async function createWorkoutSession(data: {
  workout_id: string;
  date: string;
  status: "complete" | "incomplete" | "skipped";
}): Promise<WorkoutSession> {
  const res = await apiFetch("/api/workout-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function updateWorkoutSession(
  id: string,
  data: { status: "complete" | "incomplete" | "skipped" },
): Promise<WorkoutSession> {
  const res = await apiFetch(`/api/workout-sessions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function recordSet(
  sessionId: string,
  data: {
    exercise_id: string;
    set_number: number;
    reps?: number | null;
    weight?: number | null;
    duration?: number | null;
  },
): Promise<ExerciseSet> {
  const res = await apiFetch(`/api/workout-sessions/${sessionId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
