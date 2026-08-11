import type { PaceComparison } from '../domain/types'

interface PaceFloatProps {
  pace: PaceComparison | null
  hasPlan: boolean
}

function weightLabel(value: number): {
  tone: string
  text: string
} {
  if (Math.abs(value) < 0.005) {
    return { tone: 'even', text: '減重進度與計畫相同' }
  }
  return value > 0
    ? {
        tone: 'ahead',
        text: `比計畫多減 ${Math.abs(value).toFixed(2)} kg`,
      }
    : {
        tone: 'behind',
        text: `比計畫少減 ${Math.abs(value).toFixed(2)} kg`,
      }
}

function daysLabel(value: number): {
  tone: string
  text: string
} {
  if (value === 0) return { tone: 'even', text: '達標時間與計畫相同' }
  return value > 0
    ? { tone: 'ahead', text: `預估提早 ${Math.abs(value)} 天達標` }
    : { tone: 'behind', text: `預估延後 ${Math.abs(value)} 天達標` }
}

export function PaceFloat({ pace, hasPlan }: PaceFloatProps) {
  if (!hasPlan) {
    return (
      <aside className="pace-float">
        <span>目前進度</span>
        <strong>尚無計畫</strong>
        <small>請先在快速計算儲存資料</small>
      </aside>
    )
  }

  if (!pace || pace.empty) {
    return (
      <aside className="pace-float">
        <span>目前進度</span>
        <strong>等待日記紀錄</strong>
        <small>加入飲食或運動後顯示</small>
      </aside>
    )
  }

  const weight = weightLabel(pace.kg ?? 0)
  const days =
    pace.daysDelta === null || pace.daysDelta === undefined
      ? null
      : daysLabel(pace.daysDelta)

  return (
    <aside className="pace-float">
      <span>{pace.source === 'weight' ? '實際體重進度' : '相對計畫進度'}</span>
      <strong className={weight.tone}>{weight.text}</strong>
      {days ? <strong className={days.tone}>{days.text}</strong> : null}
      {pace.daysNote ? <small>{pace.daysNote}</small> : null}
    </aside>
  )
}
