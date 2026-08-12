import { Popover } from '@base-ui/react/popover'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { currentTimeString } from '../domain/date'
import { SaoActionButton } from './sao/SaoActionButton'
import { SaoGlassBands } from './sao/SaoGlassBands'

interface TimePickerProps {
  label: string
  value: string
  onValueChange: (value: string) => void
}

interface TimeColumnProps {
  label: string
  unit: string
  values: string[]
  selected: string
  selectedRef?: RefObject<HTMLButtonElement | null>
  onSelect: (value: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
)
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
)

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function parseTime(value: string): { hour: string; minute: string } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return { hour: match[1]!, minute: match[2]! }
}

function TimeColumn({
  label,
  unit,
  values,
  selected,
  selectedRef,
  onSelect,
}: TimeColumnProps) {
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())

  const selectByIndex = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowUp')
      nextIndex = (index - 1 + values.length) % values.length
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % values.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = values.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextValue = values[nextIndex]!
    onSelect(nextValue)
    optionRefs.current.get(nextValue)?.focus()
  }

  return (
    <div className="time-column">
      <strong>{label}</strong>
      <div className="time-options" role="listbox" aria-label={label}>
        {values.map((option, index) => (
          <button
            ref={(node) => {
              if (node) optionRefs.current.set(option, node)
              else optionRefs.current.delete(option)
              if (selectedRef && option === selected) selectedRef.current = node
            }}
            className={option === selected ? 'selected' : ''}
            type="button"
            role="option"
            key={option}
            tabIndex={option === selected ? 0 : -1}
            aria-label={`${option} ${unit}`}
            aria-selected={option === selected}
            onClick={() => onSelect(option)}
            onKeyDown={(event) => selectByIndex(event, index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TimePicker({ label, value, onValueChange }: TimePickerProps) {
  const labelId = useId()
  const valueId = useId()
  const [open, setOpen] = useState(false)
  const initialTime = parseTime(value) ?? parseTime(currentTimeString())!
  const [hour, setHour] = useState(initialTime.hour)
  const [minute, setMinute] = useState(initialTime.minute)
  const selectedHourRef = useRef<HTMLButtonElement>(null)
  const selectedMinuteRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    selectedHourRef.current?.scrollIntoView({ block: 'center' })
    selectedMinuteRef.current?.scrollIntoView({ block: 'center' })
  }, [hour, minute, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const nextTime = parseTime(value) ?? parseTime(currentTimeString())!
      setHour(nextTime.hour)
      setMinute(nextTime.minute)
    }
    setOpen(nextOpen)
  }

  const applyTime = () => {
    onValueChange(`${hour}:${minute}`)
    setOpen(false)
  }

  const selectCurrentTime = () => {
    const now = parseTime(currentTimeString())!
    setHour(now.hour)
    setMinute(now.minute)
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
          <span id={valueId}>{value || '--:--'}</span>
          <ClockIcon />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            className="picker-positioner"
            align="start"
            sideOffset={7}
            collisionPadding={10}
          >
            <Popover.Popup
              className="picker-popup time-picker-popup sao-glass-popover"
              initialFocus={selectedHourRef}
            >
              <SaoGlassBands
                eyebrow="Time picker"
                heading={<Popover.Title>選擇時間</Popover.Title>}
                actions={
                  <>
                    <SaoActionButton
                      label="套用"
                      tone="primary"
                      onClick={applyTime}
                    />
                    <SaoActionButton
                      label="現在"
                      mark="target"
                      tone="neutral"
                      onClick={selectCurrentTime}
                    />
                    <SaoActionButton
                      label="清除"
                      mark="cancel"
                      tone="cancel"
                      onClick={() => {
                        onValueChange('')
                        setOpen(false)
                      }}
                    />
                  </>
                }
              >
                <div className="time-columns">
                  <TimeColumn
                    label="小時"
                    unit="時"
                    values={HOURS}
                    selected={hour}
                    selectedRef={selectedHourRef}
                    onSelect={setHour}
                  />
                  <TimeColumn
                    label="分鐘"
                    unit="分"
                    values={MINUTES}
                    selected={minute}
                    selectedRef={selectedMinuteRef}
                    onSelect={setMinute}
                  />
                </div>
              </SaoGlassBands>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
