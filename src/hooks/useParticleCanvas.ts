import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
}

export function useParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const BLUE = 'rgba(0, 180, 255,'
    const PURPLE = 'rgba(120, 60, 220,'

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.5 ? BLUE : PURPLE,
      alpha: Math.random() * 0.6 + 0.2,
    }))

    function drawGrid() {
      const spacing = 60
      ctx!.strokeStyle = 'rgba(0, 140, 255, 0.04)'
      ctx!.lineWidth = 1
      for (let x = 0; x < canvas!.width; x += spacing) {
        ctx!.beginPath()
        ctx!.moveTo(x, 0)
        ctx!.lineTo(x, canvas!.height)
        ctx!.stroke()
      }
      for (let y = 0; y < canvas!.height; y += spacing) {
        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(canvas!.width, y)
        ctx!.stroke()
      }
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15
            ctx!.strokeStyle = `rgba(0, 160, 255, ${alpha})`
            ctx!.lineWidth = 0.5
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }
    }

    let animId: number

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      const grad = ctx!.createRadialGradient(
        canvas!.width / 2, canvas!.height / 2, 0,
        canvas!.width / 2, canvas!.height / 2, canvas!.width * 0.7,
      )
      grad.addColorStop(0, 'rgba(8, 5, 30, 1)')
      grad.addColorStop(1, 'rgba(4, 4, 14, 1)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      drawGrid()

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas!.width
        if (p.x > canvas!.width) p.x = 0
        if (p.y < 0) p.y = canvas!.height
        if (p.y > canvas!.height) p.y = 0

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `${p.color}${p.alpha})`
        ctx!.fill()

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx!.fillStyle = `${p.color}${p.alpha * 0.1})`
        ctx!.fill()
      }

      connectParticles()
      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return canvasRef
}
