import { ParticleCanvas } from './ParticleCanvas'
import { PortalGlow } from './PortalGlow'
import { SystemAlert } from './SystemAlert'
import { LoginCard } from './LoginCard'
import { LoginForm } from './LoginForm'
import styles from './LoginPage.module.css'

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
  )
}
