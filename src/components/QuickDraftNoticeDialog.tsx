import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'
import { SaoActionButton } from './sao/SaoActionButton'
import { SaoDialogPopup } from './sao/SaoDialogPopup'

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
        <Dialog.Backdrop className="confirm-dialog-backdrop sao-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport sao-dialog-viewport">
          <SaoDialogPopup
            className="confirm-dialog-popup plan-dialog-popup"
            eyebrow="Quick calculation"
            initialFocus={keepRef}
            title="快速試算已更新"
            description={`這次變更只會保存在 Quick，不會影響正式計畫「${planName}」。`}
            actions={
              <>
                <SaoActionButton
                  label="建立新正式計畫"
                  tone="primary"
                  onClick={onCreatePlan}
                />
                <Dialog.Close
                  ref={keepRef}
                  render={
                    <SaoActionButton
                      label="只保留試算"
                      mark="cancel"
                      tone="cancel"
                    />
                  }
                />
              </>
            }
          />
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
