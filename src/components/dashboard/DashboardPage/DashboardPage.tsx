import { useNavigate } from "@tanstack/react-router";

import styles from "./DashboardPage.module.css";

import { Button } from "@/components/ui/Button/Button";
import { useAuth } from "@/hooks/useAuth";

export function DashboardPage() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  function logout() {
    clearAuth();
    navigate({ to: "/login" });
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>SHADOW LEVELING</h1>
      <p className={styles.email}>{user?.email}</p>
      <Button variant="ghost" onClick={logout}>
        SAIR DO SISTEMA
      </Button>
    </main>
  );
}
