import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CreateWorkoutSheet } from "../CreateWorkoutSheet/CreateWorkoutSheet";
import shared from "../styles/workout.shared.module.css";
import { TodayWorkoutCard } from "../TodayWorkoutCard/TodayWorkoutCard";
import { WorkoutSummaryCard } from "../WorkoutSummaryCard/WorkoutSummaryCard";

import styles from "./WorkoutListPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { splitWorkoutsByToday } from "@/helpers/workout-split.helper";
import { createWorkoutSession } from "@/services/workout-session.service";
import { listWorkouts } from "@/services/workout.service";

export function WorkoutListPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: listWorkouts,
  });

  const startSessionMutation = useMutation({
    mutationFn: (workoutId: string) =>
      createWorkoutSession({
        workout_id: workoutId,
        date: new Date().toISOString(),
        status: "incomplete",
      }),
    onSuccess: (session, workoutId) => {
      setStartingId(null);
      navigate({
        to: "/workout/$workoutId/session",
        params: { workoutId },
        search: { sessionId: session.id },
      });
    },
    onError: () => setStartingId(null),
  });

  function startSession(workoutId: string) {
    setStartingId(workoutId);
    startSessionMutation.mutate(workoutId);
  }

  const { todayWorkouts, otherWorkouts } = splitWorkoutsByToday(workouts);

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className={shared.page}>
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <button
            className={shared.iconBtn}
            onClick={() => navigate({ to: "/dashboard" })}
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
          </button>
          <span className={shared.topbarTitle}>SHADOW GYM</span>
        </div>
        <Button
          variant="unstyled"
          className={`${shared.btn} ${shared.btnSm}`}
          style={{ marginTop: 0 }}
          onClick={() => setShowCreate(true)}
        >
          + NOVO
        </Button>
      </header>

      <div className={styles.content}>
        <div className={styles.greeting}>
          <div className={styles.greetingTitle}>MEUS TREINOS</div>
          <div className={styles.greetingDate}>{dateStr}</div>
        </div>

        {isLoading && (
          <div className={shared.empty}>
            <div className={shared.emptyTitle}>CARREGANDO...</div>
          </div>
        )}

        {!isLoading && workouts.length === 0 && (
          <div className={shared.empty}>
            <div className={shared.emptyTitle}>NENHUM TREINO</div>
            <div className={shared.emptyDesc}>Crie seu primeiro treino</div>
          </div>
        )}

        {todayWorkouts.length > 0 && (
          <>
            <div className={shared.sectionLabel}>TREINO DE HOJE</div>
            {todayWorkouts.map((workout) => (
              <TodayWorkoutCard
                key={workout.id}
                workout={workout}
                onStart={() => startSession(workout.id)}
                isStarting={startingId === workout.id}
                onNavigate={() =>
                  navigate({
                    to: "/workout/$workoutId",
                    params: { workoutId: workout.id },
                  })
                }
                isCompletedToday={workout.done_today}
              />
            ))}
          </>
        )}

        {todayWorkouts.length === 0 && !isLoading && (
          <>
            <div className={shared.sectionLabel}>HOJE</div>
            <div className={styles.restCard}>
              <div className={styles.restIcon}>☽ ☽</div>
              <div className={styles.restTitle}>DIA DE DESCANSO</div>
              <div className={styles.restDesc}>
                Nenhum treino planejado para hoje
              </div>
            </div>
          </>
        )}

        {otherWorkouts.length > 0 && (
          <>
            <div
              className={shared.sectionLabel}
              style={{ marginTop: "0.5rem" }}
            >
              {todayWorkouts.length > 0 ? "OUTROS TREINOS" : "TODOS OS TREINOS"}
            </div>
            {otherWorkouts.map((workout) => (
              <WorkoutSummaryCard
                key={workout.id}
                workout={workout}
                onStart={() => startSession(workout.id)}
                isStarting={startingId === workout.id}
                onNavigate={() =>
                  navigate({
                    to: "/workout/$workoutId",
                    params: { workoutId: workout.id },
                  })
                }
                isCompletedToday={workout.done_today}
              />
            ))}
          </>
        )}
      </div>

      <Button
        variant="unstyled"
        className={shared.fab}
        onClick={() => setShowCreate(true)}
        aria-label="Novo treino"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Button>

      <CreateWorkoutSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
