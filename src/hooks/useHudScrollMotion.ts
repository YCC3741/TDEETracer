import { useEffect, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MAX_LAG_PX = 14
const RETRACT_AFTER_PX = 80
const CHASE = 0.12
const LAG_GAIN = 0.35
const LAG_EASE = 0.16
const REST_EPSILON = 0.05

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit)
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const sync = () => setReduced(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

/**
 * Publishes scroll motion for every floating HUD as document state: a damped
 * lag offset that settles back home, plus a retract flag while scrolling down.
 */
export function useHudScrollMotion(): void {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const root = document.documentElement
    if (reduced) return

    let smooth = window.scrollY
    let previous = window.scrollY
    let offset = 0
    let frame = 0
    let running = false

    const settle = () => {
      offset = 0
      root.style.setProperty('--hud-scroll-lag', '0px')
      running = false
    }

    /**
     * Two-stage smoothing. Scroll speed only sets a target, and the rendered
     * offset eases towards it, so a single wheel notch cannot jump the HUD.
     */
    const step = () => {
      const current = window.scrollY
      smooth += (current - smooth) * CHASE
      const target = clamp((current - smooth) * LAG_GAIN, MAX_LAG_PX)
      offset += (target - offset) * LAG_EASE

      if (Math.abs(target) < REST_EPSILON && Math.abs(offset) < REST_EPSILON) {
        settle()
        return
      }

      root.style.setProperty('--hud-scroll-lag', `${offset.toFixed(2)}px`)
      frame = requestAnimationFrame(step)
    }

    const onScroll = () => {
      const current = window.scrollY
      root.dataset.hudRetracted = String(
        current > previous && current > RETRACT_AFTER_PX,
      )
      previous = current

      if (!running) {
        running = true
        frame = requestAnimationFrame(step)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
      root.style.removeProperty('--hud-scroll-lag')
      delete root.dataset.hudRetracted
    }
  }, [reduced])
}
