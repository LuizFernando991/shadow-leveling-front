import { LoginCard } from "../LoginCard/LoginCard";
import { LoginForm } from "../LoginForm/LoginForm";
import { ParticleCanvas } from "../ParticleCanvas/ParticleCanvas";
import { PortalGlow } from "../PortalGlow/PortalGlow";
import { SystemAlert } from "../SystemAlert/SystemAlert";

import styles from "./LoginPage.module.css";

export function LoginPage() {
  return (
    <>
      <ParticleCanvas />
      <PortalGlow />
      <div className={styles.cornerTl} />
      <div className={styles.cornerBr} />
      <div className={styles.statusBar} />

      <main className={styles.screen}>
        <SystemAlert />
        <LoginCard>
          <LoginForm />
        </LoginCard>
      </main>
    </>
  );
}
