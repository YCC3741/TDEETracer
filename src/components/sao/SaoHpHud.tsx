import { intakeStage } from '../../domain/calculations'
import type { RouteGauge } from '../../domain/types'
import { SaoHpRail } from './SaoHpRail'

interface SaoHpHudProps {
  intake: RouteGauge
  activity: RouteGauge
  dateLabel: string
}

function kcal(value: number): string {
  return String(Math.round(value))
}

function windowLabel(gauge: RouteGauge): string {
  return `${kcal(gauge.value)} / ${kcal(gauge.max)} kcal`
}

export function SaoHpHud({ intake, activity, dateLabel }: SaoHpHudProps) {
  const overIntake = intake.value < 0
  const intakeSummary = overIntake
    ? `飲食已超出今日額度 ${kcal(-intake.value)} 大卡，上限 ${kcal(intake.max)} 大卡`
    : `飲食剩餘 ${kcal(intake.value)} 大卡，上限 ${kcal(intake.max)} 大卡`

  return (
    <div className="sao-hp-hud" role="group" aria-label="今日熱量狀態">
      <SaoHpRail
        label="飲食"
        gauge={intake}
        stage={intakeStage(intake.ratio)}
        summary={intakeSummary}
        headWindow={windowLabel(intake)}
        tailWindow={dateLabel}
        depleted={overIntake}
      />
      <SaoHpRail
        label="運動"
        gauge={activity}
        stage="safe"
        summary={`運動消耗 ${kcal(activity.value)} 大卡，活動量目標 ${kcal(activity.max)} 大卡`}
        headWindow={windowLabel(activity)}
      />
    </div>
  )
}
