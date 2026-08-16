import { isActivityLevelId, WEIGHT_RANGE_KG } from './constants'
import { todayString } from './date'
import type { Profile, Sex, WorkMode } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value)
}

export function isValidWeightKg(value: unknown): value is number {
  return (
    isFiniteNumber(value) &&
    value >= WEIGHT_RANGE_KG.min &&
    value <= WEIGHT_RANGE_KG.max
  )
}

function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year!, month! - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month! - 1 &&
    date.getDate() === day
  )
}

export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) return null
  const sex = value.sex as Sex
  const mode = value.mode
  if (sex !== 'female' && sex !== 'male') return null
  if (mode !== 'intake' && mode !== 'deficit') return null
  if (
    !isFiniteNumber(value.age) ||
    !isFiniteNumber(value.height) ||
    !isFiniteNumber(value.weight) ||
    !isFiniteNumber(value.target) ||
    !isActivityLevelId(value.activityLevel) ||
    !isNullableFiniteNumber(value.intake) ||
    !isNullableFiniteNumber(value.deficit)
  ) {
    return null
  }
  return {
    sex,
    age: value.age,
    height: value.height,
    weight: value.weight,
    target: value.target,
    activityLevel: value.activityLevel,
    intake: value.intake,
    deficit: value.deficit,
    mode,
    planStartedAt: isDateString(value.planStartedAt)
      ? value.planStartedAt
      : todayString(),
  }
}

export function profileNeedsMigration(value: unknown): boolean {
  return isRecord(value) && !isDateString(value.planStartedAt)
}

export function parsePreferredMode(value: unknown): WorkMode | null {
  return value === 'quick' || value === 'diary' ? value : null
}

export interface LegacyExportEnvelope {
  version: 1 | 2
  exportedAt: string
  profile: Profile | null
  diary: unknown[]
  achievementsSeen: number[]
  prefMode: WorkMode | null
}

export function validateExportEnvelope(value: unknown): LegacyExportEnvelope {
  if (!isRecord(value)) throw new Error('檔案格式不正確')
  if (value.version !== 1 && value.version !== 2) {
    throw new Error('不支援的資料版本')
  }

  const profile = value.profile === null ? null : parseProfile(value.profile)
  if (value.profile !== null && !profile) throw new Error('profile 格式不正確')
  if (!Array.isArray(value.diary)) throw new Error('diary 必須是陣列')
  if (
    !Array.isArray(value.achievementsSeen) ||
    !value.achievementsSeen.every(isFiniteNumber)
  ) {
    throw new Error('achievementsSeen 必須是數字陣列')
  }

  const prefMode =
    value.prefMode === null ? null : parsePreferredMode(value.prefMode)
  if (value.prefMode !== null && !prefMode) {
    throw new Error('prefMode 格式不正確')
  }

  return {
    version: value.version,
    exportedAt:
      typeof value.exportedAt === 'string'
        ? value.exportedAt
        : new Date().toISOString(),
    profile,
    diary: value.diary,
    achievementsSeen: value.achievementsSeen,
    prefMode,
  }
}
