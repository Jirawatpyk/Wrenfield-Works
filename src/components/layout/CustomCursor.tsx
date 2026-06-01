'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

// Elements that make the ring "hot" (scaled up) on hover — design-extract §4.2.
const HOT_SELECTOR = 'a,button,.sc-tab,.logo-item,.cap,.case'

const LERP = 0.16

/**
 * Whether the decorative cursor should render: fine pointer, viewport > 900px, motion on.
 * Read as an EXTERNAL store (matchMedia + the `motion-off` body class) via
 * `useSyncExternalStore` so it is SSR-safe (server snapshot = false) and — unlike a one-time
 * mount snapshot — stays correct when the viewport, pointer type, or reduced-motion preference
 * changes at runtime (resolves the snapshot-only limitation, FR-007c).
 */
function subscribeEnabled(cb: () => void): () => void {
  const coarse = window.matchMedia('(pointer: coarse)')
  const narrow = window.matchMedia('(max-width:900px)')
  coarse.addEventListener('change', cb)
  narrow.addEventListener('change', cb)
  // `motion-off` is toggled on <body> by the theme system, not via an event — observe it.
  const mo = new MutationObserver(cb)
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  return () => {
    coarse.removeEventListener('change', cb)
    narrow.removeEventListener('change', cb)
    mo.disconnect()
  }
}

function getEnabledSnapshot(): boolean {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width:900px)').matches
  const motionOff = document.body.classList.contains('motion-off')
  return !coarse && !narrow && !motionOff
}

function getServerEnabledSnapshot(): boolean {
  return false
}

/**
 * Custom desktop cursor (design-extract §3.0 / §4.2, Ambiguity #6).
 *
 * Two layers: `.cursor-dot` follows the pointer instantly, `.cursor-ring` eases toward it
 * (lerp 0.16/frame). The elements are `aria-hidden`, `pointer-events: none` (via CSS), and
 * never touch the native focus outline.
 */
export function CustomCursor() {
  const enabled = useSyncExternalStore(
    subscribeEnabled,
    getEnabledSnapshot,
    getServerEnabledSnapshot,
  )
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) {
      return
    }

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let frame = 0

    const onMove = (event: PointerEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      // Dot follows instantly.
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`
    }

    const onOver = (event: Event) => {
      const target = event.target as Element | null
      if (target?.closest?.(HOT_SELECTOR)) {
        ring.classList.add('hot')
      }
    }

    const onOut = (event: Event) => {
      const target = event.target as Element | null
      if (target?.closest?.(HOT_SELECTOR)) {
        ring.classList.remove('hot')
      }
    }

    const onDown = () => ring.classList.add('down')
    const onUp = () => ring.classList.remove('down')

    const tick = () => {
      ringX += (mouseX - ringX) * LERP
      ringY += (mouseY - ringY) * LERP
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`
      frame = window.requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, true)
    document.addEventListener('pointerout', onOut, true)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    frame = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver, true)
      document.removeEventListener('pointerout', onOut, true)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      ring.classList.remove('hot', 'down')
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
