import { useNavigate } from "@tanstack/react-router";

import shared from "../styles/workout.shared.module.css";

import styles from "./SessionCompletePage.module.css";

import { Button } from "@/components/ui/Button/Button";

interface SessionCompletePageProps {
  workoutId: string;
  doneSets: number;
  totalSets: number;
  elapsed: number;
  pct: number;
  status: "complete" | "incomplete";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SessionCompletePage({
  workoutId,
  doneSets,
  // totalSets,
  elapsed,
  pct,
  status,
}: SessionCompletePageProps) {
  const navigate = useNavigate();
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  return (
    <div className={shared.page}>
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <Button
            variant="unstyled"
            className={shared.iconBtn}
            onClick={() => navigate({ to: "/workout" })}
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
          <span className={shared.topbarTitle}>SESSÃO CONCLUÍDA</span>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.completeRing}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className={styles.headline}>MISSÃO CONCLUÍDA</div>
        <div className={styles.subtitle}>
          Você está ficando mais forte, Caçador
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statBox}>
            <div className={styles.statValue} style={{ color: "var(--blue)" }}>
              {pad(m)}:{pad(s)}
            </div>
            <div className={styles.statLabel}>DURAÇÃO</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue} style={{ color: "var(--green)" }}>
              {doneSets}
            </div>
            <div className={styles.statLabel}>SÉRIES FEITAS</div>
          </div>
          <div className={styles.statBox}>
            <div
              className={styles.statValue}
              style={{ color: "var(--yellow)" }}
            >
              {pct}%
            </div>
            <div className={styles.statLabel}>COMPLETO</div>
          </div>
          <div className={styles.statBox}>
            <div
              className={styles.statValue}
              style={{
                color: "var(--purple)",
                fontSize: "1.125rem",
                paddingTop: "0.25rem",
              }}
            >
              {status === "complete" ? "COMPLETO" : "PARCIAL"}
            </div>
            <div className={styles.statLabel}>STATUS</div>
          </div>
        </div>

        <Button
          variant="unstyled"
          className={`${shared.btn} ${shared.btnPrimary}`}
          onClick={() =>
            navigate({ to: "/workout/$workoutId", params: { workoutId } })
          }
        >
          ← VOLTAR AO TREINO
        </Button>
        <Button
          variant="unstyled"
          className={`${shared.btn} ${shared.btnGhost}`}
          onClick={() => navigate({ to: "/workout" })}
        >
          MEUS TREINOS
        </Button>
      </div>
    </div>
  );
}
