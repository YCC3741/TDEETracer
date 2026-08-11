import {
  STORAGE_ACHIEVEMENTS,
  STORAGE_DIARY,
  STORAGE_PREFERRED_MODE,
  STORAGE_PROFILE,
  STORAGE_WORKSPACE,
} from '../domain/constants'
import type {
  AppDataState,
  DiaryDay,
  ExportData,
  Profile,
  WorkspaceData,
  WorkMode,
} from '../domain/types'
import {
  parsePreferredMode,
  parseProfile,
  profileNeedsMigration,
} from '../domain/validation'
import { createEmptyWorkspace } from '../domain/workspace'
import { diaryNeedsMigration, migrateDiary } from './migrations'
import { migrateLegacySnapshot, parseWorkspaceData } from './workspaceMigration'

function parseJson(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function loadProfile(storage: Storage): Profile | null {
  const raw = parseJson(storage.getItem(STORAGE_PROFILE))
  const profile = parseProfile(raw)
  if (profile && profileNeedsMigration(raw)) saveProfile(storage, profile)
  return profile
}

export function saveProfile(storage: Storage, profile: Profile | null): void {
  if (profile) storage.setItem(STORAGE_PROFILE, JSON.stringify(profile))
  else storage.removeItem(STORAGE_PROFILE)
}

export function loadDiary(storage: Storage): DiaryDay[] {
  const raw = parseJson(storage.getItem(STORAGE_DIARY))
  const diary = migrateDiary(raw)
  if (diaryNeedsMigration(raw)) saveDiary(storage, diary)
  return diary
}

export function saveDiary(storage: Storage, diary: DiaryDay[]): void {
  storage.setItem(STORAGE_DIARY, JSON.stringify(diary))
}

export function loadAchievementsSeen(storage: Storage): number[] {
  const raw = parseJson(storage.getItem(STORAGE_ACHIEVEMENTS))
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  )
}

export function saveAchievementsSeen(storage: Storage, days: number[]): void {
  storage.setItem(STORAGE_ACHIEVEMENTS, JSON.stringify(days))
}

export function loadPreferredMode(storage: Storage): WorkMode | null {
  return parsePreferredMode(storage.getItem(STORAGE_PREFERRED_MODE))
}

export function savePreferredMode(
  storage: Storage,
  mode: WorkMode | null,
): void {
  if (mode) storage.setItem(STORAGE_PREFERRED_MODE, mode)
  else storage.removeItem(STORAGE_PREFERRED_MODE)
}

export function loadInitialData(storage: Storage): AppDataState {
  const workspace = loadWorkspace(storage)
  return {
    ...workspace,
    notifications: [],
  }
}

export function loadWorkspace(storage: Storage): WorkspaceData {
  const rawWorkspace = storage.getItem(STORAGE_WORKSPACE)
  if (rawWorkspace !== null) {
    let storedWorkspace: unknown
    try {
      storedWorkspace = JSON.parse(rawWorkspace)
    } catch {
      throw new Error('workspace JSON 無法解析')
    }
    return parseWorkspaceData(storedWorkspace)
  }

  const hasLegacyData = [
    STORAGE_PROFILE,
    STORAGE_DIARY,
    STORAGE_ACHIEVEMENTS,
    STORAGE_PREFERRED_MODE,
  ].some((key) => storage.getItem(key) !== null)
  if (!hasLegacyData) return createEmptyWorkspace()

  const workspace = migrateLegacySnapshot({
    profile: loadProfile(storage),
    diary: loadDiary(storage),
    achievementsSeen: loadAchievementsSeen(storage),
    prefMode: loadPreferredMode(storage),
  })
  saveWorkspace(storage, workspace)
  return workspace
}

export function saveWorkspace(
  storage: Storage,
  workspace: WorkspaceData,
): void {
  storage.setItem(STORAGE_WORKSPACE, JSON.stringify(workspace))
}

export function replaceStoredData(storage: Storage, data: ExportData): void {
  const previous = storage.getItem(STORAGE_WORKSPACE)

  try {
    saveWorkspace(storage, {
      version: 3,
      activeUserId: data.activeUserId,
      users: data.users,
    })
  } catch (error) {
    try {
      if (previous === null) storage.removeItem(STORAGE_WORKSPACE)
      else storage.setItem(STORAGE_WORKSPACE, previous)
    } catch {
      // Preserve the original write error.
    }
    throw error
  }
}
