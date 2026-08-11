export type TourPlacement = 'top' | 'bottom' | 'sheet'

interface AnchorRect {
  top: number
  right: number
  bottom: number
  left: number
}

interface Size {
  width: number
  height: number
}

export interface TourPosition {
  placement: TourPlacement
  top: number
  left: number
}

const VIEWPORT_MARGIN = 12
const ANCHOR_GAP = 16
const COMPACT_BREAKPOINT = 600

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
}

export function calculateTourPosition(
  anchor: AnchorRect,
  coachmark: Size,
  viewport: Size,
): TourPosition {
  if (viewport.width <= COMPACT_BREAKPOINT) {
    return {
      placement: 'sheet',
      top: Math.max(VIEWPORT_MARGIN, viewport.height - coachmark.height - 12),
      left: VIEWPORT_MARGIN,
    }
  }

  const centredLeft =
    anchor.left + (anchor.right - anchor.left - coachmark.width) / 2
  const left = clamp(
    centredLeft,
    VIEWPORT_MARGIN,
    viewport.width - coachmark.width - VIEWPORT_MARGIN,
  )
  const bottomTop = anchor.bottom + ANCHOR_GAP
  const hasBottomSpace =
    bottomTop + coachmark.height + VIEWPORT_MARGIN <= viewport.height

  return hasBottomSpace
    ? { placement: 'bottom', top: bottomTop, left }
    : {
        placement: 'top',
        top: Math.max(
          VIEWPORT_MARGIN,
          anchor.top - coachmark.height - ANCHOR_GAP,
        ),
        left,
      }
}
