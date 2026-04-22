import styles from './ParticleCanvas.module.css'

import { useParticleCanvas } from '@/hooks/useParticleCanvas'

export function ParticleCanvas() {
  const canvasRef = useParticleCanvas()
  return <canvas ref={canvasRef} className={styles.canvas} />
}
