import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'

interface TourWelcomeDialogProps {
  open: boolean
  onStart: () => void
  onSkip: () => void
}

export function TourWelcomeDialog({
  open,
  onStart,
  onSkip,
}: TourWelcomeDialogProps) {
  const startRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onSkip()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="tour-welcome-backdrop" />
        <Dialog.Viewport className="tour-welcome-viewport">
          <Dialog.Popup className="tour-welcome-popup" initialFocus={startRef}>
            <span className="eyebrow">Guided tour</span>
            <Dialog.Title>第一次使用嗎</Dialog.Title>
            <Dialog.Description className="tour-welcome-a11y-description">
              開始逐步操作導引
            </Dialog.Description>
            <div className="tour-welcome-actions">
              <Dialog.Close className="ghost-btn" type="button">
                暫時略過
              </Dialog.Close>
              <button
                ref={startRef}
                className="secondary-btn"
                type="button"
                onClick={onStart}
              >
                開始新手教學
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
