import { StatsGrid } from '../../components/StatsGrid'
import {
  actualDeficit,
  calculateTdee,
  isProfileReady,
  plannedDeficit,
} from '../../domain/calculations'
import {
  addDays,
  durationText,
  formatDisplayDate,
  todayString,
} from '../../domain/date'
import {
  buildActualsByDate,
  buildWeightMeasurements,
  resolveForecastAnchor,
  simulateWeightPath,
} from '../../domain/projection'
import type { DiaryDay, Profile } from '../../domain/types'
import { ProjectionPanel } from '../projection/ProjectionPanel'

interface DiaryProjectionProps {
  profile: Profile | null
  diary: DiaryDay[]
  startDate: Date
}

export function DiaryProjection({
  profile,
  diary,
  startDate,
}: DiaryProjectionProps) {
  if (!isProfileReady(profile)) {
    return (
      <section className="card empty-projection">
        <span className="route-section-label">追蹤預測</span>
        <h2>尚未建立體重計畫</h2>
        <p>請先切換至「快速計算」，儲存個人資料與熱量策略。</p>
      </section>
    )
  }

  const actuals = buildActualsByDate(diary)
  const anchor = resolveForecastAnchor(profile, diary, startDate)
  const anchoredProfile = { ...profile, weight: anchor.weight }
  const measurements = buildWeightMeasurements(diary).filter(
    (measurement) => measurement.date <= todayString(startDate),
  )
  const simulation = simulateWeightPath(profile, {
    startDate: anchor.date,
    startWeight: anchor.weight,
    actuals,
    planMode: profile.mode,
  })
  const tdee = calculateTdee(anchoredProfile)
  const todayActual = actuals[todayString(startDate)]
  const deficit = todayActual
    ? actualDeficit(tdee, todayActual.intake, todayActual.burn)
    : plannedDeficit(profile, tdee, profile.mode)

  return (
    <div className="detail-projection">
      <ProjectionPanel
        profile={anchoredProfile}
        simulation={simulation}
        startDate={anchor.date}
        measurements={measurements}
        showSource
        title="體重下降曲線"
        contentTabs={[
          {
            label: '詳細預測',
            eyebrow: '路徑更新',
            title: '依明細動態更新',
            content: (
              <StatsGrid
                items={[
                  { label: '目前 TDEE', value: `${Math.round(tdee)} kcal` },
                  {
                    label: todayActual
                      ? '今日缺口（實際）'
                      : '今日缺口（計畫）',
                    value: `${Math.round(deficit)} kcal`,
                  },
                  {
                    label: '有明細的天數',
                    value: `${Object.keys(actuals).length} 天`,
                  },
                  simulation.reached
                    ? {
                        label: `瘦到 ${profile.target} kg 需要`,
                        value: durationText(simulation.days),
                        subtext: `預計 ${formatDisplayDate(addDays(anchor.date, simulation.days))} 達標`,
                      }
                    : {
                        label: '達標時間',
                        value: '—',
                        subtext: simulation.plateaued
                          ? '熱量打平，無法達標'
                          : '超過模擬上限',
                      },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
