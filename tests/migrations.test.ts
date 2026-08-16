import { describe, expect, it } from 'vitest'
import { diaryNeedsMigration, migrateDiaryDay } from '../src/storage/migrations'
import { legacyDiaryFixture } from './fixtures'

describe('legacy diary migration', () => {
  it('converts one intake and exercises into entries', () => {
    const migrated = migrateDiaryDay(legacyDiaryFixture)
    expect(migrated).not.toBeNull()
    expect(migrated?.entries).toHaveLength(2)
    expect(migrated?.entries[0]).toMatchObject({
      id: '2026-08-11_food_legacy',
      type: 'food',
      kcal: 450,
    })
    expect(migrated?.entries[1]).toMatchObject({
      id: '2026-08-11_ex_legacy_0',
      type: 'exercise',
      presetId: 'walk',
      kcal: 128,
    })
    expect(migrated?.actualWeightKg).toBeNull()
  })

  it('keeps recorded protein and leaves untouched entries unrecorded', () => {
    const migrated = migrateDiaryDay({
      date: '2026-08-11',
      entries: [
        {
          id: 'a',
          type: 'food',
          time: '08:00',
          label: '早餐',
          kcal: 450,
          protein: 30,
        },
        { id: 'b', type: 'food', time: '12:00', label: '午餐', kcal: 600 },
        {
          id: 'c',
          type: 'food',
          time: '19:00',
          label: '晚餐',
          kcal: 500,
          protein: -5,
        },
      ],
    })

    expect(migrated?.entries[0]).toMatchObject({ protein: 30 })
    expect(migrated?.entries[1]).toMatchObject({ protein: null })
    expect(migrated?.entries[2]).toMatchObject({ protein: null })
  })

  it('preserves valid actual weight and rejects invalid values', () => {
    expect(
      migrateDiaryDay({
        date: '2026-08-11',
        actualWeightKg: 72.4,
        entries: [],
      })?.actualWeightKg,
    ).toBe(72.4)
    expect(
      migrateDiaryDay({
        date: '2026-08-11',
        actualWeightKg: Number.POSITIVE_INFINITY,
        entries: [],
      })?.actualWeightKg,
    ).toBeNull()
    expect(
      migrateDiaryDay({
        date: '2026-08-11',
        actualWeightKg: 10,
        entries: [],
      })?.actualWeightKg,
    ).toBeNull()
  })

  it('detects only the old diary shape', () => {
    expect(diaryNeedsMigration([legacyDiaryFixture])).toBe(true)
    expect(
      diaryNeedsMigration([
        {
          date: '2026-08-11',
          actualWeightKg: null,
          entries: [],
        },
      ]),
    ).toBe(false)
    expect(
      diaryNeedsMigration([
        {
          date: '2026-08-11',
          entries: [],
        },
      ]),
    ).toBe(true)
  })
})
