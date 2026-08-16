import { describe, expect, it } from 'vitest'
import { EXERCISE_PRESETS } from '../../../src/domain/constants'
import { EXERCISE_OPTIONS } from '../../../src/features/diary/exerciseOptions'

describe('exercise picker options', () => {
  it('offers exactly one option per preset', () => {
    expect(EXERCISE_OPTIONS.map((option) => option.value)).toEqual(
      EXERCISE_PRESETS.map((preset) => preset.id),
    )
  })

  it('reads every MET figure straight from the preset table', () => {
    EXERCISE_PRESETS.filter((preset) => preset.met !== null).forEach(
      (preset) => {
        const option = EXERCISE_OPTIONS.find(
          (item) => item.value === preset.id,
        )!
        expect(option.description.endsWith(` · MET ${preset.met}`)).toBe(true)
      },
    )
  })

  it('leaves the custom option without a MET figure', () => {
    const custom = EXERCISE_OPTIONS.find((option) => option.value === 'custom')!
    expect(custom.description).not.toMatch(/MET \d/)
  })
})
