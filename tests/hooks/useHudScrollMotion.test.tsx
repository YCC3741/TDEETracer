import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHudScrollMotion } from '../../src/hooks/useHudScrollMotion'

function Harness() {
  useHudScrollMotion()
  return null
}

const root = document.documentElement
const originalMatchMedia = window.matchMedia

function scrollTo(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value })
  window.dispatchEvent(new Event('scroll'))
}

function lag(): string {
  return root.style.getPropertyValue('--hud-scroll-lag')
}

function stubMatchMedia(value: unknown) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value,
  })
}

afterEach(() => {
  stubMatchMedia(originalMatchMedia)
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})

describe('HUD scroll motion', () => {
  it('retracts while scrolling down and returns on the way back up', () => {
    render(<Harness />)

    act(() => scrollTo(240))
    expect(root.dataset.hudRetracted).toBe('true')

    act(() => scrollTo(120))
    expect(root.dataset.hudRetracted).toBe('false')
  })

  it('holds the HUD in place for short scrolls near the top', () => {
    render(<Harness />)

    act(() => scrollTo(40))
    expect(root.dataset.hudRetracted).toBe('false')
  })

  it('ramps into the trailing offset instead of jumping on one wheel notch', () => {
    vi.useFakeTimers()
    render(<Harness />)

    act(() => scrollTo(400))
    act(() => {
      vi.advanceTimersByTime(20)
    })
    const firstFrame = Number.parseFloat(lag())
    expect(firstFrame).toBeGreaterThan(0)
    expect(firstFrame).toBeLessThan(6)

    act(() => {
      vi.advanceTimersByTime(80)
    })
    expect(Number.parseFloat(lag())).toBeGreaterThan(firstFrame)
  })

  it('settles the offset back home once scrolling stops', () => {
    vi.useFakeTimers()
    render(<Harness />)

    act(() => scrollTo(400))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(lag()).toBe('0px')
  })

  it('stays completely still when reduced motion is preferred', () => {
    stubMatchMedia(
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    render(<Harness />)

    act(() => scrollTo(400))
    expect(root.dataset.hudRetracted).toBeUndefined()
    expect(lag()).toBe('')
  })

  it('clears the published document state on unmount', () => {
    const view = render(<Harness />)
    act(() => scrollTo(400))

    view.unmount()
    expect(root.dataset.hudRetracted).toBeUndefined()
    expect(lag()).toBe('')
  })
})
