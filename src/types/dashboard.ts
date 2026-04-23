export interface Progress {
  total: number;
  completed: number;
  pending: number;
}

export interface WorkoutMission {
  id: string;
  name: string;
  description: string | null;
  is_completed: boolean;
}

export interface TaskMission {
  id: string;
  level: "hard" | "medium" | "easy" | "no_rank";
  title: string;
  description: string | null;
  occurrence_date: string;
  is_optional: boolean;
  is_completed: boolean;
}

export interface WorkoutMissions {
  progress: Progress;
  items: WorkoutMission[];
}

export interface TaskMissions {
  progress: Progress;
  items: TaskMission[];
}

export interface TodayMissionsResponse {
  date: string;
  progress: Progress;
  workouts: WorkoutMissions;
  tasks: TaskMissions;
}
