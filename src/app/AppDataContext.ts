import { createContext, useContext } from 'react'
import type {
  AppDataState,
  AchievementId,
  DiaryDay,
  ExportData,
  LocalUser,
  NotificationType,
  PlanRecord,
  Profile,
  WorkMode,
} from '../domain/types'

export interface AppDataContextValue extends AppDataState {
  activeUser: LocalUser
  selectedPlan: PlanRecord | null
  profile: Profile | null
  quickDraft: Profile | null
  diary: DiaryDay[]
  achievementsSeen: AchievementId[]
  prefMode: WorkMode | null
  setQuickDraft: (profile: Profile) => boolean
  setDiary: (diary: DiaryDay[]) => boolean
  upsertDay: (day: DiaryDay, achievementIds?: AchievementId[]) => boolean
  setAchievementsSeen: (ids: AchievementId[]) => boolean
  setAchievementsUnlocked: (ids: AchievementId[]) => boolean
  setPreferredMode: (mode: WorkMode) => boolean
  createUser: (name: string) => string | null
  renameUser: (userId: string, name: string) => boolean
  deleteUser: (userId: string) => boolean
  selectUser: (userId: string) => boolean
  createPlan: (name: string) => string | null
  renamePlan: (planId: string, name: string) => boolean
  selectPlan: (planId: string) => boolean
  archivePlan: (planId: string) => boolean
  reactivatePlan: (planId: string) => boolean
  deletePlan: (planId: string) => boolean
  notify: (type: NotificationType, text: string) => void
  dismissNotification: (id: string) => void
  replaceData: (data: ExportData) => boolean
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData 必須在 AppDataProvider 內使用')
  return context
}
