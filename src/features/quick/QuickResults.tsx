import { StatsGrid } from '../../components/StatsGrid'
import { TdeeBoard } from '../../components/TdeeBoard'
import {
  calculateBmr,
  calculateTdee,
  plannedDeficit,
} from '../../domain/calculations'
import { addDays, durationText, formatDisplayDate } from '../../domain/date'
import type {
  Profile,
  SimulationResult,
  WeightMeasurement,
} from '../../domain/types'
import { ProjectionPanel } from '../projection/ProjectionPanel'
import { QuickRouteSummary } from './QuickRouteSummary'

interface QuickResultsProps {
  profile: Profile
  simulation: SimulationResult
  startDate: Date
  measurements: WeightMeasurement[]
}

export function QuickResults({
  profile,
  simulation,
  startDate,
  measurements,
}: QuickResultsProps) {
  const anchoredProfile = { ...profile, weight: simulation.daily[0]! }
  const bmr = calculateBmr(
    anchoredProfile.weight,
    anchoredProfile.height,
    anchoredProfile.age,
    anchoredProfile.sex,
  )
  const tdee = calculateTdee(anchoredProfile)
  const deficit = plannedDeficit(anchoredProfile, tdee, anchoredProfile.mode)
  const endDate = addDays(startDate, simulation.days)

  return (
    <div className="results" data-tour-anchor="quick-results">
      <QuickRouteSummary
        profile={anchoredProfile}
        simulation={simulation}
        tdee={tdee}
        deficit={deficit}
        endDate={endDate}
      />
      <ProjectionPanel
        profile={anchoredProfile}
        simulation={simulation}
        startDate={startDate}
        measurements={measurements}
        contentTabs={[
          {
            label: '預估減重路程',
            eyebrow: 'Your route',
            title: simulation.reached ? '預估減重路程' : '目前設定無法達標',
            content: (
              <StatsGrid
                items={[
                  { label: 'BMR', value: `${Math.round(bmr)} kcal` },
                  { label: '目前 TDEE', value: `${Math.round(tdee)} kcal` },
                  {
                    label: '起始每日赤字',
                    value: `${Math.round(deficit)} kcal`,
                  },
                  {
                    label: simulation.reached ? '預估需時' : '模擬至停滯',
                    value: durationText(simulation.days),
                    subtext: simulation.reached
                      ? `約 ${formatDisplayDate(endDate)} 達標`
                      : `停在 ${simulation.finalWeight.toFixed(2)} kg`,
                  },
                ]}
              />
            ),
          },
          {
            label: 'TDEE 看板',
            eyebrow: 'All activity levels',
            title: '各活動量 TDEE 看板',
            content: <TdeeBoard bmr={bmr} />,
          },
        ]}
      />
    </div>
  )
}
