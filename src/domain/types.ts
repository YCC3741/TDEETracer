export type Sex = 'female' | 'male'
export type PlanMode = 'intake' | 'deficit'
export type WorkMode = 'quick' | 'diary'
export type PageName = 'home' | WorkMode
export type EntryType = 'food' | 'exercise'

export interface Profile {
  sex: Sex
  age: number
  height: number
  weight: number
  target: number
  factor: number
  intake: number | null
  deficit: number | null
  mode: PlanMode
  planStartedAt: string
}

export interface FoodEntry {
  id: string
  type: 'food'
  time: string
  label: string
  kcal: number
}

export interface ExerciseEntry {
  id: string
  type: 'exercise'
  time: string
  presetId: string
  name: string
  met: number | null
  minutes: number
  kcal: number
}

export type DiaryEntry = FoodEntry | ExerciseEntry

export interface DiaryDay {
  date: string
  actualWeightKg: number | null
  exerciseStatus: string
  note: string
  entries: DiaryEntry[]
  updatedAt: string
}

export interface WeightMeasurement {
  date: string
  weight: number
}

export interface ActualDay {
  intake: number
  burn: number
}

export type ActualsByDate = Record<string, ActualDay>

export interface SimulationDayMeta {
  tdee: number
  deficit: number
  source: 'actual' | 'plan'
  date: string
}

export interface SimulationResult {
  daily: number[]
  dayMeta: SimulationDayMeta[]
  days: number
  reached: boolean
  plateaued: boolean
  finalWeight: number
}

export interface ActivityLevel {
  factor: number
  name: string
  note: string
}

export interface ExercisePreset {
  id: string
  name: string
  met: number | null
}

export interface Achievement {
  days: number
  title: string
  kind: 'total' | 'streak'
}

export interface WarningMessage {
  type: 'warn' | 'danger'
  text: string
}

export interface ProjectionRow {
  label: string
  date: string
  weight: number
  lost: number | null
  tdee: number
  deficit: number
  source: 'actual' | 'plan' | null
}

export interface PaceComparison {
  empty: boolean
  source?: 'weight' | 'calories'
  diffKcal?: number
  kg?: number
  daysDelta?: number | null
  daysNote?: string
  loggedDays?: number
}

export type PlanStatus = 'active' | 'archived'
export type AchievementId = `total:${number}` | `streak:${number}`

export interface PlanRecord {
  id: string
  name: string
  status: PlanStatus
  profile: Profile | null
  diary: DiaryDay[]
  sourcePlanId: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface LocalUser {
  id: string
  name: string
  quickDraft: Profile | null
  plans: PlanRecord[]
  selectedPlanId: string | null
  preferredMode: WorkMode | null
  achievementsSeen: AchievementId[]
  achievementsUnlocked: AchievementId[]
  createdAt: string
  updatedAt: string
}

export interface WorkspaceData {
  version: 3
  activeUserId: string
  users: LocalUser[]
}

export interface ExportData extends WorkspaceData {
  exportedAt: string
}

export type NotificationType = 'ok' | 'warn' | 'danger'

export interface AppNotification {
  id: string
  type: NotificationType
  text: string
}

export interface AppDataState extends WorkspaceData {
  notifications: AppNotification[]
}
