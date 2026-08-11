import { Dialog } from '@base-ui/react/dialog'
import { useRef, useState, type FormEvent, type RefObject } from 'react'

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
        <Dialog.Backdrop className="confirm-dialog-backdrop" />
        <Dialog.Viewport className="confirm-dialog-viewport">
          <Dialog.Popup
            className="confirm-dialog-popup plan-dialog-popup"
            initialFocus={inputRef}
            finalFocus={finalFocus}
          >
            <Dialog.Title className="confirm-dialog-title">
              新增使用者
            </Dialog.Title>
            <Dialog.Description className="confirm-dialog-description">
              使用者只用於區分這台裝置上的草稿、計畫、日記與成就。
            </Dialog.Description>
            <form className="plan-dialog-form" onSubmit={submit}>
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
              <div className="confirm-dialog-actions">
                <Dialog.Close className="ghost-btn" type="button">
                  取消
                </Dialog.Close>
                <button
                  className="secondary-btn"
                  type="submit"
                  disabled={!name.trim()}
                >
                  建立使用者
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
