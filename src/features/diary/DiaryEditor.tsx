import { useState, type ReactNode } from 'react'
import { LayeredBranchBar } from '../../components/layered/LayeredBranchBar'
import type { DiaryDay, DiaryEntry } from '../../domain/types'
import { useTour } from '../tour/TourContext'
import { DayEntries } from './DayEntries'
import {
  EntryCategoryRail,
  type DiaryEditorDestination,
  type EntryCategory,
} from './EntryCategoryRail'
import { EntryForms } from './EntryForms'

type EditorView = 'add' | 'entries'
type DirectEntryCategory = Exclude<EntryCategory, 'achievement'>

const directEntryCopy: Record<
  DirectEntryCategory,
  { eyebrow: string; title: string }
> = {
  food: { eyebrow: 'Food / Intake', title: '新增飲食' },
  exercise: { eyebrow: 'Exercise / Activity', title: '新增運動' },
  weight: { eyebrow: 'Weight / Measurement', title: '記錄體重' },
}

interface DiaryEditorProps {
  achievementPanel: ReactNode
  selectedDate: string
  day: DiaryDay | null
  weight: number | null
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
  achievementPanel,
  selectedDate,
  day,
  weight,
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
  const tour = useTour()
  const [view, setView] = useState<EditorView>(readOnly ? 'entries' : 'add')
  const [railExpanded, setRailExpanded] = useState(false)
  const [entryCategoryState, setEntryCategoryState] = useState<{
    date: string
    value: EntryCategory
  }>({ date: selectedDate, value: 'food' })
  const entryCategory =
    entryCategoryState.date === selectedDate ? entryCategoryState.value : 'food'
  const activeEntryCategory = resolveGuidedCategory(
    tour.step?.id,
    entryCategory,
  )
  const tourForcesRailExpanded =
    tour.step?.id === 'food-form' ||
    tour.step?.id === 'exercise-form' ||
    tour.step?.id === 'weight-form' ||
    tour.step?.id === 'records-tab' ||
    tour.step?.id === 'records-panel' ||
    tour.step?.id === 'achievement-tab' ||
    tour.step?.id === 'achievement-panel'
  const displayedRailExpanded =
    tour.step?.id === 'diary-editor'
      ? false
      : railExpanded || tourForcesRailExpanded

  const selectEntryCategory = (value: EntryCategory) => {
    setView('add')
    setEntryCategoryState({ date: selectedDate, value })
    if (value === 'food' && tour.step?.id === 'diary-editor') {
      tour.goTo('food-form')
    }
    if (value === 'achievement' && tour.step?.id === 'achievement-tab') {
      tour.goTo('achievement-panel')
    }
    if (value === 'exercise' && tour.step?.id === 'exercise-tab') {
      tour.goTo('exercise-form')
    }
    if (value === 'weight' && tour.step?.id === 'weight-tab') {
      tour.goTo('weight-form')
    }
  }
  const entryCount =
    (day?.entries.length ?? 0) + (day?.actualWeightKg === null || !day ? 0 : 1)
  const activeDestination: DiaryEditorDestination =
    view === 'entries' ? 'entries' : activeEntryCategory
  const directEntryCategory: DirectEntryCategory | null =
    view === 'add' &&
    !readOnly &&
    displayedRailExpanded &&
    isDirectEntryCategory(activeEntryCategory)
      ? activeEntryCategory
      : null
  const directEntry = directEntryCategory !== null
  const selectDestination = (destination: DiaryEditorDestination) => {
    if (destination === 'entries' && tour.step?.id === 'records-tab') {
      setRailExpanded(true)
      setView('entries')
      tour.goTo('records-panel')
      return
    }
    if (destination === 'achievement' && tour.step?.id === 'achievement-tab') {
      setRailExpanded(true)
      selectEntryCategory('achievement')
      return
    }
    if (displayedRailExpanded && destination === activeDestination) {
      setRailExpanded(false)
      return
    }
    setRailExpanded(true)
    if (destination === 'entries') {
      setView('entries')
      return
    }
    selectEntryCategory(destination)
  }
  const heading =
    directEntryCategory !== null
      ? {
          label: directEntryCopy[directEntryCategory].eyebrow,
          title: directEntryCopy[directEntryCategory].title,
        }
      : view === 'add'
        ? activeEntryCategory === 'achievement'
          ? { label: 'Achievements / Journey', title: '旅程成就' }
          : { label: '每日紀錄', title: '新增今日紀錄' }
        : { label: 'Records / Daily Log', title: '當日紀錄' }
  const compactHeading =
    directEntry || view === 'entries' || activeEntryCategory === 'achievement'
  const editorOpen = readOnly || displayedRailExpanded

  return (
    <div
      className="diary-editor-layout"
      data-entry-layout={directEntry ? 'direct' : 'standard'}
      data-rail-expanded={displayedRailExpanded && !readOnly}
      data-read-only={readOnly || undefined}
    >
      {!readOnly ? (
        <EntryCategoryRail
          activeDestination={activeDestination}
          entryCount={entryCount}
          expanded={displayedRailExpanded}
          onSelect={selectDestination}
        />
      ) : null}

      {directEntryCategory ? (
        <LayeredBranchBar
          className={`entry-active-ribbon diary-entry-route-ribbon ${directEntryCategory}`}
          connector="left"
          hiddenFromAssistiveTechnology
          key={`diary-entry-ribbon-${directEntryCategory}`}
        >
          <span>{directEntryCopy[directEntryCategory].title}</span>
          <small>{directEntryCategory.toUpperCase()}</small>
        </LayeredBranchBar>
      ) : null}

      <div
        className="diary-editor-stage"
        data-editor-destination={activeDestination}
        data-open={editorOpen}
      >
        <div className="diary-editor-stage-clip">
          <section
            className="card diary-editor layered-window layered-panel-shell"
            data-animated-panel={(editorOpen && !readOnly) || undefined}
            data-direct-entry={directEntry || undefined}
            data-editor-destination={activeDestination}
            data-read-only={readOnly || undefined}
            data-tour-anchor={
              activeDestination === 'entries'
                ? 'records-panel'
                : activeDestination === 'achievement'
                  ? 'achievement-panel'
                  : undefined
            }
            aria-hidden={!editorOpen || undefined}
            inert={!editorOpen || undefined}
            key={
              editorOpen && !readOnly
                ? `diary-editor-open-${activeDestination}`
                : 'diary-editor-standard'
            }
          >
            <header
              className="section-head"
              data-compact={compactHeading || undefined}
            >
              <div>
                <span className="route-section-label">{heading.label}</span>
                <h2>{heading.title}</h2>
              </div>
            </header>

            <div className="diary-editor-body" key={activeDestination}>
              {view === 'add' && !readOnly ? (
                <div
                  className={`editor-add-panel${
                    activeEntryCategory === 'achievement'
                      ? ' achievement-mode'
                      : ''
                  }`}
                >
                  <EntryForms
                    key={selectedDate}
                    activeCategory={activeEntryCategory}
                    achievementPanel={achievementPanel}
                    weight={weight}
                    actualWeightKg={day?.actualWeightKg ?? null}
                    showRibbon={
                      !directEntry && activeEntryCategory !== 'achievement'
                    }
                    onAdd={onAdd}
                    onSetWeight={onSetWeight}
                    onError={onError}
                  />
                </div>
              ) : (
                <div className="editor-entries-panel">
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
                  {readOnly ? (
                    <div className="read-only-achievements">
                      {achievementPanel}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function isDirectEntryCategory(
  value: EntryCategory,
): value is DirectEntryCategory {
  return value === 'food' || value === 'exercise' || value === 'weight'
}

function resolveGuidedCategory(
  stepId: string | undefined,
  fallback: EntryCategory,
): EntryCategory {
  if (stepId === 'food-form' || stepId === 'exercise-tab') return 'food'
  if (stepId === 'exercise-form' || stepId === 'weight-tab') return 'exercise'
  if (stepId === 'weight-form') return 'weight'
  return fallback
}
