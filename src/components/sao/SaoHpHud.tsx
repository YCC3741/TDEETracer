import { intakeStage, proteinStage } from '../../domain/calculations'
import type { RouteGauge } from '../../domain/types'
import { SaoHpRail } from './SaoHpRail'

interface SaoHpHudProps {
  intake: RouteGauge
  protein: RouteGauge
  dateLabel: string
}

function round(value: number): string {
  return String(Math.round(value))
}

function windowLabel(gauge: RouteGauge, unit: string): string {
  return `${round(gauge.value)} / ${round(gauge.max)} ${unit}`
}

export function SaoHpHud({ intake, protein, dateLabel }: SaoHpHudProps) {
  const overIntake = intake.value < 0
  const intakeSummary = overIntake
    ? `飲食已超出今日額度 ${round(-intake.value)} 大卡，上限 ${round(intake.max)} 大卡`
    : `飲食剩餘 ${round(intake.value)} 大卡，上限 ${round(intake.max)} 大卡`

  return (
    <div className="sao-hp-hud" role="group" aria-label="今日熱量狀態">
      <SaoHpRail
        label="飲食"
        gauge={intake}
        stage={intakeStage(intake.ratio)}
        summary={intakeSummary}
        headWindow={windowLabel(intake, 'kcal')}
        tailWindow={dateLabel}
        depleted={overIntake}
      />
      <SaoHpRail
        label="蛋白"
        gauge={protein}
        stage={proteinStage(protein.ratio)}
        summary={`蛋白質 ${round(protein.value)} 公克，目標 ${round(protein.max)} 公克`}
        headWindow={windowLabel(protein, 'g')}
      />
    </div>
  )
}
