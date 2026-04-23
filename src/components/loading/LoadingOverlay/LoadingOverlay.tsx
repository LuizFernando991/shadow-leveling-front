import { useEffect, useState } from "react";

import styles from "./LoadingOverlay.module.css";

import { useLoadingCanvas } from "@/hooks/useLoadingCanvas";

interface LogLine {
  status: string;
  type: "ok" | "loading" | "warn";
  msg: string;
}

const LOG_STEPS: LogLine[] = [
  { status: "OK", type: "ok", msg: "Protocolo de segurança verificado" },
  { status: "OK", type: "ok", msg: "Conexão com servidor estabelecida" },
  { status: "...", type: "loading", msg: "Carregando perfil do caçador" },
  { status: "OK", type: "ok", msg: "Dados de treino sincronizados" },
  { status: "OK", type: "ok", msg: "Histórico de missões carregado" },
  {
    status: "...",
    type: "loading",
    msg: "Inicializando sistema de progressão",
  },
  { status: "OK", type: "ok", msg: "Atributos e habilidades carregados" },
  { status: "WARN", type: "warn", msg: "2 missões pendentes detectadas" },
  { status: "OK", type: "ok", msg: "Interface do sistema pronta" },
];

const PROG_STEPS = [0, 8, 18, 32, 45, 60, 72, 85, 95, 100];
const DELAYS = [200, 380, 550, 750, 950, 1200, 1450, 1700, 1950];

interface Props {
  canExit: boolean;
  onExited: () => void;
}

export function LoadingOverlay({ canExit, onExited }: Props) {
  const canvasRef = useLoadingCanvas();
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [animDone, setAnimDone] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    LOG_STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setProgress(PROG_STEPS[i + 1]);
          setLogLines((prev) => [...prev, step]);

          if (i === LOG_STEPS.length - 1) {
            timers.push(
              setTimeout(() => {
                setProgress(100);
                setAnimDone(true);
              }, 300),
            );
          }
        }, DELAYS[i]),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!animDone || !canExit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsExiting(true);
    const t = setTimeout(onExited, 600);
    return () => clearTimeout(t);
  }, [animDone, canExit]); // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_VISIBLE = 3;
  const LINE_H = 19;
  const scrollOffset = Math.max(0, logLines.length - MAX_VISIBLE) * LINE_H;

  return (
    <div className={`${styles.overlay}${isExiting ? ` ${styles.hidden}` : ""}`}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.portalRing} />

      <div className={`${styles.corner} ${styles.tl}`} />
      <div className={`${styles.corner} ${styles.tr}`} />
      <div className={`${styles.corner} ${styles.bl}`} />
      <div className={`${styles.corner} ${styles.br}`} />
      <div className={styles.scanLine} />
      <div className={`${styles.hline} ${styles.hlineTop}`} />
      <div className={`${styles.hline} ${styles.hlineBot}`} />

      <div className={styles.content}>
        <div className={styles.tag}>
          <span className={styles.blinkDot} />
          INICIALIZANDO SISTEMA
        </div>

        <div className={styles.logo}>SHADOW LEVELING</div>
        <div className={styles.sub}>Sistema de Evolução do Caçador</div>

        <div className={styles.spinnerWrap}>
          <div className={styles.hexRing} />
          <div className={styles.hexRing} />
          <div className={styles.hexRing} />
          <div className={styles.hexCenter} />
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>CARREGANDO DADOS</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={styles.log}>
          <div
            className={styles.logLines}
            style={
              scrollOffset > 0
                ? { transform: `translateY(-${scrollOffset}px)` }
                : undefined
            }
          >
            {logLines.map((line, i) => (
              <div key={i} className={`${styles.logLine} ${styles[line.type]}`}>
                <span className={styles.logStatus}>[{line.status}]</span>
                <span>{line.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.statusBar} />
    </div>
  );
}
