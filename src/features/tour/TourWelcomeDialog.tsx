import { Dialog } from '@base-ui/react/dialog'
import { useRef } from 'react'
import { SaoActionButton } from '../../components/sao/SaoActionButton'
import { SaoDialogPopup } from '../../components/sao/SaoDialogPopup'

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
        <Dialog.Backdrop className="tour-welcome-backdrop sao-dialog-backdrop" />
        <Dialog.Viewport className="tour-welcome-viewport sao-dialog-viewport">
          <SaoDialogPopup
            className="tour-welcome-popup"
            eyebrow="操作導覽"
            initialFocus={startRef}
            title="第一次使用嗎"
            description="開始逐步操作導引，依序完成 Quick 試算、建立計畫與第一筆日記。"
            actions={
              <>
                <SaoActionButton
                  ref={startRef}
                  label="開始新手教學"
                  tone="primary"
                  onClick={onStart}
                />
                <Dialog.Close
                  render={
                    <SaoActionButton
                      label="暫時略過"
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
