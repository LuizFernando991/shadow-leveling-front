import { apiFetch } from "@/lib/api-fetch";
import type { Exercise } from "@/types/exercise";

async function parseError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? "Erro inesperado");
}

export async function listExercises(search?: string): Promise<Exercise[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (search) params.set("search", search);
  const res = await apiFetch(`/api/exercises?${params}`);
  if (!res.ok) return parseError(res);
  const page = (await res.json()) as { data: Exercise[] };
  return page.data;
}
