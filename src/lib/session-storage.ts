const KEY = "active_session";

export interface SetInput {
  reps: string;
  weight: string;
  duration: string;
  done: boolean;
}

// keyed by `${weId}-${setNumber}`
export type InputState = Record<string, SetInput>;

interface StoredSession {
  sessionId: string;
  workoutId: string;
  inputs: InputState;
  startedAt: number;
}

function isValid(s: StoredSession): boolean {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return s.startedAt >= todayStart.getTime() && now - s.startedAt < twoHoursMs;
}

export function saveSession(data: StoredSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — ignore
  }
}

export function loadSession(sessionId: string): InputState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSession;
    if (stored.sessionId !== sessionId || !isValid(stored)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return stored.inputs;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSession;
    if (!isValid(stored)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function resetStoredSession(workoutId?: string): void {
  const stored = getStoredSession();
  if (!stored) return;
  if (workoutId && stored.workoutId !== workoutId) return;
  clearSession();
}

export function pruneStaleSession(): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as StoredSession;
    if (!isValid(stored)) localStorage.removeItem(KEY);
  } catch {
    localStorage.removeItem(KEY);
  }
}
