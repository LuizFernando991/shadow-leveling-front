import { useNavigate } from "@tanstack/react-router";

import styles from "./SessionCompletePage.module.css";

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
  elapsed,
  pct,
  status,
}: SessionCompletePageProps) {
  const navigate = useNavigate();
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.topbarTitle}>SESSÃO CONCLUÍDA</span>
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
              {status.toUpperCase()}
            </div>
            <div className={styles.statLabel}>STATUS</div>
          </div>
        </div>

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() =>
            navigate({ to: "/workout/$workoutId", params: { workoutId } })
          }
        >
          ← VOLTAR AO TREINO
        </button>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => navigate({ to: "/workout" })}
        >
          MEUS TREINOS
        </button>
      </div>
    </div>
  );
}
