import { parsePreferredMode, parseProfile } from '../domain/validation'
import type {
  AchievementId,
  LocalUser,
  PlanRecord,
  Profile,
  WorkspaceData,
  WorkMode,
} from '../domain/types'
import { createEmptyWorkspace, normaliseName } from '../domain/workspace'
import { migrateDiary } from './migrations'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year!, month! - 1, day)
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month! - 1 &&
    parsed.getDate() === day
  )
}

function isStrictV3Diary(raw: unknown[], diary: PlanRecord['diary']): boolean {
  if (raw.length !== diary.length) return false
  const dates = new Set<string>()
  const entryIds = new Set<string>()

  return raw.every((rawDay, dayIndex) => {
    if (!isRecord(rawDay) || !Array.isArray(rawDay.entries)) return false
    const day = diary[dayIndex]
    if (
      !day ||
      !isDateString(rawDay.date) ||
      rawDay.date !== day.date ||
      typeof rawDay.updatedAt !== 'string' ||
      rawDay.entries.length !== day.entries.length ||
      dates.has(day.date)
    ) {
      return false
    }
    dates.add(day.date)
    if (
      rawDay.actualWeightKg !== null &&
      (typeof rawDay.actualWeightKg !== 'number' ||
        !Number.isFinite(rawDay.actualWeightKg) ||
        rawDay.actualWeightKg < 25 ||
        rawDay.actualWeightKg > 350)
    ) {
      return false
    }

    return rawDay.entries.every((rawEntry, entryIndex) => {
      if (!isRecord(rawEntry)) return false
      const entry = day.entries[entryIndex]
      if (
        !entry ||
        typeof rawEntry.id !== 'string' ||
        !rawEntry.id ||
        rawEntry.id !== entry.id ||
        entryIds.has(entry.id) ||
        typeof rawEntry.time !== 'string' ||
        typeof rawEntry.kcal !== 'number' ||
        !Number.isFinite(rawEntry.kcal)
      ) {
        return false
      }
      entryIds.add(entry.id)
      if (rawEntry.type === 'food') {
        return typeof rawEntry.label === 'string' && entry.type === 'food'
      }
      if (rawEntry.type !== 'exercise' || entry.type !== 'exercise')
        return false
      return (
        typeof rawEntry.presetId === 'string' &&
        typeof rawEntry.name === 'string' &&
        (rawEntry.met === null ||
          (typeof rawEntry.met === 'number' &&
            Number.isFinite(rawEntry.met))) &&
        typeof rawEntry.minutes === 'number' &&
        Number.isFinite(rawEntry.minutes)
      )
    })
  })
}

function achievementId(value: unknown): AchievementId | null {
  if (typeof value === 'string' && /^(total|streak):\d+$/.test(value)) {
    return value as AchievementId
  }
  return null
}

export function migrateAchievementIds(values: unknown): AchievementId[] {
  if (!Array.isArray(values)) return []
  return Array.from(
    new Set(
      values
        .map((value) => {
          const current = achievementId(value)
          if (current) return current
          if (
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            !Number.isInteger(value) ||
            value === 0
          ) {
            return null
          }
          return `${value > 0 ? 'total' : 'streak'}:${Math.abs(value)}` as AchievementId
        })
        .filter((value): value is AchievementId => value !== null),
    ),
  )
}

function parsePlan(value: unknown): PlanRecord {
  if (!isRecord(value)) throw new Error('plan 格式不正確')
  const id = stringValue(value.id)
  const name = normaliseName(stringValue(value.name))
  const status = value.status
  if (!id || !name || (status !== 'active' && status !== 'archived')) {
    throw new Error('plan identity 格式不正確')
  }
  if (!Array.isArray(value.diary)) throw new Error('plan diary 格式不正確')
  const profile = value.profile === null ? null : parseProfile(value.profile)
  if (value.profile !== null && !profile) {
    throw new Error('plan profile 格式不正確')
  }
  const archivedAt =
    value.archivedAt === null ? null : stringValue(value.archivedAt)
  if (status === 'archived' && !archivedAt) {
    throw new Error('archived plan 缺少封存日期')
  }
  const diary = migrateDiary(value.diary)
  if (!isStrictV3Diary(value.diary, diary)) {
    throw new Error('plan diary 格式不正確')
  }
  return {
    id,
    name,
    status,
    profile,
    diary,
    sourcePlanId:
      value.sourcePlanId === null
        ? null
        : stringValue(value.sourcePlanId) || null,
    createdAt: stringValue(value.createdAt, new Date().toISOString()),
    updatedAt: stringValue(value.updatedAt, new Date().toISOString()),
    archivedAt,
  }
}

function parseUser(value: unknown): LocalUser {
  if (!isRecord(value)) throw new Error('user 格式不正確')
  const id = stringValue(value.id)
  const name = normaliseName(stringValue(value.name))
  if (!id || !name || !Array.isArray(value.plans)) {
    throw new Error('user identity 格式不正確')
  }
  const plans = value.plans.map(parsePlan)
  const planIds = new Set(plans.map((plan) => plan.id))
  if (planIds.size !== plans.length) throw new Error('plan ID 重複')
  if (plans.filter((plan) => plan.status === 'active').length > 1) {
    throw new Error('每位使用者只能有一個 active plan')
  }
  if (
    plans.some((plan) => plan.sourcePlanId && !planIds.has(plan.sourcePlanId))
  ) {
    throw new Error('sourcePlanId 不存在')
  }
  const quickDraft =
    value.quickDraft === null ? null : parseProfile(value.quickDraft)
  if (value.quickDraft !== null && !quickDraft) {
    throw new Error('Quick draft 格式不正確')
  }
  const selectedPlanId =
    value.selectedPlanId === null ? null : stringValue(value.selectedPlanId)
  if (selectedPlanId && !planIds.has(selectedPlanId)) {
    throw new Error('selectedPlanId 不存在')
  }
  const preferredMode =
    value.preferredMode === null
      ? null
      : parsePreferredMode(value.preferredMode)
  if (value.preferredMode !== null && !preferredMode) {
    throw new Error('preferredMode 格式不正確')
  }
  const achievementsSeen = migrateAchievementIds(value.achievementsSeen)
  const achievementsUnlocked = Array.from(
    new Set([
      ...migrateAchievementIds(value.achievementsUnlocked),
      ...achievementsSeen,
    ]),
  )
  return {
    id,
    name,
    quickDraft,
    plans,
    selectedPlanId,
    preferredMode,
    achievementsSeen,
    achievementsUnlocked,
    createdAt: stringValue(value.createdAt, new Date().toISOString()),
    updatedAt: stringValue(value.updatedAt, new Date().toISOString()),
  }
}

export function parseWorkspaceData(value: unknown): WorkspaceData {
  if (!isRecord(value) || value.version !== 3 || !Array.isArray(value.users)) {
    throw new Error('workspace 格式不正確')
  }
  const users = value.users.map(parseUser)
  const userIds = new Set(users.map((user) => user.id))
  if (!users.length || userIds.size !== users.length) {
    throw new Error('workspace user ID 不正確')
  }
  const activeUserId = stringValue(value.activeUserId)
  if (!userIds.has(activeUserId)) throw new Error('activeUserId 不存在')
  return { version: 3, activeUserId, users }
}

interface LegacySnapshot {
  profile: Profile | null
  diary: unknown
  achievementsSeen: unknown
  prefMode: WorkMode | null
}

export function migrateLegacySnapshot(
  snapshot: LegacySnapshot,
  now = new Date(),
): WorkspaceData {
  const timestamp = now.toISOString()
  const user: LocalUser = {
    id: 'user_legacy',
    name: '我的資料',
    quickDraft: snapshot.profile,
    plans: [],
    selectedPlanId: null,
    preferredMode: snapshot.prefMode,
    achievementsSeen: migrateAchievementIds(snapshot.achievementsSeen),
    achievementsUnlocked: migrateAchievementIds(snapshot.achievementsSeen),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const diary = migrateDiary(snapshot.diary)
  if (snapshot.profile || diary.length) {
    const plan: PlanRecord = {
      id: 'plan_legacy',
      name: '原有計畫',
      status: 'active',
      profile: snapshot.profile,
      diary,
      sourcePlanId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    }
    user.plans.push(plan)
    user.selectedPlanId = plan.id
  }
  return { version: 3, activeUserId: user.id, users: [user] }
}

export function migrateLegacyExport(
  profile: Profile | null,
  diary: unknown[],
  achievementsSeen: number[],
  prefMode: WorkMode | null,
): WorkspaceData {
  return migrateLegacySnapshot({
    profile,
    diary,
    achievementsSeen,
    prefMode,
  })
}

export function ensureWorkspace(value: unknown): WorkspaceData {
  if (value === null || value === undefined) return createEmptyWorkspace()
  return parseWorkspaceData(value)
}
