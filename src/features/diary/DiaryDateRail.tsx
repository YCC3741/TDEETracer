import { Dialog } from '@base-ui/react/dialog'
import { useState } from 'react'
import { LayeredCircleNode } from '../../components/layered/LayeredCircleNode'
import { SaoActionButton } from '../../components/sao/SaoActionButton'
import { SaoDialogPopup } from '../../components/sao/SaoDialogPopup'
import { dayTotals, isCheckedIn } from '../../domain/calculations'
import {
  addDays,
  parseLocalDate,
  todayString,
  toDateString,
} from '../../domain/date'
import type { DiaryDay } from '../../domain/types'
import { DateTodayMarker } from './DateTodayMarker'
import { DiaryCalendar } from './DiaryCalendar'

interface DiaryDateRailProps {
  year: number
  month: number
  selectedDate: string
  diary: DiaryDay[]
  onSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
}

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

function displayDate(date: string): string {
  return date.replaceAll('-', '/')
}

export function DiaryDateRail({
  year,
  month,
  selectedDate,
  diary,
  onSelect,
  onMonthChange,
}: DiaryDateRailProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const selected = parseLocalDate(selectedDate)
  const weekStart = addDays(selected, -selected.getDay())
  const weekDates = Array.from({ length: 7 }, (_, index) =>
    toDateString(addDays(weekStart, index)),
  )
  const checkins = new Set(diary.filter(isCheckedIn).map((day) => day.date))
  const selectedDay = diary.find((day) => day.date === selectedDate) ?? null
  const totals = dayTotals(selectedDay)
  const today = todayString()

  const changeWeek = (offset: number) => {
    onSelect(toDateString(addDays(selected, offset * 7)))
  }

  return (
    <section
      className="diary-date-rail layered-window"
      role="region"
      aria-label="七日日期導覽"
      data-tour-anchor="diary-date-rail"
    >
      <div className="date-rail-heading">
        <div className="date-rail-copy">
          <span className="route-section-label">每日路徑</span>
          <strong>
            {selected.getFullYear()} 年 {selected.getMonth() + 1} 月
          </strong>
          <div
            className="date-rail-summary date-rail-telemetry"
            aria-label="選定日期摘要"
          >
            <div className="date-rail-telemetry-item food">
              <span>飲食攝取</span>
              <strong>+{Math.round(totals.intake)} kcal</strong>
            </div>
            <div className="date-rail-telemetry-item exercise">
              <span>運動消耗</span>
              <strong>−{Math.round(totals.burn)} kcal</strong>
            </div>
          </div>
        </div>
        <div className="date-rail-actions">
          <button type="button" onClick={() => changeWeek(-1)}>
            上一週
          </button>
          <button type="button" onClick={() => changeWeek(1)}>
            下一週
          </button>
          <Dialog.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
            <Dialog.Trigger className="calendar-open-button">
              開啟完整月曆
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="calendar-dialog-backdrop sao-dialog-backdrop" />
              <Dialog.Viewport className="calendar-dialog-viewport sao-dialog-viewport">
                <SaoDialogPopup
                  className="calendar-dialog-popup"
                  eyebrow="Date navigation"
                  size="picker"
                  title="完整月曆"
                  description="選擇日期並查看有簽到紀錄的日期"
                  descriptionHidden
                  actions={
                    <Dialog.Close
                      render={
                        <SaoActionButton
                          label="關閉"
                          mark="cancel"
                          tone="cancel"
                        />
                      }
                    />
                  }
                >
                  <div className="sao-calendar-content">
                    <DiaryCalendar
                      year={year}
                      month={month}
                      selectedDate={selectedDate}
                      diary={diary}
                      onSelect={(date) => {
                        onSelect(date)
                        setCalendarOpen(false)
                      }}
                      onMonthChange={onMonthChange}
                      embedded
                    />
                  </div>
                </SaoDialogPopup>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <div className="date-rail-days">
        {weekDates.map((date) => {
          const parsed = parseLocalDate(date)
          const checked = checkins.has(date)
          const label = `選擇 ${displayDate(date)}${checked ? '，有簽到紀錄' : ''}`
          return (
            <button
              className={[
                date === selectedDate ? 'selected' : '',
                date === today ? 'today' : '',
                checked ? 'checked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              aria-label={label}
              aria-current={date === selectedDate ? 'date' : undefined}
              key={date}
              onClick={() => onSelect(date)}
            >
              <span>週{weekdayLabels[parsed.getDay()]}</span>
              {date === today ? <DateTodayMarker /> : null}
              <LayeredCircleNode
                className="date-rail-node"
                hiddenFromAssistiveTechnology
                size="small"
                tone={
                  date === selectedDate
                    ? 'active'
                    : checked
                      ? 'complete'
                      : 'neutral'
                }
              >
                {parsed.getDate()}
              </LayeredCircleNode>
            </button>
          )
        })}
      </div>
    </section>
  )
}
