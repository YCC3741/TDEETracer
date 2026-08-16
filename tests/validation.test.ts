import { describe, expect, it } from 'vitest'
import { WEIGHT_RANGE_KG } from '../src/domain/constants'
import { isValidWeightKg, parseProfile } from '../src/domain/validation'

const storedProfile = {
  sex: 'female',
  age: 30,
  height: 170,
  weight: 75,
  target: 65,
  activityLevel: 'light',
  intake: 1500,
  deficit: null,
  mode: 'intake',
  planStartedAt: '2026-08-11',
}

describe('profile parsing', () => {
  it('accepts a profile that names its activity level', () => {
    expect(parseProfile(storedProfile)?.activityLevel).toBe('light')
  })

  it('rejects an activity level it does not recognise', () => {
    expect(
      parseProfile({ ...storedProfile, activityLevel: 'casual' }),
    ).toBeNull()
  })

  it('leaves the stored multiplier to the schema chain', () => {
    const { activityLevel, ...withoutLevel } = storedProfile
    expect(activityLevel).toBe('light')
    expect(parseProfile({ ...withoutLevel, factor: 1.375 })).toBeNull()
  })
})

describe('body weight guard', () => {
  it('accepts the inclusive bounds and anything between them', () => {
    expect(isValidWeightKg(WEIGHT_RANGE_KG.min)).toBe(true)
    expect(isValidWeightKg(WEIGHT_RANGE_KG.max)).toBe(true)
    expect(isValidWeightKg(72.4)).toBe(true)
  })

  it('rejects anything outside the bounds', () => {
    expect(isValidWeightKg(WEIGHT_RANGE_KG.min - 0.1)).toBe(false)
    expect(isValidWeightKg(WEIGHT_RANGE_KG.max + 0.1)).toBe(false)
    expect(isValidWeightKg(0)).toBe(false)
  })

  it('rejects values that are not finite numbers', () => {
    expect(isValidWeightKg(Number.NaN)).toBe(false)
    expect(isValidWeightKg(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isValidWeightKg(null)).toBe(false)
    expect(isValidWeightKg(undefined)).toBe(false)
    expect(isValidWeightKg('70')).toBe(false)
  })
})
