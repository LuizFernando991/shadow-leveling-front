import { apiFetch } from "@/lib/api-fetch";
import type { TodayMissionsResponse } from "@/types/dashboard";

export async function getTodayMissions(): Promise<TodayMissionsResponse> {
  const res = await apiFetch("/api/user-metrics/today");
  if (!res.ok) throw new Error("Falha ao carregar métricas");
  return res.json();
}
