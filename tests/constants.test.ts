import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_LEVELS,
  SELECTABLE_ACTIVITY_LEVELS,
  activityLevelOf,
  isActivityLevelId,
} from '../src/domain/constants'

describe('activity level table', () => {
  it('carries a unique identifier on every level', () => {
    const ids = ACTIVITY_LEVELS.map((level) => level.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every identifier back to its own level', () => {
    ACTIVITY_LEVELS.forEach((level) => {
      expect(activityLevelOf(level.id)).toBe(level)
      expect(isActivityLevelId(level.id)).toBe(true)
    })
  })

  it('does not mistake a stored multiplier for an identifier', () => {
    expect(isActivityLevelId('1.375')).toBe(false)
    expect(isActivityLevelId(1.375)).toBe(false)
    expect(isActivityLevelId('')).toBe(false)
    expect(isActivityLevelId(null)).toBe(false)
  })

  it('offers every level except resting for selection', () => {
    expect(SELECTABLE_ACTIVITY_LEVELS).toHaveLength(ACTIVITY_LEVELS.length - 1)
    expect(
      SELECTABLE_ACTIVITY_LEVELS.some((level) => level.id === 'resting'),
    ).toBe(false)
  })

  it('gives every level a usable multiplier and protein rate', () => {
    ACTIVITY_LEVELS.forEach((level) => {
      expect(level.factor).toBeGreaterThanOrEqual(1)
      expect(level.proteinPerKg).toBeGreaterThan(0)
    })
  })
})
