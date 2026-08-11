import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { DatePicker } from '../../components/DatePicker'
import { dayTotals } from '../../domain/calculations'
import type { DiaryDay, DiaryEntry } from '../../domain/types'
import { DayEntries } from './DayEntries'
import { EntryForms } from './EntryForms'

type EditorView = 'add' | 'entries'

interface DiaryEditorProps {
  selectedDate: string
  day: DiaryDay | null
  weight: number | null
  onDateChange: (date: string) => void
  onAdd: (entry: DiaryEntry) => boolean
  onUpdateEntry: (entry: DiaryEntry) => boolean
  onSetWeight: (weight: number) => boolean
  onRemoveEntry: (entryId: string) => void
  onRemoveWeight: () => void
  onDeleteDay: () => void
  onReturnToday: () => void
  onError: (message: string) => void
  readOnly?: boolean
}

export function DiaryEditor({
  selectedDate,
  day,
  weight,
  onDateChange,
  onAdd,
  onUpdateEntry,
  onSetWeight,
  onRemoveEntry,
  onRemoveWeight,
  onDeleteDay,
  onReturnToday,
  onError,
  readOnly = false,
}: DiaryEditorProps) {
  const [view, setView] = useState<EditorView>(readOnly ? 'entries' : 'add')
  const panelId = useId()
  const addTabRef = useRef<HTMLButtonElement>(null)
  const entriesTabRef = useRef<HTMLButtonElement>(null)
  const totals = dayTotals(day)
  const entryCount =
    (day?.entries.length ?? 0) + (day?.actualWeightKg === null || !day ? 0 : 1)
  const heading =
    view === 'add'
      ? { eyebrow: 'Add entries', title: '新增今日紀錄' }
      : { eyebrow: 'Daily records', title: '當日紀錄' }

  const activateTab = (nextView: EditorView) => {
    setView(nextView)
    const target = nextView === 'add' ? addTabRef : entriesTabRef
    target.current?.focus()
  }

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentView: EditorView,
  ) => {
    if (readOnly) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    activateTab(currentView === 'add' ? 'entries' : 'add')
  }

  return (
    <section className="card diary-editor">
      <header className="section-head">
        <div>
          <span className="eyebrow">{heading.eyebrow}</span>
          <h2>{heading.title}</h2>
        </div>
        <div
          className="panel-tabs editor-view-tabs"
          role="tablist"
          aria-label="日記編輯頁面"
        >
          {!readOnly ? (
            <button
              ref={addTabRef}
              id={`${panelId}-add-tab`}
              className={view === 'add' ? 'active' : ''}
              type="button"
              role="tab"
              tabIndex={view === 'add' ? 0 : -1}
              aria-selected={view === 'add'}
              aria-controls={`${panelId}-add-panel`}
              onClick={() => setView('add')}
              onKeyDown={(event) => handleTabKeyDown(event, 'add')}
            >
              新增紀錄
            </button>
          ) : null}
          <button
            ref={entriesTabRef}
            id={`${panelId}-entries-tab`}
            className={view === 'entries' ? 'active' : ''}
            type="button"
            role="tab"
            tabIndex={view === 'entries' ? 0 : -1}
            aria-selected={view === 'entries'}
            aria-controls={`${panelId}-entries-panel`}
            onClick={() => setView('entries')}
            onKeyDown={(event) => handleTabKeyDown(event, 'entries')}
          >
            當日紀錄 <span>{entryCount}</span>
          </button>
        </div>
      </header>

      {view === 'add' && !readOnly ? (
        <div
          className="editor-add-panel"
          id={`${panelId}-add-panel`}
          role="tabpanel"
          aria-labelledby={`${panelId}-add-tab`}
        >
          <div className="editor-add-date">
            <DatePicker
              label="日期"
              value={selectedDate}
              onValueChange={onDateChange}
            />
          </div>
          <div className="day-summary">
            <div>
              <span>飲食攝取</span>
              <strong className="food-value">
                +{Math.round(totals.intake)} kcal
              </strong>
            </div>
            <div>
              <span>運動消耗</span>
              <strong className="exercise-value">
                −{Math.round(totals.burn)} kcal
              </strong>
            </div>
          </div>
          <EntryForms
            key={selectedDate}
            weight={weight}
            actualWeightKg={day?.actualWeightKg ?? null}
            onAdd={onAdd}
            onSetWeight={onSetWeight}
            onError={onError}
          />
        </div>
      ) : (
        <div
          className="editor-entries-panel"
          id={`${panelId}-entries-panel`}
          role="tabpanel"
          aria-labelledby={`${panelId}-entries-tab`}
        >
          <DayEntries
            day={day}
            exerciseWeight={weight}
            onUpdateEntry={onUpdateEntry}
            onSetWeight={onSetWeight}
            onRemoveEntry={onRemoveEntry}
            onRemoveWeight={onRemoveWeight}
            onDeleteDay={onDeleteDay}
            onReturnToday={onReturnToday}
            onError={onError}
            readOnly={readOnly}
          />
        </div>
      )}
    </section>
  )
}
