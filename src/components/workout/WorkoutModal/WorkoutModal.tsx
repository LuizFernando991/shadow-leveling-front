import type { ReactNode } from "react";

import styles from "./WorkoutModal.module.css";

interface WorkoutModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function WorkoutModal({
  open,
  onClose,
  title,
  children,
}: WorkoutModalProps) {
  return (
    <div
      className={`${styles.overlay} ${open ? "" : styles.overlayHidden}`}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}
