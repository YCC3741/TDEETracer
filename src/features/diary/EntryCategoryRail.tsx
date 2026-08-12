import { LayeredCircleNode } from '../../components/layered/LayeredCircleNode'
import type { CSSProperties } from 'react'

export type EntryCategory = 'food' | 'exercise' | 'weight' | 'achievement'
export type DiaryEditorDestination = EntryCategory | 'entries'

interface EntryCategoryRailProps {
  activeDestination: DiaryEditorDestination
  entryCount: number
  expanded: boolean
  onSelect: (destination: DiaryEditorDestination) => void
}

const destinations: Array<{
  id: DiaryEditorDestination
  label: string
  accessibleLabel?: string
}> = [
  { id: 'food', label: '飲食', accessibleLabel: '新增飲食' },
  { id: 'exercise', label: '運動', accessibleLabel: '新增運動' },
  { id: 'weight', label: '體重', accessibleLabel: '記錄體重' },
  { id: 'entries', label: '紀錄' },
  { id: 'achievement', label: '成就', accessibleLabel: '查看成就' },
]

export function EntryCategoryRail({
  activeDestination,
  entryCount,
  expanded,
  onSelect,
}: EntryCategoryRailProps) {
  return (
    <div
      className="segmented entry-tabs layered-category-rail"
      aria-label="日記編輯內容"
      data-tour-anchor="diary-destination-rail"
      data-expanded={expanded}
    >
      {destinations.map((destination, index) => {
        const active = expanded && activeDestination === destination.id
        const style = {
          '--rail-index': index,
          '--rail-collapsed-left': `${index * 25}%`,
          '--rail-collapsed-shift': `${index * 18}px`,
          '--rail-collapse-delay': `${(destinations.length - 1 - index) * 15}ms`,
          '--rail-expand-delay': `${index * 20}ms`,
        } as CSSProperties

        return (
          <button
            className={active ? 'active' : ''}
            type="button"
            data-tour-anchor={
              destination.id === 'exercise'
                ? 'exercise-tab'
                : destination.id === 'weight'
                  ? 'weight-tab'
                  : destination.id === 'entries'
                    ? 'entries-tab'
                    : destination.id === 'achievement'
                      ? 'achievement-tab'
                      : undefined
            }
            aria-label={
              destination.id === 'entries'
                ? `查看當日紀錄，共 ${entryCount} 筆`
                : destination.accessibleLabel
            }
            aria-pressed={active}
            key={destination.id}
            style={style}
            onClick={() => onSelect(destination.id)}
          >
            <LayeredCircleNode
              className="entry-category-node"
              hiddenFromAssistiveTechnology
              size="large"
              tone={active ? 'active' : 'neutral'}
            >
              <EntryCategoryIcon destination={destination.id} />
              <span>{destination.label}</span>
            </LayeredCircleNode>
          </button>
        )
      })}
    </div>
  )
}

function EntryCategoryIcon({
  destination,
}: {
  destination: DiaryEditorDestination
}) {
  if (destination === 'food') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 3v8m-3-8v5a3 3 0 0 0 6 0V3m-3 8v10M16 3v18m0-18c3 2 4 5 4 8h-4" />
      </svg>
    )
  }
  if (destination === 'exercise') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 9v6m3-8v10m12-10v10m3-8v6M6 12h12" />
      </svg>
    )
  }
  if (destination === 'weight') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 20h14l-1-13H6L5 20Zm4-9a3 3 0 0 1 6 0m-3 0 2-2" />
      </svg>
    )
  }
  if (destination === 'entries') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 5h12M6 9h12M6 13h12M6 17h8" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" />
    </svg>
  )
}
