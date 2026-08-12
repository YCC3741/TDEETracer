import { ACHIEVEMENTS, STREAK_ACHIEVEMENTS } from '../../domain/constants'
import type { Achievement, AchievementId } from '../../domain/types'

interface AchievementsPanelProps {
  checkinDays: number
  longestStreak: number
  unlockedIds?: AchievementId[]
  embedded?: boolean
}

function AchievementTile({
  achievement,
  progress,
  unlockedIds,
}: {
  achievement: Achievement
  progress: number
  unlockedIds: Set<AchievementId>
}) {
  const unlocked =
    progress >= achievement.days ||
    unlockedIds.has(`${achievement.kind}:${achievement.days}`)
  return (
    <article className={`achievement${unlocked ? ' unlocked' : ''}`}>
      <span className="achievement-node" aria-hidden="true">
        <i />
      </span>
      <strong>{achievement.title}</strong>
      <small>{achievement.days} 天</small>
    </article>
  )
}

function AchievementRows({
  checkinDays,
  longestStreak,
  unlockedIds,
}: {
  checkinDays: number
  longestStreak: number
  unlockedIds: AchievementId[]
}) {
  const unlockedSet = new Set(unlockedIds)
  const rows = [
    {
      id: 'total-first',
      achievements: ACHIEVEMENTS.slice(0, 5),
      progress: checkinDays,
    },
    {
      id: 'total-second',
      achievements: ACHIEVEMENTS.slice(5),
      progress: checkinDays,
    },
    {
      id: 'streak',
      achievements: STREAK_ACHIEVEMENTS,
      progress: longestStreak,
    },
  ]

  return (
    <div className="achievement-grid">
      {rows.flatMap((row, rowIndex) => [
        ...(rowIndex
          ? [
              <div
                aria-hidden="true"
                className="achievement-divider"
                key={`${row.id}-divider`}
              />,
            ]
          : []),
        ...row.achievements.map((achievement) => (
          <AchievementTile
            achievement={achievement}
            progress={row.progress}
            unlockedIds={unlockedSet}
            key={`${achievement.kind}-${achievement.days}`}
          />
        )),
      ])}
    </div>
  )
}

export function AchievementsPanel({
  checkinDays,
  longestStreak,
  unlockedIds = [],
  embedded = false,
}: AchievementsPanelProps) {
  return (
    <section
      className={embedded ? 'achievements-view' : 'card achievements-card'}
    >
      {!embedded ? (
        <header className="section-head">
          <div>
            <span className="eyebrow">Milestones</span>
            <h2>簽到成就</h2>
          </div>
          <strong>{checkinDays} 個紀錄日</strong>
        </header>
      ) : null}
      <AchievementRows
        checkinDays={checkinDays}
        longestStreak={longestStreak}
        unlockedIds={unlockedIds}
      />
    </section>
  )
}
