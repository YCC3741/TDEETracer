import { describe, expect, it } from 'vitest'
import { calculateTourPosition } from '../../../src/features/tour/tourPosition'

describe('guided tour positioning', () => {
  it('places the coachmark below the anchor when space is available', () => {
    expect(
      calculateTourPosition(
        { top: 80, right: 300, bottom: 160, left: 100 },
        { width: 280, height: 160 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ placement: 'bottom', top: 176, left: 60 })
  })

  it('flips above and clamps the coachmark within viewport edges', () => {
    expect(
      calculateTourPosition(
        { top: 500, right: 790, bottom: 570, left: 700 },
        { width: 280, height: 160 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ placement: 'top', top: 324, left: 508 })
  })

  it('uses a bottom sheet position on compact viewports', () => {
    expect(
      calculateTourPosition(
        { top: 100, right: 300, bottom: 160, left: 20 },
        { width: 296, height: 180 },
        { width: 320, height: 640 },
      ),
    ).toEqual({ placement: 'sheet', top: 448, left: 12 })
  })
})
