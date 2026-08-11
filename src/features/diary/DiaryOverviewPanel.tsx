import { useState } from 'react'
import { handleTabListKeyDown } from '../../components/tabKeyboard'
import type { AchievementId, DiaryDay } from '../../domain/types'
import { AchievementsPanel } from './AchievementsPanel'
import { DiaryCalendar } from './DiaryCalendar'

interface DiaryOverviewPanelProps {
  year: number
  month: number
  selectedDate: string
  diary: DiaryDay[]
  checkinDays: number
  longestStreak: number
  unlockedIds: AchievementId[]
  onSelectDate: (date: string) => void
  onMonthChange: (year: number, month: number) => void
}

export function DiaryOverviewPanel({
  year,
  month,
  selectedDate,
  diary,
  checkinDays,
  longestStreak,
  unlockedIds,
  onSelectDate,
  onMonthChange,
}: DiaryOverviewPanelProps) {
  const [view, setView] = useState<'calendar' | 'achievements'>('calendar')

  return (
    <section className="card diary-overview-card">
      <header className="overview-tabs-head">
        <div className="panel-tabs" role="tablist" aria-label="簽到顯示方式">
          <button
            className={view === 'calendar' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={view === 'calendar'}
            aria-controls="diary-calendar-panel"
            tabIndex={view === 'calendar' ? 0 : -1}
            onClick={() => setView('calendar')}
            onKeyDown={(event) =>
              handleTabListKeyDown(event, 0, 2, (index) =>
                setView(index === 0 ? 'calendar' : 'achievements'),
              )
            }
          >
            簽到日曆
          </button>
          <button
            className={view === 'achievements' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={view === 'achievements'}
            aria-controls="diary-achievements-panel"
            tabIndex={view === 'achievements' ? 0 : -1}
            onClick={() => setView('achievements')}
            onKeyDown={(event) =>
              handleTabListKeyDown(event, 1, 2, (index) =>
                setView(index === 0 ? 'calendar' : 'achievements'),
              )
            }
          >
            簽到成就
          </button>
        </div>
      </header>

      {view === 'calendar' ? (
        <div id="diary-calendar-panel" role="tabpanel">
          <DiaryCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            diary={diary}
            onSelect={onSelectDate}
            onMonthChange={onMonthChange}
            embedded
          />
        </div>
      ) : (
        <div id="diary-achievements-panel" role="tabpanel">
          <AchievementsPanel
            checkinDays={checkinDays}
            longestStreak={longestStreak}
            unlockedIds={unlockedIds}
            embedded
          />
        </div>
      )}
    </section>
  )
}
