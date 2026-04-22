import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()

  function logout() {
    clearAuth()
    navigate({ to: '/login' })
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>SHADOW GYM</h1>
      <p className={styles.email}>{user?.email}</p>
      <Button variant="ghost" onClick={logout}>SAIR DO SISTEMA</Button>
    </main>
  )
}
