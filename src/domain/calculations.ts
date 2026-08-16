import { activityLevelOf, isActivityLevelId } from './constants'
import type {
  DiaryDay,
  GaugeStage,
  PlanMode,
  Profile,
  RouteGauge,
  Sex,
  WarningMessage,
} from './types'
import { addDays, parseLocalDate, toDateString } from './date'

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'female' ? base - 161 : base + 5
}

export function calculateTdee(
  profile: Profile,
  weight = profile.weight,
  age = profile.age,
): number {
  return (
    calculateBmr(weight, profile.height, age, profile.sex) *
    activityLevelOf(profile.activityLevel).factor
  )
}

export function plannedDeficit(
  profile: Profile,
  tdee: number,
  mode: PlanMode,
): number {
  if (mode === 'deficit') return profile.deficit ?? 0
  return tdee - (profile.intake ?? 0)
}

export function actualDeficit(
  tdee: number,
  intake: number,
  burn: number,
): number {
  return tdee + burn - intake
}

export function intakeAllowance(profile: Profile, tdee: number): number {
  return tdee - plannedDeficit(profile, tdee, profile.mode)
}

/** Grams of protein for the day, at the rate the activity level carries. */
export function proteinTarget(profile: Profile, weightKg: number): number {
  return weightKg * activityLevelOf(profile.activityLevel).proteinPerKg
}

export function buildGauge(value: number, max: number): RouteGauge {
  const safeMax = Math.max(0, max)
  return {
    value,
    max: safeMax,
    ratio: safeMax === 0 ? 0 : Math.min(Math.max(value / safeMax, 0), 1),
  }
}

/** The intake bar depletes, so a high remaining ratio is the safe end. */
export function intakeStage(ratio: number): GaugeStage {
  if (ratio > 0.5) return 'safe'
  if (ratio > 0.2) return 'caution'
  return 'critical'
}

/** The protein bar fills, so a high achieved ratio is the safe end. */
export function proteinStage(ratio: number): GaugeStage {
  if (ratio >= 0.8) return 'safe'
  if (ratio >= 0.6) return 'caution'
  return 'critical'
}

export function estimateExerciseCalories(
  metOrCaloriesPerHour: number,
  minutes: number,
  weightKg: number,
  treatAsCaloriesPerHour = false,
): number {
  if (!metOrCaloriesPerHour || !minutes || !weightKg) return 0
  if (treatAsCaloriesPerHour) return metOrCaloriesPerHour * (minutes / 60)
  return metOrCaloriesPerHour * weightKg * (minutes / 60)
}

export function dayTotals(day: DiaryDay | null | undefined): {
  intake: number
  burn: number
  protein: number
} {
  const entries = day?.entries ?? []
  return entries.reduce(
    (totals, entry) => {
      if (entry.type === 'exercise') {
        totals.burn += entry.kcal || 0
        return totals
      }
      totals.intake += entry.kcal || 0
      totals.protein += entry.protein ?? 0
      return totals
    },
    { intake: 0, burn: 0, protein: 0 },
  )
}

export function isCheckedIn(day: DiaryDay | null | undefined): boolean {
  return Boolean(day?.entries.length)
}

export function uniqueCheckinDays(diary: DiaryDay[]): number {
  return new Set(diary.filter(isCheckedIn).map((day) => day.date)).size
}

export function longestCheckinStreak(diary: DiaryDay[]): number {
  const dates = Array.from(
    new Set(
      diary
        .filter(isCheckedIn)
        .map((day) => day.date)
        .filter((date) => {
          const parsed = parseLocalDate(date)
          return (
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            !Number.isNaN(parsed.getTime()) &&
            toDateString(parsed) === date
          )
        }),
    ),
  ).sort()

  let longest = 0
  let current = 0
  let previous: string | null = null

  dates.forEach((date) => {
    const expected = previous
      ? toDateString(addDays(parseLocalDate(previous), 1))
      : null
    current = expected === date ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = date
  })

  return longest
}

export function dayKindLabel(day: DiaryDay): string {
  const hasExercise = day.entries.some((entry) => entry.type === 'exercise')
  const hasFood = day.entries.some((entry) => entry.type === 'food')
  if (hasExercise && hasFood) return '飲食＋運動'
  if (hasExercise) return '運動'
  if (hasFood) return '飲食'
  return '紀錄'
}

export function isProfileReady(profile: Profile | null): profile is Profile {
  if (!profile?.sex) return false
  if (!isActivityLevelId(profile.activityLevel)) return false
  const common = [profile.age, profile.height, profile.weight, profile.target]
  if (!common.every((value) => Number.isFinite(value) && value > 0))
    return false
  if (profile.target >= profile.weight) return false
  return profile.mode === 'intake'
    ? Number.isFinite(profile.intake) && (profile.intake ?? 0) > 0
    : Number.isFinite(profile.deficit) && (profile.deficit ?? 0) > 0
}

export function buildSafetyWarnings(
  profile: Profile,
  bmr: number,
): WarningMessage[] {
  const messages: WarningMessage[] = []
  const floor = profile.sex === 'female' ? 1200 : 1500

  if (profile.mode === 'intake') {
    const intake = profile.intake ?? 0
    if (intake < floor) {
      messages.push({
        type: 'warn',
        text: `每日攝取 ${intake} kcal 低於一般建議下限（${floor} kcal）。`,
      })
    } else if (intake < bmr) {
      messages.push({
        type: 'warn',
        text: `每日攝取低於 BMR（${Math.round(bmr)} kcal），不建議長期執行。`,
      })
    }
  } else {
    const endTdee =
      calculateBmr(profile.target, profile.height, profile.age, profile.sex) *
      activityLevelOf(profile.activityLevel).factor
    const endIntake = endTdee - (profile.deficit ?? 0)
    if (endIntake < floor) {
      messages.push({
        type: 'warn',
        text: `接近目標時相當於每天約 ${Math.round(endIntake)} kcal，低於建議下限。`,
      })
    }
  }

  return messages
}
