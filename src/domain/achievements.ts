import { ACHIEVEMENTS, STREAK_ACHIEVEMENTS } from './constants'
import type { Achievement, AchievementId } from './types'

export function achievementSeenKey(achievement: Achievement): AchievementId {
  return `${achievement.kind}:${achievement.days}`
}

export function unlockedAchievements(
  checkinDays: number,
  longestStreak = 0,
): Achievement[] {
  return [
    ...ACHIEVEMENTS.filter((achievement) => checkinDays >= achievement.days),
    ...STREAK_ACHIEVEMENTS.filter(
      (achievement) => longestStreak >= achievement.days,
    ),
  ]
}

export function newlyUnlockedAchievements(
  checkinDays: number,
  longestStreak: number,
  seen: AchievementId[],
): Achievement[] {
  const seenSet = new Set(seen)
  return unlockedAchievements(checkinDays, longestStreak).filter(
    (achievement) => !seenSet.has(achievementSeenKey(achievement)),
  )
}
