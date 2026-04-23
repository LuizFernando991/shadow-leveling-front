import { apiFetch } from "@/lib/api-fetch";
import type { Task, TaskOccurrence } from "@/types/task";

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? "Erro inesperado");
}

function toDateTime(date: string): string {
  return `${date}T00:00:00Z`;
}

export async function getTasksForDay(date: string): Promise<TaskOccurrence[]> {
  const res = await apiFetch(`/api/tasks/day?date=${date}`);
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function getTasksForMonth(
  year: number,
  month: number,
): Promise<TaskOccurrence[]> {
  const res = await apiFetch(`/api/tasks/month?year=${year}&month=${month}`);
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function createTask(data: {
  level: string;
  title: string;
  description?: string | null;
  initial_date: string;
  final_date: string;
  recurrence_type: string;
  custom_days_of_week?: string[];
  is_optional?: boolean;
}): Promise<Task> {
  const res = await apiFetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      initial_date: toDateTime(data.initial_date),
      final_date: toDateTime(data.final_date),
    }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}

export async function completeTask(
  id: string,
  occurrenceDate: string,
): Promise<TaskOccurrence> {
  // occurrenceDate arrives from the API as RFC3339 ("2026-04-23T00:00:00Z"); send as-is
  const res = await apiFetch(`/api/tasks/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: occurrenceDate }),
  });
  if (!res.ok) return parseError(res);
  return res.json();
}
