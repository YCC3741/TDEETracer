import { useRef, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { DiaryDay, DiaryEntry } from '../../domain/types'
import { EditRecordDialog, type EditRecordTarget } from './EditRecordDialog'

interface DayEntriesProps {
  day: DiaryDay | null
  exerciseWeight: number | null
  onUpdateEntry: (entry: DiaryEntry) => boolean
  onSetWeight: (weight: number) => boolean
  onRemoveEntry: (entryId: string) => void
  onRemoveWeight: () => void
  onDeleteDay: () => void
  onReturnToday: () => void
  onError: (message: string) => void
  readOnly?: boolean
}

export function DayEntries({
  day,
  exerciseWeight,
  onUpdateEntry,
  onSetWeight,
  onRemoveEntry,
  onRemoveWeight,
  onDeleteDay,
  onReturnToday,
  onError,
  readOnly = false,
}: DayEntriesProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditRecordTarget | null>(null)
  const editTriggerRef = useRef<HTMLElement>(null)
  const recordCount =
    (day?.entries.length ?? 0) + (day?.actualWeightKg !== null && day ? 1 : 0)
  const hasRecords = recordCount > 0
  const isScrollable = recordCount > 5

  const confirmDeleteDay = () => {
    setConfirmOpen(false)
    onDeleteDay()
  }

  return (
    <>
      <div
        className="entry-list"
        data-scrollable={isScrollable || undefined}
        role={isScrollable ? 'region' : undefined}
        tabIndex={isScrollable ? 0 : undefined}
        aria-label={
          isScrollable ? `當日紀錄列表，共 ${recordCount} 筆` : undefined
        }
      >
        {day?.actualWeightKg !== null && day ? (
          <article className="entry-row weight">
            {readOnly ? (
              <div className="entry-row-main">
                <div>
                  <span>體重紀錄</span>
                  <strong>實際體重</strong>
                </div>
                <b>{day.actualWeightKg.toFixed(1)} kg</b>
              </div>
            ) : (
              <button
                className="entry-row-main"
                type="button"
                aria-label={`編輯體重紀錄 ${day.actualWeightKg.toFixed(1)} kg`}
                onClick={(event) => {
                  editTriggerRef.current = event.currentTarget
                  setEditTarget({
                    kind: 'weight',
                    weight: day.actualWeightKg!,
                  })
                }}
              >
                <div>
                  <span>體重紀錄</span>
                  <strong>實際體重</strong>
                </div>
                <b>{day.actualWeightKg.toFixed(1)} kg</b>
              </button>
            )}
            {!readOnly ? (
              <button
                type="button"
                aria-label="刪除此體重紀錄"
                onClick={onRemoveWeight}
              >
                ×
              </button>
            ) : null}
          </article>
        ) : null}
        {day?.entries.map((entry) => (
          <article className={`entry-row ${entry.type}`} key={entry.id}>
            {readOnly ? (
              <div className="entry-row-main">
                <EntryRowContent entry={entry} />
              </div>
            ) : (
              <button
                className="entry-row-main"
                type="button"
                aria-label={
                  entry.type === 'food'
                    ? `編輯飲食紀錄 ${entry.time || '未填時間'}`
                    : `編輯運動紀錄 ${entry.name} ${entry.time || '未填時間'}`
                }
                onClick={(event) => {
                  editTriggerRef.current = event.currentTarget
                  setEditTarget({ kind: 'entry', entry })
                }}
              >
                <EntryRowContent entry={entry} />
              </button>
            )}
            {!readOnly ? (
              <button
                type="button"
                aria-label="刪除此明細"
                onClick={() => onRemoveEntry(entry.id)}
              >
                ×
              </button>
            ) : null}
          </article>
        ))}
        {!hasRecords ? (
          <p className="empty-state">這一天還沒有任何紀錄。</p>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="button-row">
          <button className="ghost-btn" type="button" onClick={onReturnToday}>
            回到今天
          </button>
          <button
            className="danger-btn"
            type="button"
            disabled={!hasRecords}
            onClick={() => setConfirmOpen(true)}
          >
            刪除此日全部
          </button>
        </div>
      ) : null}
      {!readOnly ? (
        <>
          <EditRecordDialog
            target={editTarget}
            exerciseWeight={exerciseWeight}
            finalFocus={editTriggerRef}
            onUpdateEntry={onUpdateEntry}
            onSetWeight={onSetWeight}
            onError={onError}
            onClose={() => setEditTarget(null)}
          />
          <ConfirmDialog
            open={confirmOpen}
            title="確定刪除？"
            description="確定刪除這一天的全部紀錄嗎？此操作無法復原。"
            confirmLabel="確定刪除"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={confirmDeleteDay}
          />
        </>
      ) : null}
    </>
  )
}

function EntryRowContent({ entry }: { entry: DiaryEntry }) {
  return (
    <>
      <div>
        <span>{entry.time || '未填時間'}</span>
        <strong>{entry.type === 'food' ? '飲食' : entry.name}</strong>
        {entry.type === 'exercise' ? (
          <small>
            {entry.minutes} 分
            {entry.met
              ? ` · ${entry.met > 20 ? `${entry.met} kcal/h` : `MET ${entry.met}`}`
              : ''}
          </small>
        ) : null}
      </div>
      <b>
        {entry.type === 'food' ? '+' : '−'}
        {Math.round(entry.kcal)} kcal
      </b>
    </>
  )
}
