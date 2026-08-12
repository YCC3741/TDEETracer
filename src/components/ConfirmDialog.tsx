import { Dialog } from '@base-ui/react/dialog'
import { useRef, type RefObject } from 'react'
import { SaoActionButton } from './sao/SaoActionButton'
import { SaoDialogPopup } from './sao/SaoDialogPopup'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  finalFocus?: RefObject<HTMLElement | null>
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '確定',
  finalFocus,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="confirm-dialog-backdrop sao-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport sao-dialog-viewport">
          <SaoDialogPopup
            className="confirm-dialog-popup"
            eyebrow="System decision"
            initialFocus={cancelRef}
            finalFocus={finalFocus}
            title={title}
            description={description}
            actions={
              <>
                <SaoActionButton
                  label={confirmLabel}
                  tone="primary"
                  onClick={onConfirm}
                />
                <Dialog.Close
                  ref={cancelRef}
                  render={
                    <SaoActionButton label="取消" mark="cancel" tone="cancel" />
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
