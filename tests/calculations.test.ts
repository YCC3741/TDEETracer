import { describe, expect, it } from 'vitest'
import {
  actualDeficit,
  buildGauge,
  calculateBmr,
  calculateTdee,
  dayTotals,
  estimateExerciseCalories,
  intakeAllowance,
  intakeStage,
  longestCheckinStreak,
  plannedDeficit,
  proteinStage,
  proteinTarget,
  uniqueCheckinDays,
} from '../src/domain/calculations'
import {
  buildActualsByDate,
  buildWeightMeasurements,
  computePaceVsPlan,
  latestWeightMeasurement,
  resolveForecastAnchor,
  simulateWeightPath,
} from '../src/domain/projection'
import type { Profile } from '../src/domain/types'
import {
  expectedFemaleBmr,
  expectedFemaleTdee,
  expectedPlannedProjectionDays,
  femaleProfileFixture,
} from './fixtures'
import { makeDiaryDay } from './helpers/testData'

const profile: Profile = { ...femaleProfileFixture }

describe('TDEE calculations', () => {
  it('matches the Mifflin-St Jeor female fixture', () => {
    expect(calculateBmr(75, 170, 30, 'female')).toBe(expectedFemaleBmr)
    expect(calculateTdee(profile)).toBe(expectedFemaleTdee)
  })

  it('supports intake and fixed-deficit plan modes', () => {
    expect(plannedDeficit(profile, expectedFemaleTdee, 'intake')).toBeCloseTo(
      564.5625,
    )
    expect(
      plannedDeficit(
        { ...profile, mode: 'deficit', deficit: 500 },
        expectedFemaleTdee,
        'deficit',
      ),
    ).toBe(500)
  })

  it('combines actual food and exercise correctly', () => {
    expect(actualDeficit(2000, 1700, 260)).toBe(560)
    expect(estimateExerciseCalories(3.5, 30, 75)).toBeCloseTo(131.25)
  })

  it('sums the day figures and ignores unrecorded protein', () => {
    const day = makeDiaryDay('2026-08-11', {
      entries: [
        {
          id: 'a',
          type: 'food',
          time: '08:00',
          label: '早餐',
          kcal: 450,
          protein: 30,
        },
        {
          id: 'b',
          type: 'food',
          time: '12:00',
          label: '午餐',
          kcal: 600,
          protein: null,
        },
        {
          id: 'c',
          type: 'exercise',
          time: '19:00',
          presetId: 'jog',
          name: '慢跑',
          met: 7,
          minutes: 30,
          kcal: 300,
        },
      ],
    })

    expect(dayTotals(day)).toEqual({ intake: 1050, burn: 300, protein: 30 })
    expect(dayTotals(null)).toEqual({ intake: 0, burn: 0, protein: 0 })
  })

  it('reads the daily intake allowance from the active plan mode', () => {
    expect(intakeAllowance(profile, expectedFemaleTdee)).toBe(1500)
    expect(
      intakeAllowance(
        { ...profile, mode: 'deficit', intake: null, deficit: 500 },
        2000,
      ),
    ).toBe(1500)
  })

  it('derives the daily protein target from the activity level', () => {
    expect(proteinTarget(profile, 70)).toBeCloseTo(126)
    expect(
      proteinTarget({ ...profile, activityLevel: 'sedentary' }, 70),
    ).toBeCloseTo(112)
    expect(
      proteinTarget({ ...profile, activityLevel: 'moderate' }, 70),
    ).toBeCloseTo(140)
    expect(
      proteinTarget({ ...profile, activityLevel: 'extreme' }, 70),
    ).toBeCloseTo(168)
  })

  it('maps protein achievement to the rising bar stages', () => {
    expect(proteinStage(1.4)).toBe('safe')
    expect(proteinStage(0.8)).toBe('safe')
    expect(proteinStage(0.79)).toBe('caution')
    expect(proteinStage(0.6)).toBe('caution')
    expect(proteinStage(0.59)).toBe('critical')
    expect(proteinStage(0)).toBe('critical')
  })

  it('clamps gauge ratios while keeping the reported figure intact', () => {
    expect(buildGauge(420, 1500).ratio).toBeCloseTo(0.28)
    expect(buildGauge(-220, 1500)).toEqual({ value: -220, max: 1500, ratio: 0 })
    expect(buildGauge(620, 500).ratio).toBe(1)
    expect(buildGauge(100, 0)).toEqual({ value: 100, max: 0, ratio: 0 })
  })

  it('maps remaining intake to the depleting bar stages', () => {
    expect(intakeStage(1)).toBe('safe')
    expect(intakeStage(0.51)).toBe('safe')
    expect(intakeStage(0.5)).toBe('caution')
    expect(intakeStage(0.21)).toBe('caution')
    expect(intakeStage(0.2)).toBe('critical')
    expect(intakeStage(0)).toBe('critical')
  })

  it('finds the longest consecutive run of checked-in calendar dates', () => {
    const diary = [
      makeDiaryDay('2026-08-10'),
      makeDiaryDay('2026-08-07'),
      makeDiaryDay('2026-08-08'),
      makeDiaryDay('2026-08-09'),
      makeDiaryDay('2026-08-03'),
      makeDiaryDay('2026-08-04', {
        actualWeightKg: 72.5,
        entries: [],
      }),
      makeDiaryDay('invalid'),
    ]

    expect(longestCheckinStreak(diary)).toBe(4)
    expect(longestCheckinStreak([])).toBe(0)
  })

  it('deduplicates user achievements across separate plan diaries', () => {
    const acrossPlans = [
      makeDiaryDay('2026-08-09'),
      makeDiaryDay('2026-08-10'),
      makeDiaryDay('2026-08-10'),
      makeDiaryDay('2026-08-11'),
      makeDiaryDay('2026-08-12', {
        actualWeightKg: 72,
        entries: [],
      }),
    ]

    expect(uniqueCheckinDays(acrossPlans)).toBe(3)
    expect(longestCheckinStreak(acrossPlans)).toBe(3)
  })
})

describe('weight projection', () => {
  it('recalculates TDEE daily until the target is reached', () => {
    const result = simulateWeightPath(profile, {
      startDate: new Date('2026-08-11T00:00:00'),
    })
    expect(result.reached).toBe(true)
    expect(result.days).toBe(expectedPlannedProjectionDays)
    expect(result.finalWeight).toBe(65)
  })

  it('stops when the daily deficit falls below five kcal', () => {
    const result = simulateWeightPath(
      { ...profile, intake: expectedFemaleTdee - 4 },
      { startDate: new Date('2026-08-11T00:00:00') },
    )
    expect(result.plateaued).toBe(true)
    expect(result.days).toBe(0)
  })

  it('continues after an actual surplus day and applies later planned deficits', () => {
    const startDate = new Date('2026-08-11T00:00:00')
    const result = simulateWeightPath(profile, {
      startDate,
      actuals: {
        '2026-08-11': {
          intake: expectedFemaleTdee + 200,
          burn: 0,
        },
      },
    })

    expect(result.dayMeta[0]).toMatchObject({
      source: 'actual',
      deficit: -200,
    })
    expect(result.daily[1]).toBeGreaterThan(profile.weight)
    expect(result.dayMeta[1]?.source).toBe('plan')
    expect(result.plateaued).toBe(false)
    expect(result.reached).toBe(true)
  })

  it('uses the latest non-future actual weight as the forecast anchor', () => {
    const diary = [
      makeDiaryDay('2026-08-09', { actualWeightKg: 72.8 }),
      makeDiaryDay('2026-08-11', { actualWeightKg: 72.1 }),
      makeDiaryDay('2026-08-12', { actualWeightKg: 71.9 }),
    ]
    const now = new Date('2026-08-11T08:30:00')
    const anchor = resolveForecastAnchor(profile, diary, now)

    expect(latestWeightMeasurement(diary, '2026-08-11')).toEqual({
      date: '2026-08-11',
      weight: 72.1,
    })
    expect(anchor.dateString).toBe('2026-08-11')
    expect(anchor.weight).toBe(72.1)
    expect(
      simulateWeightPath(profile, {
        startDate: anchor.date,
        startWeight: anchor.weight,
      }).daily[0],
    ).toBe(72.1)
  })

  it('uses planStartedAt and historical diary when no weight exists', () => {
    const basedProfile = { ...profile, planStartedAt: '2026-08-01' }
    const diary = [makeDiaryDay('2026-08-05')]
    const now = new Date('2026-08-11T08:30:00')
    const anchor = resolveForecastAnchor(basedProfile, diary, now)
    const actuals = buildActualsByDate(diary)
    const actualSimulation = simulateWeightPath(basedProfile, {
      startDate: anchor.date,
      startWeight: anchor.weight,
      actuals,
    })
    const planSimulation = simulateWeightPath(basedProfile, {
      startDate: anchor.date,
      startWeight: anchor.weight,
    })
    const pace = computePaceVsPlan(basedProfile, actuals, now)

    expect(anchor.dateString).toBe('2026-08-01')
    expect(actualSimulation.daily[5]).toBeLessThan(planSimulation.daily[5]!)
    expect(pace.source).toBe('calories')
    expect(pace.daysDelta).toBeGreaterThan(0)
  })

  it('prioritises actual weight for pace and falls back to calorie entries', () => {
    const basedProfile = { ...profile, planStartedAt: '2026-08-01' }
    const measuredDiary = [
      makeDiaryDay('2026-08-11', {
        actualWeightKg: 70,
        entries: [],
      }),
    ]
    const actualPace = computePaceVsPlan(
      basedProfile,
      {},
      new Date('2026-08-11T08:30:00'),
      buildWeightMeasurements(measuredDiary),
    )
    expect(actualPace.source).toBe('weight')
    expect(actualPace.kg).toBeGreaterThan(0)
    expect(actualPace.daysDelta).toBeGreaterThan(0)

    const calorieDiary = [makeDiaryDay('2026-08-11')]
    const caloriePace = computePaceVsPlan(
      basedProfile,
      buildActualsByDate(calorieDiary),
      new Date('2026-08-11T08:30:00'),
    )
    expect(caloriePace.source).toBe('calories')
  })
})
