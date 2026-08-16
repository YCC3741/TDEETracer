import { DATA_EXPORT_VERSION } from '../../src/domain/constants'
import type {
  DiaryDay,
  ExportData,
  LocalUser,
  PlanRecord,
  Profile,
} from '../../src/domain/types'

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    sex: 'female',
    age: 30,
    height: 170,
    weight: 75,
    target: 65,
    activityLevel: 'light',
    intake: 1500,
    deficit: null,
    mode: 'intake',
    planStartedAt: '2026-08-11',
    ...overrides,
  }
}

export function makeDiaryDay(
  date: string,
  overrides: Partial<DiaryDay> = {},
): DiaryDay {
  return {
    date,
    actualWeightKg: null,
    exerciseStatus: 'no',
    note: '',
    entries: [
      {
        id: `${date}_food`,
        type: 'food',
        time: '12:00',
        label: '飲食',
        kcal: 500,
        protein: null,
      },
    ],
    updatedAt: '2026-08-11T03:00:00.000Z',
    ...overrides,
  }
}

export function makeExportData(
  overrides: Partial<ExportData> = {},
): ExportData {
  const user = makeLocalUser()
  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: '2026-08-11T03:00:00.000Z',
    activeUserId: user.id,
    users: [user],
    ...overrides,
  }
}

export function makePlan(overrides: Partial<PlanRecord> = {}): PlanRecord {
  return {
    id: 'plan_test',
    name: '測試計畫',
    status: 'active',
    profile: makeProfile(),
    diary: [],
    sourcePlanId: null,
    createdAt: '2026-08-11T03:00:00.000Z',
    updatedAt: '2026-08-11T03:00:00.000Z',
    archivedAt: null,
    ...overrides,
  }
}

export function makeLocalUser(overrides: Partial<LocalUser> = {}): LocalUser {
  const plan = makePlan()
  return {
    id: 'user_test',
    name: '我的資料',
    quickDraft: makeProfile(),
    plans: [plan],
    selectedPlanId: plan.id,
    preferredMode: 'quick',
    achievementsSeen: [],
    achievementsUnlocked: [],
    createdAt: '2026-08-11T03:00:00.000Z',
    updatedAt: '2026-08-11T03:00:00.000Z',
    ...overrides,
  }
}
