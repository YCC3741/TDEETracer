import { Dialog } from '@base-ui/react/dialog'
import { useRef, type RefObject } from 'react'

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
        <Dialog.Backdrop className="confirm-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport">
          <Dialog.Popup
            className="confirm-dialog-popup"
            initialFocus={cancelRef}
            finalFocus={finalFocus}
          >
            <Dialog.Title className="confirm-dialog-title">
              {title}
            </Dialog.Title>
            <Dialog.Description className="confirm-dialog-description">
              {description}
            </Dialog.Description>
            <div className="confirm-dialog-actions">
              <Dialog.Close ref={cancelRef} className="ghost-btn">
                取消
              </Dialog.Close>
              <button className="danger-btn" type="button" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
