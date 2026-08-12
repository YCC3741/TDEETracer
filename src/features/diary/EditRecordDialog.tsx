import { Dialog } from '@base-ui/react/dialog'
import { useId, type RefObject } from 'react'
import { SaoActionButton } from '../../components/sao/SaoActionButton'
import { SaoDialogPopup } from '../../components/sao/SaoDialogPopup'
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
  const formId = useId()
  const title =
    target?.kind === 'weight'
      ? '編輯體重紀錄'
      : target?.entry.type === 'exercise'
        ? '編輯運動紀錄'
        : '編輯飲食紀錄'
  const submitLabel =
    target?.kind === 'weight'
      ? '儲存體重修改'
      : target?.entry.type === 'exercise'
        ? '儲存運動修改'
        : '儲存飲食修改'

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
        <Dialog.Backdrop className="edit-record-backdrop sao-dialog-backdrop" />
        <Dialog.Viewport className="edit-record-viewport sao-dialog-viewport">
          <SaoDialogPopup
            className="edit-record-popup"
            eyebrow="Edit record"
            finalFocus={finalFocus}
            size="form"
            title={title}
            description="修改後會立即更新當日合計與體重預測"
            actions={
              <>
                <SaoActionButton
                  form={formId}
                  label={submitLabel}
                  tone="primary"
                  type="submit"
                />
                <Dialog.Close
                  render={
                    <SaoActionButton label="取消" mark="cancel" tone="cancel" />
                  }
                />
              </>
            }
          >
            <div className="edit-record-form">
              {target?.kind === 'weight' ? (
                <WeightForm
                  formId={formId}
                  hideSubmitButton
                  initialWeight={target.weight}
                  onSubmit={saveWeight}
                  onError={onError}
                />
              ) : target?.entry.type === 'food' ? (
                <FoodForm
                  formId={formId}
                  hideSubmitButton
                  initialEntry={target.entry}
                  onSubmit={saveEntry}
                  onError={onError}
                />
              ) : target?.entry.type === 'exercise' ? (
                <ExerciseForm
                  formId={formId}
                  hideSubmitButton
                  weight={exerciseWeight}
                  initialEntry={target.entry}
                  onSubmit={saveEntry}
                  onError={onError}
                />
              ) : null}
            </div>
          </SaoDialogPopup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
