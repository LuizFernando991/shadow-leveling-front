import type { WorkoutDetail, WeekDay } from "@/types/workout";

export const WORKOUT_DAYS: { key: WeekDay; label: string }[] = [
  { key: "monday", label: "SEG" },
  { key: "tuesday", label: "TER" },
  { key: "wednesday", label: "QUA" },
  { key: "thursday", label: "QUI" },
  { key: "friday", label: "SEX" },
];

export function getTodayKey(): WeekDay | null {
  const map: Partial<Record<number, WeekDay>> = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
  };
  return map[new Date().getDay()] ?? null;
}

export function exSetLabel(we: WorkoutDetail["exercises"][number]): string {
  if (we.exercise.type === "time") return `${we.sets}×${we.duration}s`;
  return `${we.sets}×${we.reps_min}${we.reps_max && we.reps_max !== we.reps_min ? `–${we.reps_max}` : ""} reps`;
}

export function splitWorkoutsByToday(workouts: WorkoutDetail[]) {
  const today = getTodayKey();

  const todayWorkouts = workouts
    .filter(
      (workout) =>
        workout.active && !!today && workout.days_of_week.includes(today),
    )
    .slice()
    .sort((a, b) => {
      const aDone = a.done_today ? 1 : 0;
      const bDone = b.done_today ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.name.localeCompare(b.name);
    });

  const otherWorkouts = workouts
    .filter((workout) => !todayWorkouts.includes(workout))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return { today, todayWorkouts, otherWorkouts };
}
