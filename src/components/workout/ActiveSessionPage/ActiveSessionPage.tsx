import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

import shared from "../styles/workout.shared.module.css";

import styles from "./ActiveSessionPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useTimer } from "@/hooks/useTimer";
import { sanitizeNonNegativeNumber } from "@/lib/number-input";
import {
  saveSession,
  loadSession,
  clearSession,
  getStoredSession,
} from "@/lib/session-storage";
import {
  updateWorkoutSession,
  recordSet,
} from "@/services/workout-session.service";
import { getWorkout } from "@/services/workout.service";
import type { WorkoutDetail, WorkoutExercise } from "@/types/workout";

interface SetState {
  num: number;
  reps: string;
  weight: string;
  duration: string;
  done: boolean;
}

function buildSetRows(
  we: WorkoutExercise,
  saved: ReturnType<typeof loadSession>,
): SetState[] {
  return Array.from({ length: we.sets }, (_, i) => {
    const key = `${we.id}-${i + 1}`;
    const s = saved?.[key];
    return s
      ? {
          num: i + 1,
          reps: s.reps,
          weight: s.weight,
          duration: s.duration,
          done: s.done,
        }
      : { num: i + 1, reps: "", weight: "", duration: "", done: false };
  });
}

function setLabel(we: WorkoutExercise): string {
  if (we.exercise.type === "time") return `${we.sets}×${we.duration}s`;
  return `${we.sets}×${we.reps_min}${we.reps_max && we.reps_max !== we.reps_min ? `–${we.reps_max}` : ""} reps`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface ActiveSessionPageProps {
  workoutId: string;
  sessionId: string;
}

export function ActiveSessionPage({
  workoutId,
  sessionId,
}: ActiveSessionPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const savedSession = useMemo(() => {
    const stored = getStoredSession();
    return stored?.sessionId === sessionId ? stored : null;
  }, [sessionId]);
  const elapsed = useTimer(savedSession?.elapsedSeconds ?? 0);

  const cachedWorkout = queryClient.getQueryData<WorkoutDetail>([
    "workout",
    workoutId,
  ]);

  const { data: workout } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => getWorkout(workoutId),
    initialData: cachedWorkout,
  });

  const savedInputs = useMemo(
    () => savedSession?.inputs ?? loadSession(sessionId),
    [savedSession, sessionId],
  );

  const exercises = useMemo(
    () =>
      workout?.exercises.slice().sort((a, b) => a.sort_order - b.sort_order) ??
      [],
    [workout],
  );

  const [setData, setSetData] = useState<Record<string, SetState[]>>(() => {
    const init: Record<string, SetState[]> = {};
    for (const we of exercises) {
      init[we.id] = buildSetRows(we, savedInputs);
    }
    return init;
  });

  const [expanded, setExpanded] = useState<string | null>(
    () => exercises[0]?.id ?? null,
  );

  const effectiveSetData = useMemo(() => {
    if (Object.keys(setData).length > 0 || exercises.length === 0)
      return setData;
    const init: Record<string, SetState[]> = {};
    for (const we of exercises) {
      init[we.id] = buildSetRows(we, savedInputs);
    }
    return init;
  }, [setData, exercises, savedInputs]);

  const latestSetDataRef = useRef(effectiveSetData);
  const latestElapsedRef = useRef(elapsed);
  const skipPersistRef = useRef(false);

  const recordSetMutation = useMutation({
    mutationFn: (data: Parameters<typeof recordSet>[1]) =>
      recordSet(sessionId, data),
  });

  const finishMutation = useMutation({
    mutationFn: (status: "complete" | "incomplete") =>
      updateWorkoutSession(sessionId, { status }),
    onSuccess: (_, status) => {
      skipPersistRef.current = true;
      clearSession();
      queryClient.invalidateQueries({ queryKey: ["today-missions"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      const allSets = Object.values(effectiveSetData).flat();
      const doneSets = allSets.filter((s) => s.done).length;
      const totalSets = allSets.length;
      const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
      navigate({
        to: "/workout/$workoutId/session/complete",
        params: { workoutId },
        search: { doneSets, totalSets, elapsed, pct, status },
      });
    },
  });

  const persistToStorage = useCallback(
    (
      nextData: Record<string, SetState[]>,
      elapsedSeconds = latestElapsedRef.current,
    ) => {
      const inputs: Record<
        string,
        { reps: string; weight: string; duration: string; done: boolean }
      > = {};

      for (const [weId, sets] of Object.entries(nextData)) {
        for (const s of sets) {
          inputs[`${weId}-${s.num}`] = {
            reps: s.reps,
            weight: s.weight,
            duration: s.duration,
            done: s.done,
          };
        }
      }

      saveSession({
        sessionId,
        workoutId,
        inputs,
        startedAt: Date.now(),
        elapsedSeconds,
      });
    },
    [sessionId, workoutId],
  );

  useEffect(() => {
    latestSetDataRef.current = effectiveSetData;
  }, [effectiveSetData]);

  useEffect(() => {
    latestElapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    function persistCurrentSession() {
      if (skipPersistRef.current) return;
      persistToStorage(latestSetDataRef.current, latestElapsedRef.current);
    }

    window.addEventListener("pagehide", persistCurrentSession);

    return () => {
      window.removeEventListener("pagehide", persistCurrentSession);
      persistCurrentSession();
    };
  }, [sessionId, workoutId, persistToStorage]);

  function updateSet(
    weId: string,
    idx: number,
    field: keyof Omit<SetState, "num" | "done">,
    val: string,
  ) {
    const base = Object.keys(setData).length > 0 ? setData : effectiveSetData;
    const next = {
      ...base,
      [weId]: base[weId].map((s, i) =>
        i === idx ? { ...s, [field]: val } : s,
      ),
    };
    persistToStorage(next);
    setSetData(next);
  }

  function toggleDone(we: WorkoutExercise, idx: number) {
    const s = effectiveSetData[we.id]?.[idx];
    if (!s) return;
    const nowDone = !s.done;
    const base = Object.keys(setData).length > 0 ? setData : effectiveSetData;
    const next = {
      ...base,
      [we.id]: base[we.id].map((st, i) =>
        i === idx ? { ...st, done: nowDone } : st,
      ),
    };
    persistToStorage(next);
    setSetData(next);
    if (nowDone) {
      recordSetMutation.mutate({
        exercise_id: we.exercise_id,
        set_number: s.num,
        reps: s.reps ? parseInt(s.reps) : null,
        weight: s.weight ? parseFloat(s.weight) : null,
        duration: s.duration ? parseInt(s.duration) : null,
      });
    }
  }

  function finish() {
    const allSets = Object.values(effectiveSetData).flat();
    finishMutation.mutate(
      allSets.every((s) => s.done) ? "complete" : "incomplete",
    );
  }

  const allSets = Object.values(effectiveSetData).flat();
  const doneSets = allSets.filter((s) => s.done).length;
  const totalSets = allSets.length;
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className={shared.page}>
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <Button
            variant="unstyled"
            className={shared.iconBtn}
            onClick={() =>
              navigate({ to: "/workout/$workoutId", params: { workoutId } })
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </Button>
          <span className={shared.topbarTitle}>SESSÃO ATIVA</span>
        </div>
        <span className={styles.timer}>
          {pad(Math.floor(elapsed / 60))}:{pad(elapsed % 60)}
        </span>
      </header>

      <div className={styles.progressBar}>
        <div className={styles.progressInfo}>
          <span className={styles.progressLabel}>PROGRESSO</span>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressCount}>
          {doneSets}/{totalSets}
        </span>
      </div>

      <div className={styles.content}>
        {workout && <div className={styles.workoutLabel}>{workout.name}</div>}

        {exercises.map((we, i) => {
          const weSets = effectiveSetData[we.id] ?? [];
          const doneCount = weSets.filter((s) => s.done).length;
          const allDone = doneCount === we.sets;
          const isOpen = expanded === we.id;
          const isTime = we.exercise.type === "time";

          return (
            <div key={we.id} className={styles.sessionEx}>
              <div
                className={styles.sessionExHeader}
                onClick={() => setExpanded(isOpen ? null : we.id)}
              >
                <div
                  className={`${styles.exNum} ${allDone ? styles.exNumDone : ""}`}
                >
                  {allDone ? "✓" : pad(i + 1)}
                </div>
                <div className={styles.exInfo}>
                  <div className={styles.exName}>{we.exercise.name}</div>
                  <div className={styles.exDetail}>{setLabel(we)}</div>
                </div>
                <span className={styles.exProgress}>
                  {doneCount}/{we.sets}
                </span>
                <span
                  className={styles.exChevron}
                  style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                >
                  ›
                </span>
              </div>

              {isOpen && (
                <div className={styles.sessionExSets}>
                  {weSets.map((s, idx) => (
                    <div key={idx} className={styles.setRow}>
                      <span className={styles.setNum}>S{s.num}</span>
                      {!isTime ? (
                        <>
                          <Input
                            className={styles.setInput}
                            type="number"
                            min="0"
                            placeholder={String(we.reps_min ?? "")}
                            value={s.reps}
                            onChange={(e) =>
                              updateSet(
                                we.id,
                                idx,
                                "reps",
                                sanitizeNonNegativeNumber(e.target.value),
                              )
                            }
                          />
                          <span className={styles.setUnit}>reps</span>
                          <Input
                            className={styles.setInput}
                            type="number"
                            min="0"
                            placeholder="—"
                            value={s.weight}
                            onChange={(e) =>
                              updateSet(
                                we.id,
                                idx,
                                "weight",
                                sanitizeNonNegativeNumber(e.target.value),
                              )
                            }
                          />
                          <span className={styles.setUnit}>kg</span>
                        </>
                      ) : (
                        <>
                          <Input
                            className={styles.setInput}
                            type="number"
                            min="0"
                            placeholder={String(we.duration ?? "")}
                            value={s.duration}
                            onChange={(e) =>
                              updateSet(
                                we.id,
                                idx,
                                "duration",
                                sanitizeNonNegativeNumber(e.target.value),
                              )
                            }
                          />
                          <span className={styles.setUnit}>seg</span>
                        </>
                      )}
                      <Button
                        variant="unstyled"
                        className={`${styles.setCheck} ${s.done ? styles.setCheckDone : ""}`}
                        onClick={() => toggleDone(we, idx)}
                      >
                        {s.done ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="5" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.actions}>
          <Button
            variant="unstyled"
            className={`${shared.btn} ${shared.btnGhost} ${styles.actionGhost}`}
            style={{ marginTop: 0 }}
            onClick={() =>
              navigate({ to: "/workout/$workoutId", params: { workoutId } })
            }
          >
            SAIR
          </Button>
          <Button
            variant="unstyled"
            className={`${shared.btn} ${shared.btnPrimary} ${styles.actionPrimary}`}
            style={{ marginTop: 0 }}
            onClick={finish}
            disabled={finishMutation.isPending}
          >
            {finishMutation.isPending ? "FINALIZANDO..." : "✓ FINALIZAR SESSÃO"}
          </Button>
        </div>
      </div>
    </div>
  );
}
