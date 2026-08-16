import { DATA_EXPORT_VERSION } from '../domain/constants'

/**
 * Upgrades a stored payload one version at a time, before anything validates
 * it. Every step here is frozen history: it must keep producing the shape
 * that was current on the day it was written, so a step never imports a live
 * table or type. The duplicated figures below are deliberate for that reason.
 */
type UpgradeStep = (raw: Record<string, unknown>) => Record<string, unknown>

/** The oldest envelope that declares its own version. */
export const FIRST_VERSIONED_SHAPE = 3

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/* ---- Third to fourth: the activity multiplier becomes an identifier. ---- */

const V3_ACTIVITY_LEVELS = [
  { factor: 1, id: 'resting' },
  { factor: 1.2, id: 'sedentary' },
  { factor: 1.375, id: 'light' },
  { factor: 1.55, id: 'moderate' },
  { factor: 1.725, id: 'high' },
  { factor: 1.9, id: 'extreme' },
] as const

function v3LevelFromFactor(factor: number): string {
  return V3_ACTIVITY_LEVELS.reduce((closest, candidate) =>
    Math.abs(candidate.factor - factor) < Math.abs(closest.factor - factor)
      ? candidate
      : closest,
  ).id
}

function v3ProfileToV4(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  const { factor, ...rest } = raw
  if (typeof factor !== 'number' || !Number.isFinite(factor)) return raw
  return { ...rest, activityLevel: v3LevelFromFactor(factor) }
}

function v3PlanToV4(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  return { ...raw, profile: v3ProfileToV4(raw.profile) }
}

function v3UserToV4(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  return {
    ...raw,
    quickDraft: v3ProfileToV4(raw.quickDraft),
    plans: Array.isArray(raw.plans) ? raw.plans.map(v3PlanToV4) : raw.plans,
  }
}

const upgradeV3ToV4: UpgradeStep = (raw) => ({
  ...raw,
  version: 4,
  users: Array.isArray(raw.users) ? raw.users.map(v3UserToV4) : raw.users,
})

/* ------------------------------------------------------------------------ */

const STEPS: Record<number, UpgradeStep> = {
  3: upgradeV3ToV4,
}

/**
 * Walks a raw payload up to the shape this build understands. Payloads with
 * no version belong to the pre-workspace era and pass through for the legacy
 * reader; payloads from a newer build cannot be walked down and are refused.
 */
export function upgradeWorkspaceShape(raw: unknown): unknown {
  if (!isRecord(raw) || typeof raw.version !== 'number') return raw
  if (raw.version > DATA_EXPORT_VERSION) {
    throw new Error('不支援的資料版本')
  }

  let payload = raw
  for (let version = raw.version; version < DATA_EXPORT_VERSION; version += 1) {
    const step = STEPS[version]
    if (!step) throw new Error('不支援的資料版本')
    payload = step(payload)
  }
  return payload
}

/**
 * The pre-workspace entry points read a lone profile rather than an envelope,
 * so they cannot walk the chain. They get the profile-shaped steps instead.
 */
export function upgradeProfileShape(raw: unknown): unknown {
  return v3ProfileToV4(raw)
}

/** The oldest export envelope keeps its profile at the top level. */
export function upgradeLegacyEnvelopeShape(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  return { ...raw, profile: upgradeProfileShape(raw.profile) }
}
