import type { ReactNode } from 'react'
import styles from './LoginCard.module.css'

interface Props {
  children: ReactNode
}

export function LoginCard({ children }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.scanLine} />

      <div className={styles.header}>
        <div className={styles.badge}>E</div>
        <div className={styles.headerText}>
          <h2>AUTENTICAÇÃO</h2>
          <p>Acesse seu painel de missões</p>
        </div>
      </div>

      {children}
    </div>
  )
}
