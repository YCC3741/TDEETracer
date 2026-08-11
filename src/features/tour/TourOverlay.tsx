import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTour } from './TourContext'
import { calculateTourPosition } from './tourPosition'

interface AnchorBox {
  top: number
  right: number
  bottom: number
  left: number
}

const SPOTLIGHT_PADDING = 8
const COACHMARK_SIZE = { width: 360, height: 220 }

function anchorSelector(anchor: string): string {
  return `[data-tour-anchor="${anchor}"]`
}

export function TourOverlay() {
  const tour = useTour()
  const [anchorBox, setAnchorBox] = useState<AnchorBox | null>(null)

  useEffect(() => {
    if (tour.phase !== 'active' || !tour.step) return
    let frame = 0
    let observer: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let currentTarget: HTMLElement | null = null

    const update = () => {
      const target = document.querySelector<HTMLElement>(
        anchorSelector(tour.step!.anchor),
      )
      if (target !== currentTarget) {
        observer?.disconnect()
        currentTarget = target
        if (target) {
          observer = new ResizeObserver(() => schedule())
          observer.observe(target)
          target.scrollIntoView({
            block: 'center',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
          })
        }
      }
      if (!target) {
        setAnchorBox(null)
        return
      }
      const rect = target.getBoundingClientRect()
      setAnchorBox({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      })
    }

    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    window.visualViewport?.addEventListener('resize', schedule)
    mutationObserver = new MutationObserver(schedule)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      observer?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [tour.phase, tour.step])

  const position = useMemo(() => {
    const viewport = {
      width: window.visualViewport?.width ?? window.innerWidth,
      height: window.visualViewport?.height ?? window.innerHeight,
    }
    if (!anchorBox) {
      return {
        placement: 'sheet' as const,
        top: Math.max(12, (viewport.height - COACHMARK_SIZE.height) / 2),
        left: Math.max(12, (viewport.width - COACHMARK_SIZE.width) / 2),
      }
    }
    return calculateTourPosition(anchorBox, COACHMARK_SIZE, viewport)
  }, [anchorBox])

  if (tour.phase !== 'active' || !tour.step) return null

  const padded = anchorBox
    ? {
        top: Math.max(0, anchorBox.top - SPOTLIGHT_PADDING),
        right: Math.min(window.innerWidth, anchorBox.right + SPOTLIGHT_PADDING),
        bottom: Math.min(
          window.innerHeight,
          anchorBox.bottom + SPOTLIGHT_PADDING,
        ),
        left: Math.max(0, anchorBox.left - SPOTLIGHT_PADDING),
      }
    : null
  const coachmarkStyle = {
    top: position.top,
    left: position.left,
  } satisfies CSSProperties
  const target = document.querySelector<HTMLElement>(
    anchorSelector(tour.step.anchor),
  )
  const scope = target?.closest<HTMLElement>('[data-tour-scope]')

  const shades = padded ? (
    <div className="tour-shades" aria-hidden="true">
      <div
        className="tour-shade"
        style={{ inset: `0 0 auto 0`, height: padded.top }}
      />
      <div
        className="tour-shade"
        style={{
          top: padded.top,
          right: window.innerWidth - padded.left,
          bottom: window.innerHeight - padded.bottom,
          left: 0,
        }}
      />
      <div
        className="tour-shade"
        style={{
          top: padded.top,
          right: 0,
          bottom: window.innerHeight - padded.bottom,
          left: padded.right,
        }}
      />
      <div
        className="tour-shade"
        style={{ inset: `${padded.bottom}px 0 0 0` }}
      />
      <div
        className="tour-spotlight"
        style={{
          top: padded.top,
          left: padded.left,
          width: padded.right - padded.left,
          height: padded.bottom - padded.top,
        }}
      />
    </div>
  ) : (
    <div className="tour-missing-backdrop" aria-hidden="true" />
  )

  const coachmark = (
    <section
      className={`tour-coachmark placement-${position.placement}${scope ? ' in-modal' : ''}`}
      style={coachmarkStyle}
      role="dialog"
      aria-labelledby="tour-coachmark-title"
      aria-describedby="tour-coachmark-description"
    >
      <div className="tour-coachmark-meta">
        <span>
          {tour.stepIndex + 1} / {tour.stepCount}
        </span>
        <button type="button" onClick={tour.skip}>
          略過教學
        </button>
      </div>
      <h2 id="tour-coachmark-title">{tour.step.title}</h2>
      <p id="tour-coachmark-description">{tour.step.description}</p>
      {!anchorBox ? (
        <p className="tour-anchor-status" role="status">
          正在準備下一步
        </p>
      ) : null}
      <div className="tour-coachmark-actions">
        <button
          className="ghost-btn"
          type="button"
          disabled={tour.stepIndex === 0}
          onClick={tour.previous}
        >
          上一步
        </button>
        <button
          className="secondary-btn"
          type="button"
          disabled={tour.step.requiresAction || !anchorBox}
          onClick={tour.next}
        >
          {tour.step.requiresAction ? '請完成目前操作' : '下一步'}
        </button>
      </div>
    </section>
  )

  return (
    <>
      {createPortal(shades, document.body)}
      {createPortal(coachmark, scope ?? document.body)}
    </>
  )
}
