import type { ReactNode } from 'react'

interface LayeredCircleNodeProps {
  children: ReactNode
  className?: string
  hiddenFromAssistiveTechnology?: boolean
  size?: 'small' | 'medium' | 'large'
  tone?: 'neutral' | 'active' | 'complete'
}

export function LayeredCircleNode({
  children,
  className,
  hiddenFromAssistiveTechnology = false,
  size = 'medium',
  tone = 'neutral',
}: LayeredCircleNodeProps) {
  const classes = ['layered-circle-node', className].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      data-size={size}
      data-tone={tone}
      aria-hidden={hiddenFromAssistiveTechnology || undefined}
    >
      <span className="layered-circle-node-body">{children}</span>
    </span>
  )
}
