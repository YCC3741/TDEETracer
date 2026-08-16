import type {
  DiaryDay,
  DiaryEntry,
  ExerciseEntry,
  FoodEntry,
} from '../domain/types'
import { isValidWeightKg } from '../domain/validation'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function proteinOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null
}

function actualWeightOrNull(value: unknown): number | null {
  return isValidWeightKg(value) ? value : null
}

function migrateEntry(raw: unknown, fallbackId: string): DiaryEntry | null {
  if (!isRecord(raw)) return null
  const type = raw.type
  const kcal = numberOr(raw.kcal, 0)
  const time = stringOr(raw.time, '')

  if (type === 'food') {
    const entry: FoodEntry = {
      id: stringOr(raw.id, fallbackId),
      type: 'food',
      time,
      label: stringOr(raw.label, '飲食'),
      kcal,
      protein: proteinOrNull(raw.protein),
    }
    return entry
  }

  if (type === 'exercise') {
    const entry: ExerciseEntry = {
      id: stringOr(raw.id, fallbackId),
      type: 'exercise',
      time,
      presetId: stringOr(raw.presetId, 'custom'),
      name: stringOr(raw.name, '運動'),
      met:
        typeof raw.met === 'number' && Number.isFinite(raw.met)
          ? raw.met
          : null,
      minutes: numberOr(raw.minutes, 0),
      kcal,
    }
    return entry
  }

  return null
}

export function migrateDiaryDay(
  raw: unknown,
  nowIso = new Date().toISOString(),
): DiaryDay | null {
  if (!isRecord(raw)) return null
  const date = stringOr(raw.date, '')
  if (!date) return null

  if (Array.isArray(raw.entries)) {
    const entries = raw.entries
      .map((entry, index) => migrateEntry(entry, `${date}_entry_${index}`))
      .filter((entry): entry is DiaryEntry => entry !== null)
    return {
      date,
      actualWeightKg: actualWeightOrNull(raw.actualWeightKg),
      exerciseStatus: stringOr(raw.exerciseStatus, 'no'),
      note: stringOr(raw.note, ''),
      entries,
      updatedAt: stringOr(raw.updatedAt, nowIso),
    }
  }

  const entries: DiaryEntry[] = []
  const intake = numberOr(raw.intake, 0)
  if (intake > 0) {
    entries.push({
      id: `${date}_food_legacy`,
      type: 'food',
      time: '',
      label: '攝取（舊格式）',
      kcal: intake,
      protein: null,
    })
  }

  const exercises = Array.isArray(raw.exercises) ? raw.exercises : []
  exercises.forEach((exercise, index) => {
    if (!isRecord(exercise)) return
    entries.push({
      id: `${date}_ex_legacy_${index}`,
      type: 'exercise',
      time: '',
      presetId: stringOr(exercise.presetId, 'custom'),
      name: stringOr(exercise.name, '運動'),
      met:
        typeof exercise.met === 'number' && Number.isFinite(exercise.met)
          ? exercise.met
          : null,
      minutes: numberOr(exercise.minutes, 0),
      kcal: numberOr(exercise.kcal, 0),
    })
  })

  return {
    date,
    actualWeightKg: actualWeightOrNull(raw.actualWeightKg),
    exerciseStatus: stringOr(raw.exerciseStatus, 'no'),
    note: stringOr(raw.note, ''),
    entries,
    updatedAt: stringOr(raw.updatedAt, nowIso),
  }
}

export function migrateDiary(raw: unknown, nowIso?: string): DiaryDay[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((day) => migrateDiaryDay(day, nowIso))
    .filter((day): day is DiaryDay => day !== null)
}

export function diaryNeedsMigration(raw: unknown): boolean {
  return (
    Array.isArray(raw) &&
    raw.some(
      (day) =>
        isRecord(day) &&
        (!Array.isArray(day.entries) || !('actualWeightKg' in day)),
    )
  )
}
