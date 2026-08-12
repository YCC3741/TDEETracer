interface LayeredStatusNodeProps {
  className?: string
  state?: 'neutral' | 'active' | 'complete'
}

export function LayeredStatusNode({
  className,
  state = 'neutral',
}: LayeredStatusNodeProps) {
  const classes = ['layered-status-node', className].filter(Boolean).join(' ')

  return (
    <span className={classes} data-state={state} aria-hidden="true">
      <span className="layered-status-node-body" />
    </span>
  )
}
