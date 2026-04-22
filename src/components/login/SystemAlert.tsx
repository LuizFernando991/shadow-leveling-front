import styles from './SystemAlert.module.css'

export function SystemAlert() {
  return (
    <div className={styles.alert}>
      <div className={styles.tag}>SISTEMA ATIVO</div>
      <h1 className={styles.title}>SHADOW GYM</h1>
      <p className={styles.sub}>Sistema de Evolução do Caçador</p>
    </div>
  )
}
