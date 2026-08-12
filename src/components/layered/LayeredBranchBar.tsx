import type { ReactNode } from 'react'

interface LayeredBranchBarProps {
  as?: 'div' | 'span'
  children: ReactNode
  className?: string
  connector?: 'left' | 'right'
  hiddenFromAssistiveTechnology?: boolean
}

export function LayeredBranchBar({
  as: Element = 'div',
  children,
  className,
  connector,
  hiddenFromAssistiveTechnology = false,
}: LayeredBranchBarProps) {
  const classes = ['layered-branch-bar', className].filter(Boolean).join(' ')

  return (
    <Element
      className={classes}
      data-connector={connector}
      aria-hidden={hiddenFromAssistiveTechnology || undefined}
    >
      {children}
    </Element>
  )
}
