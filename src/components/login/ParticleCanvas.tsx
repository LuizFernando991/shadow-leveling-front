import { useParticleCanvas } from '@/hooks/useParticleCanvas'
import styles from './ParticleCanvas.module.css'

export function ParticleCanvas() {
  const canvasRef = useParticleCanvas()
  return <canvas ref={canvasRef} className={styles.canvas} />
}
