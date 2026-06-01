'use client'

import { useEffect, useRef } from 'react'

type LatticeVariant = 'hero' | 'cta' | 'thumb'

interface LatticeOpts {
  density: number
  linkDist: number
  speed: number
  react: number
  mouse: boolean
  pulses: boolean
  maxPulses: number
}

/** Per-variant tuning — design-extract §4.9. */
const VARIANT_OPTS: Record<LatticeVariant, LatticeOpts> = {
  hero: {
    density: 78,
    linkDist: 165,
    speed: 0.2,
    react: 140,
    mouse: true,
    pulses: true,
    maxPulses: 7,
  },
  cta: {
    density: 96,
    linkDist: 140,
    speed: 0.14,
    react: 90,
    mouse: true,
    pulses: true,
    maxPulses: 4,
  },
  thumb: {
    density: 62,
    linkDist: 96,
    speed: 0.1,
    react: 0,
    mouse: false,
    pulses: false,
    maxPulses: 0,
  },
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  ring: boolean
}

interface Pulse {
  x: number
  y: number
  t: number // 0..1 life
}

/**
 * LatticeCanvas — client primitive (design-extract §4.9 generative lattice).
 *
 * Draws a slow-drifting field of nodes joined by proximity links, with optional
 * mouse reaction and periodic light "pulses". Purely decorative, so the canvas
 * is `aria-hidden`. Honours reduced motion (`motion-off` → a single static
 * frame, no rAF), uses a DPR-aware backing store (capped at 2), reacts to
 * resize via ResizeObserver, and pauses the animation loop while offscreen
 * (IntersectionObserver). All timers/observers/listeners are cleaned up on
 * unmount.
 */
export function LatticeCanvas({
  variant = 'hero',
  className,
}: {
  variant?: LatticeVariant
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const opts = VARIANT_OPTS[variant]
    const motionOff = document.body.classList.contains('motion-off')

    let width = 0
    let height = 0
    let dpr = 1
    let nodes: Node[] = []
    const pulses: Pulse[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    let rafId = 0
    let running = false
    let lastPulse = 0

    const rand = (min: number, max: number) => min + Math.random() * (max - min)

    const buildNodes = () => {
      // Scale node count to area, anchored to `density` as a reference cell size.
      const area = Math.max(1, width * height)
      const count = Math.max(8, Math.round(area / (opts.density * opts.density)))
      nodes = []
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: rand(-opts.speed, opts.speed),
          vy: rand(-opts.speed, opts.speed),
          ring: Math.random() < 0.4,
        })
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildNodes()
    }

    const drawFrame = (advance: boolean, now: number, step = 1) => {
      ctx.clearRect(0, 0, width, height)

      // Update + draw nodes.
      for (const n of nodes) {
        if (advance) {
          n.x += n.vx * step
          n.y += n.vy * step
          if (n.x < 0 || n.x > width) n.vx *= -1
          if (n.y < 0 || n.y > height) n.vy *= -1
          n.x = Math.max(0, Math.min(width, n.x))
          n.y = Math.max(0, Math.min(height, n.y))

          // Mouse reaction: gently push nodes within `react` radius.
          if (opts.mouse && opts.react > 0 && mouse.active) {
            const dx = n.x - mouse.x
            const dy = n.y - mouse.y
            const dist = Math.hypot(dx, dy)
            if (dist > 0 && dist < opts.react) {
              const force = (opts.react - dist) / opts.react
              n.x += (dx / dist) * force * 0.6 * step
              n.y += (dy / dist) * force * 0.6 * step
            }
          }
        }
      }

      // Links between nearby nodes.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (!a) continue
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          if (!b) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d < opts.linkDist) {
            const alpha = (1 - d / opts.linkDist) * 0.32
            ctx.strokeStyle = `rgba(181,137,74,${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Nodes: ring (stroked) vs solid (filled).
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.ring ? 2.2 : 1.6, 0, Math.PI * 2)
        if (n.ring) {
          ctx.strokeStyle = 'rgba(203,162,101,.7)'
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.fillStyle = 'rgba(203,162,101,.85)'
          ctx.fill()
        }
      }

      // Pulses (decorative light blooms).
      if (opts.pulses) {
        if (advance && pulses.length < opts.maxPulses && now - lastPulse > rand(900, 2200)) {
          lastPulse = now
          pulses.push({ x: Math.random() * width, y: Math.random() * height, t: 0 })
        }
        for (let p = pulses.length - 1; p >= 0; p--) {
          const pulse = pulses[p]
          if (!pulse) continue
          if (advance) pulse.t += 0.012 * step
          if (pulse.t >= 1) {
            pulses.splice(p, 1)
            continue
          }
          const sin = Math.sin(pulse.t * Math.PI) // 0→1→0 over life
          const haloR = 6 + pulse.t * 46
          ctx.beginPath()
          ctx.arc(pulse.x, pulse.y, haloR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(203,162,101,${0.1 * sin})`
          ctx.fill()
          ctx.beginPath()
          ctx.arc(pulse.x, pulse.y, 2.4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(232,205,150,${0.95 * sin})`
          ctx.fill()
        }
      }
    }

    // Cap the decorative field at ~40fps. The proximity-link pass is O(n^2), so
    // trimming 60 -> 40fps meaningfully relieves the main thread; `step` compensates
    // each draw for the real elapsed time, so the drift speed is unchanged by the cap
    // (clamped so a long gap — e.g. a backgrounded tab — can't fling nodes).
    const FRAME_MS = 1000 / 40
    let lastFrame = 0
    const loop = (now: number) => {
      if (!running) return
      rafId = requestAnimationFrame(loop)
      const elapsed = now - lastFrame
      if (elapsed < FRAME_MS) return
      const step = Math.min(3, elapsed / (1000 / 60))
      lastFrame = now
      drawFrame(true, now, step)
    }

    const start = () => {
      if (running || motionOff) return
      running = true
      rafId = requestAnimationFrame(loop)
    }

    const stop = () => {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    }

    // Pointer tracking (only when the variant reacts to the mouse).
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onPointerLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }

    // Initial sizing + first paint.
    resize()
    drawFrame(false, performance.now())

    // Resize handling.
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resize()
        if (motionOff) drawFrame(false, performance.now())
      })
      resizeObserver.observe(canvas)
    } else {
      window.addEventListener('resize', resize)
    }

    // Visibility-driven pause/resume.
    let intersectionObserver: IntersectionObserver | null = null
    if (!motionOff) {
      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) start()
              else stop()
            }
          },
          { threshold: 0 },
        )
        intersectionObserver.observe(canvas)
      } else {
        start()
      }

      if (opts.mouse && opts.react > 0) {
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        canvas.addEventListener('pointerleave', onPointerLeave)
      }
    }

    return () => {
      stop()
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [variant])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
