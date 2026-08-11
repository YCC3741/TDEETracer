import { isCheckedIn } from '../../domain/calculations'
import { todayString, toDateString } from '../../domain/date'
import type { DiaryDay } from '../../domain/types'

interface DiaryCalendarProps {
  year: number
  month: number
  selectedDate: string
  diary: DiaryDay[]
  onSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
  embedded?: boolean
}

export function DiaryCalendar({
  year,
  month,
  selectedDate,
  diary,
  onSelect,
  onMonthChange,
  embedded = false,
}: DiaryCalendarProps) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const checkins = new Set(diary.filter(isCheckedIn).map((day) => day.date))
  const today = todayString()
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  while (cells.length < 42) cells.push(null)

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1)
    onMonthChange(next.getFullYear(), next.getMonth())
  }

  return (
    <section className={embedded ? 'calendar-view' : 'card calendar-card'}>
      <header className="calendar-head">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="上個月"
        >
          ←
        </button>
        <div>
          <span className="eyebrow">Check-in calendar</span>
          <h2>
            {year} 年 {month + 1} 月
          </h2>
        </div>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="下個月"
        >
          →
        </button>
      </header>
      <div className="calendar-grid weekdays" aria-hidden="true">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          if (!day)
            return <span className="calendar-empty" key={`empty-${index}`} />
          const date = toDateString(new Date(year, month, day))
          const classNames = [
            'calendar-day',
            date === selectedDate ? 'selected' : '',
            date === today ? 'today' : '',
            checkins.has(date) ? 'checked' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              className={classNames}
              type="button"
              key={date}
              onClick={() => onSelect(date)}
            >
              <span>{day}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
