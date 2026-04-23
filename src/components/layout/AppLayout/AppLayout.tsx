import { Outlet } from "@tanstack/react-router";

import { BottomNav } from "../BottomNav/BottomNav";

import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.outlet}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
