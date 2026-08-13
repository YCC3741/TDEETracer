import { durationText, formatDisplayDate } from '../../domain/date'
import type { Profile, SimulationResult } from '../../domain/types'
import { LayeredCircleNode } from '../../components/layered/LayeredCircleNode'
import { LayeredStatusNode } from '../../components/layered/LayeredStatusNode'

interface QuickRouteSummaryProps {
  profile: Profile
  simulation: SimulationResult
  tdee: number
  deficit: number
  endDate: Date
}

const numberFormatter = new Intl.NumberFormat('zh-TW', {
  maximumFractionDigits: 0,
})

export function QuickRouteSummary({
  profile,
  simulation,
  tdee,
  deficit,
  endDate,
}: QuickRouteSummaryProps) {
  const primaryLabel =
    profile.mode === 'intake' ? '每日建議攝取' : '每日固定赤字'
  const primaryValue =
    profile.mode === 'intake' ? (profile.intake ?? 0) : deficit
  const routeStatus = simulation.reached
    ? `約 ${durationText(simulation.days)}，預估 ${formatDisplayDate(endDate)} 到達目標`
    : simulation.plateaued
      ? `目前設定可能在 ${simulation.finalWeight.toFixed(1)} kg 附近停滯`
      : `模擬上限內尚未到達目標，最終約 ${simulation.finalWeight.toFixed(1)} kg`

  return (
    <section
      className="quick-result-summary layered-panel-shell"
      aria-label="Quick 主要結果"
    >
      <header>
        <h2>{simulation.reached ? '你的預估路徑' : '目前路徑需要調整'}</h2>
      </header>

      <div className="quick-primary-result">
        <span>{primaryLabel}</span>
        <strong>{numberFormatter.format(Math.round(primaryValue))} kcal</strong>
        <small>
          起始 TDEE 約 {numberFormatter.format(Math.round(tdee))} kcal／天
        </small>
      </div>

      <div className="quick-route-eta">
        <span>{simulation.reached ? '預估抵達' : '路徑狀態'}</span>
        <strong>{routeStatus}</strong>
      </div>

      <div className="quick-route-track" aria-hidden="true">
        <span className="route-line" />
        <span className="route-start">
          <LayeredCircleNode
            className="quick-route-start-node"
            hiddenFromAssistiveTechnology
            size="small"
          >
            <span />
          </LayeredCircleNode>
          <b>{profile.weight} kg</b>
        </span>
        <span className="route-goal">
          <LayeredStatusNode
            className="quick-route-goal-node"
            state="complete"
          />
          <b>{profile.target} kg</b>
        </span>
      </div>
    </section>
  )
}
