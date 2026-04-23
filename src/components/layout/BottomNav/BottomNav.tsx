import { useRouterState, useNavigate } from "@tanstack/react-router";

import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "INÍCIO",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/workout",
    label: "TREINOS",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 5v14M6 5l3 3M6 5l-3 3M18 19V5M18 19l3-3M18 19l-3-3" />
      </svg>
    ),
  },
  {
    to: "/tasks",
    label: "MISSÕES",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.to;
        return (
          <button
            key={item.to}
            type="button"
            className={`${styles.item} ${active ? styles.active : ""}`}
            onClick={() => navigate({ to: item.to })}
          >
            {item.icon}
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
