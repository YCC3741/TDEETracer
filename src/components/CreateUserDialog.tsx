import { Dialog } from '@base-ui/react/dialog'
import { useId, useRef, useState, type FormEvent, type RefObject } from 'react'
import { SaoActionButton } from './sao/SaoActionButton'
import { SaoDialogPopup } from './sao/SaoDialogPopup'

interface CreateUserDialogProps {
  finalFocus: RefObject<HTMLElement | null>
  onCancel: () => void
  onCreate: (name: string) => boolean
}

export function CreateUserDialog({
  finalFocus,
  onCancel,
  onCreate,
}: CreateUserDialogProps) {
  const [name, setName] = useState('')
  const formId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName || !onCreate(cleanName)) return
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="confirm-dialog-backdrop sao-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport sao-dialog-viewport">
          <SaoDialogPopup
            className="confirm-dialog-popup plan-dialog-popup"
            eyebrow="Workspace"
            initialFocus={inputRef}
            finalFocus={finalFocus}
            size="form"
            title="新增使用者"
            description="使用者只用於區分這台裝置上的草稿、計畫、日記與成就。"
            actions={
              <>
                <SaoActionButton
                  disabled={!name.trim()}
                  form={formId}
                  label="建立使用者"
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
            <form id={formId} className="plan-dialog-form" onSubmit={submit}>
              <label>
                使用者名稱
                <input
                  ref={inputRef}
                  required
                  maxLength={50}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="輸入使用者名稱"
                />
              </label>
            </form>
          </SaoDialogPopup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
