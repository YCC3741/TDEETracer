import { describe, expect, it } from 'vitest'
import {
  achievementSeenKey,
  newlyUnlockedAchievements,
} from '../src/domain/achievements'

describe('achievement unlocks', () => {
  it('keeps total and streak achievements independent at equal thresholds', () => {
    const unlocked = newlyUnlockedAchievements(4, 4, ['total:1', 'total:2'])

    expect(
      unlocked.map((achievement) => ({
        kind: achievement.kind,
        days: achievement.days,
        key: achievementSeenKey(achievement),
      })),
    ).toEqual([
      { kind: 'total', days: 4, key: 'total:4' },
      { kind: 'streak', days: 4, key: 'streak:4' },
    ])
  })

  it('does not let total keys suppress streak unlocks', () => {
    const unlocked = newlyUnlockedAchievements(4, 4, [
      'total:1',
      'total:2',
      'total:4',
    ])

    expect(unlocked).toHaveLength(1)
    expect(unlocked[0]).toMatchObject({ kind: 'streak', days: 4 })
    expect(achievementSeenKey(unlocked[0]!)).toBe('streak:4')
  })
})
