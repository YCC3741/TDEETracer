import { useEffect, useState } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MAX_LAG_PX = 24
const RETRACT_AFTER_PX = 80
const CHASE = 0.12
const LAG_GAIN = 0.9
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
    let frame = 0
    let running = false

    const settle = () => {
      root.style.setProperty('--hud-scroll-lag', '0px')
      running = false
    }

    const step = () => {
      const current = window.scrollY
      smooth += (current - smooth) * CHASE
      const lag = clamp((current - smooth) * LAG_GAIN, MAX_LAG_PX)

      if (Math.abs(lag) < REST_EPSILON) {
        settle()
        return
      }

      root.style.setProperty('--hud-scroll-lag', `${lag.toFixed(2)}px`)
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
