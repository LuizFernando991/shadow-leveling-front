import { apiFetch } from "@/lib/api-fetch";
import type {
  WorkoutSession,
  WorkoutSessionDetail,
  ExerciseSet,
} from "@/types/workout";

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

export async function listWorkoutSessions(filters?: {
  workout_id?: string;
  from?: string;
  to?: string;
}): Promise<WorkoutSession[]> {
  const params = new URLSearchParams();
  if (filters?.workout_id) params.set("workout_id", filters.workout_id);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  const query = params.toString();
  const res = await apiFetch(
    query ? `/api/workout-sessions?${query}` : "/api/workout-sessions",
  );
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getWorkoutSession(
  id: string,
): Promise<WorkoutSessionDetail> {
  const res = await apiFetch(`/api/workout-sessions/${id}`);
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
