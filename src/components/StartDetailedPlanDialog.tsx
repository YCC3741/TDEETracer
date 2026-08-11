import { Dialog } from '@base-ui/react/dialog'
import { useRef, useState, type FormEvent } from 'react'
import type { Profile } from '../domain/types'

interface StartDetailedPlanDialogProps {
  open: boolean
  profile: Profile | null
  initialName?: string
  replacesPlanName?: string
  onCancel: () => void
  onStart: (name: string) => void
  onGoQuick: () => void
}

export function StartDetailedPlanDialog({
  open,
  profile,
  initialName = '',
  replacesPlanName,
  onCancel,
  onStart,
  onGoQuick,
}: StartDetailedPlanDialogProps) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!profile || !cleanName) return
    onStart(cleanName)
  }

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
            className="confirm-dialog-popup plan-dialog-popup"
            initialFocus={inputRef}
            data-tour-scope
          >
            <Dialog.Title className="confirm-dialog-title">
              開始精確計畫
            </Dialog.Title>
            <Dialog.Description
              className={`confirm-dialog-description${
                replacesPlanName ? ' plan-dialog-replacement-copy' : ''
              }`}
            >
              {replacesPlanName ? (
                <>
                  <span>{replacesPlanName}將封存為唯讀</span>
                  <span>新計畫會使用目前試算設定</span>
                  <span>日記從空白開始</span>
                </>
              ) : (
                '建立後身體資料、目標與熱量策略會固定；需要變更時請封存並建立新計畫。'
              )}
            </Dialog.Description>
            {profile ? (
              <form
                className="plan-dialog-form"
                data-tour-anchor="plan-dialog-form"
                onSubmit={submit}
              >
                <label>
                  計畫名稱
                  <input
                    ref={inputRef}
                    required
                    maxLength={50}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="例如 夏季減重計畫"
                  />
                </label>
                <div className="plan-dialog-summary">
                  <span>{profile.weight.toFixed(1)} kg</span>
                  <b>→</b>
                  <span>{profile.target.toFixed(1)} kg</span>
                  <small>
                    {profile.mode === 'intake'
                      ? `每日攝取 ${profile.intake ?? 0} kcal`
                      : `每日赤字 ${profile.deficit ?? 0} kcal`}
                  </small>
                </div>
                <div className="confirm-dialog-actions">
                  <Dialog.Close className="ghost-btn" type="button">
                    取消
                  </Dialog.Close>
                  <button
                    className="secondary-btn"
                    type="submit"
                    disabled={!name.trim()}
                  >
                    建立計畫
                  </button>
                </div>
              </form>
            ) : (
              <div className="plan-dialog-empty">
                <p>請先完成一次有效的 Quick 試算，再建立精確計畫。</p>
                <div className="confirm-dialog-actions">
                  <Dialog.Close className="ghost-btn" type="button">
                    取消
                  </Dialog.Close>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={onGoQuick}
                  >
                    前往 Quick
                  </button>
                </div>
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
