import { Dialog } from '@base-ui/react/dialog'
import type { RefObject } from 'react'
import type { DiaryEntry } from '../../domain/types'
import { ExerciseForm, FoodForm, WeightForm } from './EntryForms'

export type EditRecordTarget =
  { kind: 'entry'; entry: DiaryEntry } | { kind: 'weight'; weight: number }

interface EditRecordDialogProps {
  target: EditRecordTarget | null
  exerciseWeight: number | null
  finalFocus: RefObject<HTMLElement | null>
  onUpdateEntry: (entry: DiaryEntry) => boolean
  onSetWeight: (weight: number) => boolean
  onError: (message: string) => void
  onClose: () => void
}

export function EditRecordDialog({
  target,
  exerciseWeight,
  finalFocus,
  onUpdateEntry,
  onSetWeight,
  onError,
  onClose,
}: EditRecordDialogProps) {
  const title =
    target?.kind === 'weight'
      ? '編輯體重紀錄'
      : target?.entry.type === 'exercise'
        ? '編輯運動紀錄'
        : '編輯飲食紀錄'

  const saveEntry = (entry: DiaryEntry): boolean => {
    if (!onUpdateEntry(entry)) return false
    onClose()
    return true
  }

  const saveWeight = (weight: number): boolean => {
    if (!onSetWeight(weight)) return false
    onClose()
    return true
  }

  return (
    <Dialog.Root
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="edit-record-backdrop" />
        <Dialog.Viewport className="edit-record-viewport">
          <Dialog.Popup className="edit-record-popup" finalFocus={finalFocus}>
            <header className="edit-record-head">
              <div>
                <span className="eyebrow">Edit record</span>
                <Dialog.Title>{title}</Dialog.Title>
              </div>
              <Dialog.Close aria-label="關閉編輯視窗">×</Dialog.Close>
            </header>
            <Dialog.Description className="edit-record-description">
              修改後會立即更新當日合計與體重預測
            </Dialog.Description>
            <div className="edit-record-form">
              {target?.kind === 'weight' ? (
                <WeightForm
                  initialWeight={target.weight}
                  submitLabel="儲存體重修改"
                  onSubmit={saveWeight}
                  onError={onError}
                />
              ) : target?.entry.type === 'food' ? (
                <FoodForm
                  initialEntry={target.entry}
                  submitLabel="儲存飲食修改"
                  onSubmit={saveEntry}
                  onError={onError}
                />
              ) : target?.entry.type === 'exercise' ? (
                <ExerciseForm
                  weight={exerciseWeight}
                  initialEntry={target.entry}
                  submitLabel="儲存運動修改"
                  onSubmit={saveEntry}
                  onError={onError}
                />
              ) : null}
            </div>
            <Dialog.Close className="ghost-btn edit-record-cancel">
              取消
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
