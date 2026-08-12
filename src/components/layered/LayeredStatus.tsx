import { LayeredStatusNode } from './LayeredStatusNode'

interface LayeredStatusProps {
  className?: string
  label: string
  value: number
  max: number
  detail: string
  floating?: boolean
}

export function LayeredStatus({
  className,
  label,
  value,
  max,
  detail,
  floating = false,
}: LayeredStatusProps) {
  const safeMax = Math.max(1, max)
  const safeValue = Math.min(Math.max(0, value), safeMax)
  const classes = [
    'layered-status',
    floating && 'floating-route-hud',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside
      className={classes}
      aria-label={label}
      data-complete={safeValue === safeMax}
    >
      <LayeredStatusNode
        className="layered-status-mark"
        state={safeValue === safeMax ? 'complete' : 'neutral'}
      />
      <span className="layered-status-main">
        <span>
          <strong>{label}</strong>
          <small>
            {safeValue} / {safeMax}
          </small>
        </span>
        <progress aria-label={label} max={safeMax} value={safeValue} />
      </span>
      <strong className="layered-status-detail">{detail}</strong>
    </aside>
  )
}
