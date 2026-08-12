import { Dialog } from '@base-ui/react/dialog'
import type { ComponentProps, ReactNode } from 'react'
import { SaoGlassBands } from './SaoGlassBands'

type DialogPopupProps = ComponentProps<typeof Dialog.Popup>

interface SaoDialogPopupProps extends Omit<
  DialogPopupProps,
  'children' | 'className' | 'title'
> {
  actions?: ReactNode
  children?: ReactNode
  className?: string
  description: ReactNode
  descriptionHidden?: boolean
  eyebrow?: ReactNode
  size?: 'compact' | 'form' | 'picker'
  title: ReactNode
}

export function SaoDialogPopup({
  actions,
  children,
  className,
  description,
  descriptionHidden = false,
  eyebrow,
  size = 'compact',
  title,
  ...popupProps
}: SaoDialogPopupProps) {
  const classes = ['sao-glass-popup', className].filter(Boolean).join(' ')

  return (
    <Dialog.Popup {...popupProps} className={classes} data-size={size}>
      <SaoGlassBands
        actions={actions}
        description={<Dialog.Description>{description}</Dialog.Description>}
        descriptionHidden={descriptionHidden}
        eyebrow={eyebrow}
        heading={<Dialog.Title>{title}</Dialog.Title>}
      >
        {children}
      </SaoGlassBands>
    </Dialog.Popup>
  )
}
