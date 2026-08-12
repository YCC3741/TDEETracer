import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type SaoActionMark = 'confirm' | 'cancel' | 'target'
type SaoActionTone = 'primary' | 'cancel' | 'neutral'

interface SaoActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label: ReactNode
  mark?: SaoActionMark
  tone: SaoActionTone
}

export const SaoActionButton = forwardRef<
  HTMLButtonElement,
  SaoActionButtonProps
>(function SaoActionButton(
  { className, label, mark = 'confirm', tone, type = 'button', ...props },
  ref,
) {
  const classes = ['sao-action', className].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      ref={ref}
      className={classes}
      data-mark={mark}
      data-tone={tone}
      type={type}
    >
      <span className="sao-action-node" aria-hidden="true">
        <span className="sao-action-mark" />
      </span>
      <span className="sao-action-label">{label}</span>
    </button>
  )
})
