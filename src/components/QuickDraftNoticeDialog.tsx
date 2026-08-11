import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'

interface QuickDraftNoticeDialogProps {
  planName: string
  onKeepDraft: () => void
  onCreatePlan: () => void
}

export function QuickDraftNoticeDialog({
  planName,
  onKeepDraft,
  onCreatePlan,
}: QuickDraftNoticeDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onKeepDraft()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="confirm-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport">
          <Dialog.Popup
            className="confirm-dialog-popup plan-dialog-popup"
            initialFocus={keepRef}
          >
            <Dialog.Title className="confirm-dialog-title">
              快速試算已更新
            </Dialog.Title>
            <Dialog.Description className="confirm-dialog-description">
              這次變更只會保存在 Quick，不會影響正式計畫「{planName}」。
            </Dialog.Description>
            <div className="confirm-dialog-actions">
              <Dialog.Close ref={keepRef} className="ghost-btn" type="button">
                只保留試算
              </Dialog.Close>
              <button
                className="secondary-btn"
                type="button"
                onClick={onCreatePlan}
              >
                建立新正式計畫
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
