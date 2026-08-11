import { Popover } from '@base-ui/react/popover'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  addDays,
  parseLocalDate,
  todayString,
  toDateString,
} from '../domain/date'

interface DatePickerProps {
  label: string
  value: string
  onValueChange: (value: string) => void
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      className={direction === 'right' ? 'right' : ''}
      viewBox="0 0 24 24"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function validDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = parseLocalDate(value)
  return Number.isNaN(date.getTime()) || toDateString(date) !== value
    ? null
    : date
}

function displayDate(value: string): string {
  return validDate(value) ? value.replaceAll('-', '/') : '請選擇'
}

export function DatePicker({ label, value, onValueChange }: DatePickerProps) {
  const labelId = useId()
  const valueId = useId()
  const [open, setOpen] = useState(false)
  const initialDate = validDate(value) ?? new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())
  const [focusedDate, setFocusedDate] = useState(() =>
    toDateString(initialDate),
  )
  const focusedDayRef = useRef<HTMLButtonElement>(null)

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  while (cells.length < 42) cells.push(null)

  useEffect(() => {
    if (open) focusedDayRef.current?.focus()
  }, [focusedDate, open, viewMonth, viewYear])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const nextDate = validDate(value) ?? new Date()
      setViewYear(nextDate.getFullYear())
      setViewMonth(nextDate.getMonth())
      setFocusedDate(toDateString(nextDate))
    }
    setOpen(nextOpen)
  }

  const changeMonth = (offset: number) => {
    const current = validDate(focusedDate) ?? new Date(viewYear, viewMonth, 1)
    const nextMonth = new Date(viewYear, viewMonth + offset, 1)
    const nextDay = Math.min(
      current.getDate(),
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate(),
    )
    const next = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      nextDay,
    )
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
    setFocusedDate(toDateString(next))
  }

  const moveFocus = (days: number) => {
    const current = validDate(focusedDate) ?? new Date()
    const next = addDays(current, days)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
    setFocusedDate(toDateString(next))
  }

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    const offset = offsets[event.key]
    if (offset === undefined) return
    event.preventDefault()
    moveFocus(offset)
  }

  const selectDate = (nextValue: string) => {
    onValueChange(nextValue)
    setOpen(false)
  }

  return (
    <div className="picker-field">
      <span className="picker-label" id={labelId}>
        {label}
      </span>
      <Popover.Root modal={false} open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          className="picker-trigger"
          aria-labelledby={`${labelId} ${valueId}`}
        >
          <span id={valueId}>{displayDate(value)}</span>
          <CalendarIcon />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            className="picker-positioner"
            align="start"
            sideOffset={7}
            collisionPadding={10}
          >
            <Popover.Popup
              className="picker-popup date-picker-popup"
              initialFocus={focusedDayRef}
            >
              <Popover.Arrow className="picker-arrow" />
              <Popover.Title className="picker-popup-title">
                選擇日期
              </Popover.Title>
              <div className="picker-calendar-head">
                <button
                  type="button"
                  aria-label="上一個月"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronIcon direction="left" />
                </button>
                <strong>
                  {viewYear} 年 {viewMonth + 1} 月
                </strong>
                <button
                  type="button"
                  aria-label="下一個月"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>
              <div
                className="picker-calendar-grid picker-weekdays"
                aria-hidden="true"
              >
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="picker-calendar-grid">
                {cells.map((day, index) => {
                  if (!day) {
                    return <span key={`empty-${index}`} aria-hidden="true" />
                  }
                  const date = toDateString(new Date(viewYear, viewMonth, day))
                  const selected = date === value
                  const today = date === todayString()
                  return (
                    <button
                      ref={date === focusedDate ? focusedDayRef : undefined}
                      className={[
                        'picker-calendar-day',
                        selected ? 'selected' : '',
                        today ? 'today' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      key={date}
                      tabIndex={date === focusedDate ? 0 : -1}
                      aria-label={date.replaceAll('-', '/')}
                      aria-pressed={selected}
                      onClick={() => selectDate(date)}
                      onFocus={() => setFocusedDate(date)}
                      onKeyDown={handleDayKeyDown}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <div className="picker-popup-actions">
                <button type="button" onClick={() => selectDate('')}>
                  清除
                </button>
                <button type="button" onClick={() => selectDate(todayString())}>
                  今天
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
