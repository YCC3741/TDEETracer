import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from 'react'
import type {
  AchievementId,
  AppDataState,
  ExportData,
  LocalUser,
  NotificationType,
  PlanRecord,
  Profile,
  WorkspaceData,
  WorkMode,
} from '../domain/types'
import { isProfileReady } from '../domain/calculations'
import { latestWeightMeasurement } from '../domain/projection'
import {
  createLocalUser,
  createPlanRecord,
  normaliseName,
} from '../domain/workspace'
import {
  loadInitialData,
  replaceStoredData,
  saveWorkspace,
} from '../storage/localStorageRepository'
import { AppDataContext, type AppDataContextValue } from './AppDataContext'

type Action =
  | { type: 'replace-workspace'; workspace: WorkspaceData }
  | {
      type: 'add-notification'
      notification: AppDataState['notifications'][number]
    }
  | { type: 'remove-notification'; id: string }

interface AppDataProviderProps extends PropsWithChildren {
  storage?: Storage
}

function reducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
    case 'replace-workspace':
      return { ...action.workspace, notifications: state.notifications }
    case 'add-notification':
      return {
        ...state,
        notifications: [...state.notifications, action.notification],
      }
    case 'remove-notification':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.id,
        ),
      }
  }
}

function notificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function workspaceFromState(state: AppDataState): WorkspaceData {
  return {
    version: 3,
    activeUserId: state.activeUserId,
    users: state.users,
  }
}

export function AppDataProvider({
  children,
  storage = window.localStorage,
}: AppDataProviderProps) {
  const [state, dispatch] = useReducer(reducer, storage, loadInitialData)
  const workspaceRef = useRef<WorkspaceData>(workspaceFromState(state))
  useEffect(() => {
    workspaceRef.current = workspaceFromState(state)
  }, [state])

  const notify = useCallback((type: NotificationType, text: string) => {
    dispatch({
      type: 'add-notification',
      notification: { id: notificationId(), type, text },
    })
  }, [])

  const persist = useCallback(
    (workspace: WorkspaceData, failureMessage: string): boolean => {
      try {
        saveWorkspace(storage, workspace)
        workspaceRef.current = workspace
        dispatch({ type: 'replace-workspace', workspace })
        return true
      } catch {
        notify('danger', failureMessage)
        return false
      }
    },
    [notify, storage],
  )

  const activeUser =
    state.users.find((user) => user.id === state.activeUserId) ??
    state.users[0]!
  const selectedPlan =
    activeUser.plans.find((plan) => plan.id === activeUser.selectedPlanId) ??
    null

  const replaceUser = useCallback(
    (
      userId: string,
      update: (user: LocalUser) => LocalUser,
      failureMessage: string,
    ): boolean => {
      const workspace = {
        ...workspaceRef.current,
        users: [...workspaceRef.current.users],
      }
      const currentUser = workspace.users.find((user) => user.id === userId)
      if (!currentUser) return false
      const nextUser = update(currentUser)
      workspace.users = workspace.users.map((user) =>
        user.id === nextUser.id ? nextUser : user,
      )
      return persist(workspace, failureMessage)
    },
    [persist],
  )

  const setQuickDraft = useCallback(
    (profile: Profile) =>
      replaceUser(
        activeUser.id,
        (user) => ({
          ...user,
          quickDraft: profile,
          updatedAt: new Date().toISOString(),
        }),
        '無法儲存 Quick 草稿。',
      ),
    [activeUser, replaceUser],
  )

  const replaceSelectedPlan = useCallback(
    (nextPlan: PlanRecord, failureMessage: string): boolean => {
      if (nextPlan.status === 'archived') {
        notify('warn', '已封存計畫為唯讀，無法修改。')
        return false
      }
      return replaceUser(
        activeUser.id,
        (user) => ({
          ...user,
          plans: user.plans.map((plan) =>
            plan.id === nextPlan.id ? nextPlan : plan,
          ),
          updatedAt: new Date().toISOString(),
        }),
        failureMessage,
      )
    },
    [activeUser, notify, replaceUser],
  )

  const setDiary = useCallback(
    (diary: PlanRecord['diary']) => {
      if (!selectedPlan || selectedPlan.status !== 'active') {
        notify('warn', '請先選擇進行中的計畫。')
        return false
      }
      return replaceSelectedPlan(
        { ...selectedPlan, diary, updatedAt: new Date().toISOString() },
        '無法儲存日記資料。',
      )
    },
    [notify, replaceSelectedPlan, selectedPlan],
  )

  const upsertDay = useCallback(
    (
      day: PlanRecord['diary'][number],
      achievementIds: AchievementId[] = activeUser.achievementsSeen,
    ) => {
      const currentUser = workspaceRef.current.users.find(
        (user) => user.id === activeUser.id,
      )
      const currentPlan = currentUser?.plans.find(
        (plan) => plan.id === currentUser.selectedPlanId,
      )
      if (!currentUser || !currentPlan || currentPlan.status !== 'active') {
        notify('warn', '請先選擇進行中的計畫。')
        return false
      }
      const diary = currentPlan.diary.filter((item) => item.date !== day.date)
      diary.push(day)
      diary.sort((left, right) => left.date.localeCompare(right.date))
      const updatedPlan = {
        ...currentPlan,
        diary,
        updatedAt: new Date().toISOString(),
      }
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: user.plans.map((plan) =>
            plan.id === updatedPlan.id ? updatedPlan : plan,
          ),
          achievementsSeen: achievementIds,
          achievementsUnlocked: Array.from(
            new Set([...user.achievementsUnlocked, ...achievementIds]),
          ),
          updatedAt: new Date().toISOString(),
        }),
        '無法儲存日記資料。',
      )
    },
    [activeUser, notify, replaceUser],
  )

  const setAchievementsSeen = useCallback(
    (ids: AchievementId[]) =>
      replaceUser(
        activeUser.id,
        (user) => ({
          ...user,
          achievementsSeen: ids,
          achievementsUnlocked: Array.from(
            new Set([...user.achievementsUnlocked, ...ids]),
          ),
          updatedAt: new Date().toISOString(),
        }),
        '無法儲存成就資料。',
      ),
    [activeUser, replaceUser],
  )

  const setAchievementsUnlocked = useCallback(
    (ids: AchievementId[]) =>
      replaceUser(
        activeUser.id,
        (user) => ({
          ...user,
          achievementsUnlocked: ids,
          updatedAt: new Date().toISOString(),
        }),
        '無法儲存成就資料。',
      ),
    [activeUser, replaceUser],
  )

  const setPreferredMode = useCallback(
    (mode: WorkMode) =>
      replaceUser(
        activeUser.id,
        (user) => ({
          ...user,
          preferredMode: mode,
          updatedAt: new Date().toISOString(),
        }),
        '無法儲存預設模式。',
      ),
    [activeUser, replaceUser],
  )

  const createUser = useCallback(
    (name: string): string | null => {
      const cleanName = normaliseName(name)
      const workspace = workspaceRef.current
      if (!cleanName) {
        notify('danger', '請輸入使用者名稱。')
        return null
      }
      if (
        workspace.users.some(
          (user) =>
            user.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
        )
      ) {
        notify('danger', '本機已有相同名稱的使用者。')
        return null
      }
      const user = createLocalUser(cleanName)
      const nextWorkspace = {
        ...workspace,
        users: [...workspace.users, user],
        activeUserId: user.id,
      }
      return persist(nextWorkspace, '無法建立使用者。') ? user.id : null
    },
    [notify, persist],
  )

  const renameUser = useCallback(
    (userId: string, name: string) => {
      const cleanName = normaliseName(name)
      if (!cleanName) return false
      return replaceUser(
        userId,
        (user) => ({
          ...user,
          name: cleanName,
          updatedAt: new Date().toISOString(),
        }),
        '無法重新命名使用者。',
      )
    },
    [replaceUser],
  )

  const deleteUser = useCallback(
    (userId: string) => {
      const workspace = workspaceRef.current
      if (workspace.users.length <= 1) {
        notify('warn', '至少需要保留一位本機使用者。')
        return false
      }
      if (!workspace.users.some((user) => user.id === userId)) return false
      const users = workspace.users.filter((user) => user.id !== userId)
      const activeUserId =
        workspace.activeUserId === userId
          ? users[0]!.id
          : workspace.activeUserId
      return persist({ version: 3, activeUserId, users }, '無法刪除使用者。')
    },
    [notify, persist],
  )

  const selectUser = useCallback(
    (userId: string) => {
      const workspace = workspaceRef.current
      if (!workspace.users.some((user) => user.id === userId)) return false
      return persist({ ...workspace, activeUserId: userId }, '無法切換使用者。')
    },
    [persist],
  )

  const createPlan = useCallback(
    (name: string): string | null => {
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      if (!currentUser) return null
      const quickDraft = currentUser.quickDraft
      if (!isProfileReady(quickDraft)) {
        notify('warn', '請先完成有效的 Quick 試算。')
        return null
      }
      const activePlan =
        currentUser.plans.find((plan) => plan.status === 'active') ?? null
      const latestWeight = activePlan
        ? latestWeightMeasurement(activePlan.diary)
        : null
      if (latestWeight && quickDraft.target >= latestWeight.weight) {
        notify('warn', '最新實測體重必須高於目標體重，請先調整 Quick 目標。')
        return null
      }
      const profile = latestWeight
        ? { ...quickDraft, weight: latestWeight.weight }
        : quickDraft
      const now = new Date()
      const archivedAt = now.toISOString()
      const plan = createPlanRecord(name, profile, { now })
      const saved = replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: [
            ...user.plans.map((existingPlan) =>
              existingPlan.status === 'active'
                ? {
                    ...existingPlan,
                    status: 'archived' as const,
                    archivedAt,
                    updatedAt: archivedAt,
                  }
                : existingPlan,
            ),
            plan,
          ],
          selectedPlanId: plan.id,
          preferredMode: 'diary',
          updatedAt: new Date().toISOString(),
        }),
        '無法建立精確計畫。',
      )
      return saved ? plan.id : null
    },
    [notify, replaceUser],
  )

  const renamePlan = useCallback(
    (planId: string, name: string) => {
      const cleanName = normaliseName(name)
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      const plan = currentUser?.plans.find((item) => item.id === planId)
      if (!cleanName || !currentUser || !plan) return false
      if (plan.status === 'archived') {
        notify('warn', '已封存計畫為唯讀，無法修改。')
        return false
      }
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: user.plans.map((item) =>
            item.id === planId
              ? {
                  ...item,
                  name: cleanName,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          updatedAt: new Date().toISOString(),
        }),
        '無法重新命名計畫。',
      )
    },
    [notify, replaceUser],
  )

  const selectPlan = useCallback(
    (planId: string) => {
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      if (!currentUser?.plans.some((plan) => plan.id === planId)) return false
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          selectedPlanId: planId,
          updatedAt: new Date().toISOString(),
        }),
        '無法切換計畫。',
      )
    },
    [replaceUser],
  )

  const archivePlan = useCallback(
    (planId: string) => {
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      const plan = currentUser?.plans.find((item) => item.id === planId)
      if (!currentUser || !plan || plan.status === 'archived') return false
      const now = new Date().toISOString()
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: user.plans.map((item) =>
            item.id === planId
              ? {
                  ...item,
                  status: 'archived' as const,
                  archivedAt: now,
                  updatedAt: now,
                }
              : item,
          ),
          updatedAt: now,
        }),
        '無法封存計畫。',
      )
    },
    [replaceUser],
  )

  const reactivatePlan = useCallback(
    (planId: string) => {
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      const targetPlan = currentUser?.plans.find((plan) => plan.id === planId)
      if (!currentUser || !targetPlan || targetPlan.status !== 'archived') {
        return false
      }
      const now = new Date().toISOString()
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: user.plans.map((plan) => {
            if (plan.id === planId) {
              return {
                ...plan,
                status: 'active' as const,
                archivedAt: null,
                updatedAt: now,
              }
            }
            return plan.status === 'active'
              ? {
                  ...plan,
                  status: 'archived' as const,
                  archivedAt: now,
                  updatedAt: now,
                }
              : plan
          }),
          selectedPlanId: planId,
          preferredMode: 'diary',
          updatedAt: now,
        }),
        '無法重新啟用計畫。',
      )
    },
    [replaceUser],
  )

  const deletePlan = useCallback(
    (planId: string) => {
      const workspace = workspaceRef.current
      const currentUser = workspace.users.find(
        (user) => user.id === workspace.activeUserId,
      )
      const targetPlan = currentUser?.plans.find((plan) => plan.id === planId)
      if (!currentUser || !targetPlan || targetPlan.status !== 'archived') {
        return false
      }
      const fallbackPlan =
        currentUser.plans.find((plan) => plan.status === 'active') ?? null
      const isSelected = currentUser.selectedPlanId === planId
      const now = new Date().toISOString()
      return replaceUser(
        currentUser.id,
        (user) => ({
          ...user,
          plans: user.plans
            .filter((plan) => plan.id !== planId)
            .map((plan) =>
              plan.sourcePlanId === planId
                ? { ...plan, sourcePlanId: null, updatedAt: now }
                : plan,
            ),
          selectedPlanId: isSelected
            ? (fallbackPlan?.id ?? null)
            : user.selectedPlanId,
          preferredMode: isSelected
            ? fallbackPlan
              ? 'diary'
              : 'quick'
            : user.preferredMode,
          updatedAt: now,
        }),
        '無法刪除封存計畫。',
      )
    },
    [replaceUser],
  )

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'remove-notification', id })
  }, [])

  const replaceData = useCallback(
    (data: ExportData) => {
      try {
        replaceStoredData(storage, data)
        workspaceRef.current = {
          version: 3,
          activeUserId: data.activeUserId,
          users: data.users,
        }
        dispatch({
          type: 'replace-workspace',
          workspace: workspaceRef.current,
        })
        return true
      } catch {
        notify('danger', '資料格式正確，但無法寫入本機儲存空間。')
        return false
      }
    },
    [notify, storage],
  )

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...state,
      activeUser,
      selectedPlan,
      profile: selectedPlan?.profile ?? null,
      quickDraft: activeUser.quickDraft,
      diary: selectedPlan?.diary ?? [],
      achievementsSeen: activeUser.achievementsSeen,
      prefMode: activeUser.preferredMode,
      setQuickDraft,
      setDiary,
      upsertDay,
      setAchievementsSeen,
      setAchievementsUnlocked,
      setPreferredMode,
      createUser,
      renameUser,
      deleteUser,
      selectUser,
      createPlan,
      renamePlan,
      selectPlan,
      archivePlan,
      reactivatePlan,
      deletePlan,
      notify,
      dismissNotification,
      replaceData,
    }),
    [
      activeUser,
      archivePlan,
      reactivatePlan,
      createPlan,
      createUser,
      deletePlan,
      deleteUser,
      dismissNotification,
      notify,
      renamePlan,
      renameUser,
      replaceData,
      selectPlan,
      selectUser,
      selectedPlan,
      setAchievementsSeen,
      setAchievementsUnlocked,
      setDiary,
      setPreferredMode,
      setQuickDraft,
      state,
      upsertDay,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}
