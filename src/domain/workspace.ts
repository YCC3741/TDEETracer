import { todayString } from './date'
import type { LocalUser, PlanRecord, Profile, WorkspaceData } from './types'

export function workspaceId(prefix: 'user' | 'plan'): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}_${random}`
}

export function normaliseName(value: string, maxLength = 50): string {
  return value.trim().slice(0, maxLength)
}

export function profilesHaveSameSettings(
  left: Profile | null,
  right: Profile | null,
): boolean {
  if (!left || !right) return left === right
  return (
    left.sex === right.sex &&
    left.age === right.age &&
    left.height === right.height &&
    left.weight === right.weight &&
    left.target === right.target &&
    left.factor === right.factor &&
    left.intake === right.intake &&
    left.deficit === right.deficit &&
    left.mode === right.mode
  )
}

export function createLocalUser(
  name: string,
  now = new Date(),
  id = workspaceId('user'),
): LocalUser {
  const timestamp = now.toISOString()
  return {
    id,
    name: normaliseName(name) || '我的資料',
    quickDraft: null,
    plans: [],
    selectedPlanId: null,
    preferredMode: null,
    achievementsSeen: [],
    achievementsUnlocked: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createPlanRecord(
  name: string,
  profile: Profile,
  options: {
    now?: Date
    id?: string
    sourcePlanId?: string | null
  } = {},
): PlanRecord {
  const now = options.now ?? new Date()
  const timestamp = now.toISOString()
  return {
    id: options.id ?? workspaceId('plan'),
    name: normaliseName(name) || '精確計畫',
    status: 'active',
    profile: {
      ...profile,
      planStartedAt: todayString(now),
    },
    diary: [],
    sourcePlanId: options.sourcePlanId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
  }
}

export function createEmptyWorkspace(now = new Date()): WorkspaceData {
  const user = createLocalUser('我的資料', now)
  return {
    version: 3,
    activeUserId: user.id,
    users: [user],
  }
}
