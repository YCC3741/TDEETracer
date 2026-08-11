export interface StatItem {
  label: string
  value: string
  subtext?: string
}

interface StatsGridProps {
  items: StatItem[]
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <article className="stat" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.subtext ? <small>{item.subtext}</small> : null}
        </article>
      ))}
    </div>
  )
}
