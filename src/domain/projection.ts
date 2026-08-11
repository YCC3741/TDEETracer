import { KCAL_PER_KG, MAX_DAYS, PLATEAU_EPSILON } from './constants'
import {
  actualDeficit,
  calculateBmr,
  calculateTdee,
  dayTotals,
  plannedDeficit,
} from './calculations'
import {
  addDays,
  formatDisplayDate,
  parseLocalDate,
  toDateString,
  todayString,
} from './date'
import type {
  ActualsByDate,
  DiaryDay,
  PaceComparison,
  PlanMode,
  Profile,
  ProjectionRow,
  SimulationResult,
  WeightMeasurement,
} from './types'

interface SimulationOptions {
  startDate?: Date
  startWeight?: number
  actuals?: ActualsByDate
  planMode?: PlanMode
}

export function simulateWeightPath(
  profile: Profile,
  options: SimulationOptions = {},
): SimulationResult {
  const startDate = options.startDate ?? new Date()
  const actuals = options.actuals ?? {}
  const planMode = options.planMode ?? profile.mode
  let weight = options.startWeight ?? profile.weight
  const daily = [weight]
  const dayMeta: SimulationResult['dayMeta'] = []
  let plateaued = false

  for (let day = 0; day < MAX_DAYS && weight > profile.target; day += 1) {
    const date = toDateString(addDays(startDate, day))
    const age = profile.age + day / 365.25
    const tdee =
      calculateBmr(weight, profile.height, age, profile.sex) * profile.factor
    const actual = actuals[date]
    const deficit = actual
      ? actualDeficit(tdee, actual.intake, actual.burn)
      : plannedDeficit(profile, tdee, planMode)
    const source = actual ? 'actual' : 'plan'

    dayMeta.push({ tdee, deficit, source, date })

    if (!actual && deficit < PLATEAU_EPSILON) {
      plateaued = true
      break
    }

    weight = Math.max(weight - deficit / KCAL_PER_KG, profile.target)
    daily.push(weight)
  }

  return {
    daily,
    dayMeta,
    days: daily.length - 1,
    reached: !plateaued && daily[daily.length - 1]! <= profile.target + 1e-9,
    plateaued,
    finalWeight: daily[daily.length - 1]!,
  }
}

export function buildActualsByDate(diary: DiaryDay[]): ActualsByDate {
  return diary.reduce<ActualsByDate>((actuals, day) => {
    if (day.entries.length) actuals[day.date] = dayTotals(day)
    return actuals
  }, {})
}

export function buildWeightMeasurements(
  diary: DiaryDay[],
): WeightMeasurement[] {
  const byDate = new Map<string, WeightMeasurement>()
  diary.forEach((day) => {
    if (
      day.actualWeightKg !== null &&
      Number.isFinite(day.actualWeightKg) &&
      day.actualWeightKg >= 25 &&
      day.actualWeightKg <= 350
    ) {
      byDate.set(day.date, { date: day.date, weight: day.actualWeightKg })
    }
  })
  return Array.from(byDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  )
}

export function latestWeightMeasurement(
  diary: DiaryDay[],
  onOrBefore = todayString(),
): WeightMeasurement | null {
  const measurements = buildWeightMeasurements(diary).filter(
    (measurement) => measurement.date <= onOrBefore,
  )
  return measurements.at(-1) ?? null
}

export interface ForecastAnchor {
  date: Date
  dateString: string
  weight: number
  measurement: WeightMeasurement | null
}

function resolvePlanStartDate(profile: Profile, fallbackDate: Date): Date {
  const planStart = parseLocalDate(profile.planStartedAt)
  return !Number.isNaN(planStart.getTime()) &&
    profile.planStartedAt <= toDateString(fallbackDate)
    ? planStart
    : fallbackDate
}

export function resolveForecastAnchor(
  profile: Profile,
  diary: DiaryDay[],
  fallbackDate = new Date(),
): ForecastAnchor {
  const latest = latestWeightMeasurement(diary, todayString(fallbackDate))
  if (latest) {
    return {
      date: parseLocalDate(latest.date),
      dateString: latest.date,
      weight: latest.weight,
      measurement: latest,
    }
  }
  const planStart = resolvePlanStartDate(profile, fallbackDate)
  return {
    date: planStart,
    dateString: toDateString(planStart),
    weight: profile.weight,
    measurement: null,
  }
}

export function buildProjectionRows(
  simulation: SimulationResult,
  profile: Profile,
  startDate: Date,
): ProjectionRow[] {
  const rowDays = [0]
  const lastDay = simulation.daily.length - 1
  for (let month = 1; month * 30 < lastDay; month += 1) {
    rowDays.push(month * 30)
  }
  if (lastDay > 0) rowDays.push(lastDay)

  let previousWeight = simulation.daily[0]!

  return rowDays.map((day, index) => {
    const weight = simulation.daily[day]!
    const metaIndex = Math.min(day, Math.max(simulation.dayMeta.length - 1, 0))
    const meta = simulation.dayMeta[metaIndex]
    const tdee =
      meta?.tdee ?? calculateTdee(profile, weight, profile.age + day / 365.25)
    const deficit = meta?.deficit ?? plannedDeficit(profile, tdee, profile.mode)
    const lost = index === 0 ? null : previousWeight - weight
    previousWeight = weight

    let label = '開始'
    if (index > 0 && day === lastDay) {
      label = simulation.reached ? '達成目標' : '模擬結束'
    } else if (index > 0) {
      label = `第 ${Math.round(day / 30)} 個月`
    }

    return {
      label,
      date: formatDisplayDate(addDays(startDate, day)),
      weight,
      lost,
      tdee,
      deficit,
      source: meta?.source ?? null,
    }
  })
}

export function computePaceVsPlan(
  profile: Profile,
  actuals: ActualsByDate,
  startDate = new Date(),
  measurements: WeightMeasurement[] = [],
): PaceComparison {
  const eligibleMeasurements = measurements
    .filter((measurement) => measurement.date <= todayString(startDate))
    .sort((left, right) => left.date.localeCompare(right.date))
  const latestMeasurement = eligibleMeasurements.at(-1)
  if (latestMeasurement) {
    const planStart = parseLocalDate(profile.planStartedAt)
    const measuredAt = parseLocalDate(latestMeasurement.date)
    const elapsedDays = Math.round(
      (measuredAt.getTime() - planStart.getTime()) / 86_400_000,
    )
    if (elapsedDays >= 0) {
      const planSimulation = simulateWeightPath(profile, {
        startDate: planStart,
        actuals: {},
        planMode: profile.mode,
      })
      const expectedIndex = Math.min(
        elapsedDays,
        planSimulation.daily.length - 1,
      )
      const expectedWeight = planSimulation.daily[expectedIndex]!
      const updatedSimulation = simulateWeightPath(profile, {
        startDate: measuredAt,
        startWeight: latestMeasurement.weight,
        actuals: {},
        planMode: profile.mode,
      })
      let daysDelta: number | null = null
      let daysNote = ''
      if (planSimulation.reached && updatedSimulation.reached) {
        const plannedTarget = addDays(planStart, planSimulation.days)
        const updatedTarget = addDays(measuredAt, updatedSimulation.days)
        daysDelta = Math.round(
          (plannedTarget.getTime() - updatedTarget.getTime()) / 86_400_000,
        )
      } else if (!planSimulation.reached && updatedSimulation.reached) {
        daysNote = '更新後預估可達標；原計畫未能達標'
      } else if (planSimulation.reached && !updatedSimulation.reached) {
        daysNote = '原計畫可達標；更新後預估未能達標'
      } else {
        daysNote = '原計畫與更新後預估皆未能達標'
      }
      return {
        empty: false,
        source: 'weight',
        kg: expectedWeight - latestMeasurement.weight,
        daysDelta,
        daysNote,
        loggedDays: eligibleMeasurements.length,
      }
    }
  }

  const simulationStartDate = resolvePlanStartDate(profile, startDate)
  const firstDate = toDateString(simulationStartDate)
  const lastDate = todayString(startDate)
  const dates = Object.keys(actuals).filter(
    (date) => date >= firstDate && date <= lastDate,
  )
  if (!dates.length) return { empty: true }

  const baselineTdee = calculateTdee(profile)
  const plan = plannedDeficit(profile, baselineTdee, profile.mode)
  const diffKcal = dates.reduce((sum, date) => {
    const actual = actuals[date]!
    return sum + actualDeficit(baselineTdee, actual.intake, actual.burn) - plan
  }, 0)

  const planSimulation = simulateWeightPath(profile, {
    startDate: simulationStartDate,
    actuals: {},
    planMode: profile.mode,
  })
  const actualSimulation = simulateWeightPath(profile, {
    startDate: simulationStartDate,
    actuals,
    planMode: profile.mode,
  })

  let daysDelta: number | null = null
  let daysNote = ''

  if (planSimulation.reached && actualSimulation.reached) {
    daysDelta = planSimulation.days - actualSimulation.days
  } else if (!planSimulation.reached && actualSimulation.reached) {
    daysNote = '實際路徑可達標；純計畫路徑未能達標'
  } else if (planSimulation.reached && !actualSimulation.reached) {
    daysNote = '計畫可達標；目前實際路徑未能達標'
  } else {
    daysNote = '兩條路徑皆未能達標'
  }

  return {
    empty: false,
    source: 'calories',
    diffKcal,
    kg: diffKcal / KCAL_PER_KG,
    daysDelta,
    daysNote,
    loggedDays: dates.length,
  }
}
