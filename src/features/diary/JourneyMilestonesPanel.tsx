import type { AchievementId } from '../../domain/types'
import { AchievementsPanel } from './AchievementsPanel'

interface JourneyMilestonesPanelProps {
  checkinDays: number
  longestStreak: number
  unlockedIds: AchievementId[]
}

export function JourneyMilestonesPanel({
  checkinDays,
  longestStreak,
  unlockedIds,
}: JourneyMilestonesPanelProps) {
  return (
    <section className="entry-achievement-panel">
      <div className="achievement-summary" aria-label="成就累積摘要">
        <div>
          <span>累積紀錄</span>
          <strong>{checkinDays} 日</strong>
        </div>
        <div>
          <span>最長連續</span>
          <strong>{longestStreak} 日</strong>
        </div>
      </div>
      <AchievementsPanel
        checkinDays={checkinDays}
        longestStreak={longestStreak}
        unlockedIds={unlockedIds}
        embedded
      />
    </section>
  )
}
