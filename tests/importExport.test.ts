import { describe, expect, it } from 'vitest'
import type { AppDataState } from '../src/domain/types'
import {
  createExportData,
  parseImportData,
  serialiseExportData,
} from '../src/storage/importExport'
import { legacyDiaryFixture } from './fixtures'
import {
  makeDiaryDay,
  makeExportData,
  makeLocalUser,
  makePlan,
  makeProfile,
} from './helpers/testData'

describe('JSON import and export', () => {
  it('round-trips version three workspace data', () => {
    const plan = makePlan({
      diary: [
        {
          date: '2026-08-11',
          actualWeightKg: 72.4,
          exerciseStatus: 'no',
          note: '',
          entries: [],
          updatedAt: '2026-08-11T03:00:00.000Z',
        },
      ],
    })
    const user = makeLocalUser({
      plans: [plan],
      selectedPlanId: plan.id,
      achievementsSeen: ['total:1'],
      achievementsUnlocked: ['total:1'],
    })
    const state: AppDataState = {
      version: 3,
      activeUserId: user.id,
      users: [user],
      notifications: [],
    }
    const parsed = parseImportData(serialiseExportData(createExportData(state)))
    expect(parsed.version).toBe(3)
    expect(parsed.users).toEqual([user])
    expect(parsed.activeUserId).toBe(user.id)
  })

  it('round-trips a complete multi-user workspace without dropping plan history', () => {
    const archivedPlan = makePlan({
      id: 'plan_archived',
      name: '封存計畫',
      status: 'archived',
      archivedAt: '2026-08-10T03:00:00.000Z',
      diary: [
        makeDiaryDay('2026-08-09', {
          actualWeightKg: 71.8,
          entries: [
            {
              id: 'food_complete',
              type: 'food',
              time: '12:00',
              label: '午餐',
              kcal: 520,
            },
            {
              id: 'exercise_complete',
              type: 'exercise',
              time: '18:00',
              presetId: 'walk',
              name: '走路',
              met: 3.5,
              minutes: 40,
              kcal: 160,
            },
          ],
        }),
      ],
    })
    const activePlan = makePlan({
      id: 'plan_active',
      name: '目前計畫',
      sourcePlanId: archivedPlan.id,
      diary: [makeDiaryDay('2026-08-11', { actualWeightKg: 71.2 })],
    })
    const firstUser = makeLocalUser({
      id: 'user_primary',
      name: '主要使用者',
      plans: [activePlan, archivedPlan],
      selectedPlanId: archivedPlan.id,
      preferredMode: 'diary',
      achievementsSeen: ['total:1'],
      achievementsUnlocked: ['total:1', 'streak:4'],
    })
    const secondUser = makeLocalUser({
      id: 'user_secondary',
      name: '第二使用者',
      quickDraft: makeProfile({ weight: 85, target: 70 }),
      plans: [],
      selectedPlanId: null,
      preferredMode: 'quick',
    })
    const state: AppDataState = {
      version: 3,
      activeUserId: secondUser.id,
      users: [firstUser, secondUser],
      notifications: [{ id: 'transient', type: 'ok', text: '不應匯出' }],
    }

    const parsed = parseImportData(serialiseExportData(createExportData(state)))

    expect(parsed).toMatchObject({
      version: 3,
      activeUserId: secondUser.id,
      users: [firstUser, secondUser],
    })
    expect(parsed).not.toHaveProperty('notifications')
  })

  it('fully validates the envelope before storage writes', () => {
    expect(() =>
      parseImportData(
        JSON.stringify({
          version: 1,
          exportedAt: '2026-08-11T03:00:00.000Z',
          profile: null,
          diary: [],
          achievementsSeen: 'invalid',
          prefMode: 'quick',
        }),
      ),
    ).toThrow('achievementsSeen')
  })

  it('accepts and migrates legacy diary entries during import', () => {
    const parsed = parseImportData(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-08-11T03:00:00.000Z',
        profile: null,
        diary: [legacyDiaryFixture],
        achievementsSeen: [],
        prefMode: null,
      }),
    )
    const migratedPlan = parsed.users[0]?.plans[0]
    expect(migratedPlan?.diary[0]?.entries).toHaveLength(2)
    expect(migratedPlan?.diary[0]?.actualWeightKg).toBeNull()
    expect(parsed.version).toBe(3)
  })

  it('strictly rejects invalid v3 diary entries instead of dropping them', () => {
    const day = makeDiaryDay('2026-08-11', {
      entries: [
        {
          id: 'invalid',
          type: 'food',
          time: '12:00',
          label: '飲食',
          kcal: Number.NaN,
        },
      ],
    })
    const plan = makePlan({ diary: [day] })
    const user = makeLocalUser({ plans: [plan], selectedPlanId: plan.id })

    expect(() =>
      parseImportData(
        JSON.stringify(
          makeExportData({
            activeUserId: user.id,
            users: [user],
          }),
        ),
      ),
    ).toThrow('plan diary 格式不正確')
  })

  it('rejects duplicate diary dates and duplicate entry IDs in v3', () => {
    const duplicateDay = makeDiaryDay('2026-08-11')
    const duplicateIdDay = makeDiaryDay('2026-08-12', {
      entries: [
        {
          id: 'same-entry',
          type: 'food',
          time: '12:00',
          label: '午餐',
          kcal: 500,
        },
        {
          id: 'same-entry',
          type: 'food',
          time: '18:00',
          label: '晚餐',
          kcal: 600,
        },
      ],
    })
    const duplicateDatePlan = makePlan({
      diary: [duplicateDay, duplicateDay],
    })
    const duplicateEntryPlan = makePlan({ diary: [duplicateIdDay] })

    for (const plan of [duplicateDatePlan, duplicateEntryPlan]) {
      const user = makeLocalUser({
        plans: [plan],
        selectedPlanId: plan.id,
      })
      expect(() =>
        parseImportData(
          JSON.stringify(
            makeExportData({
              activeUserId: user.id,
              users: [user],
            }),
          ),
        ),
      ).toThrow('plan diary 格式不正確')
    }
  })

  it('normalises unlocked achievement IDs to include every seen ID', () => {
    const user = makeLocalUser({
      achievementsSeen: ['total:1'],
      achievementsUnlocked: [],
    })
    const parsed = parseImportData(
      JSON.stringify(
        makeExportData({
          activeUserId: user.id,
          users: [user],
        }),
      ),
    )

    expect(parsed.users[0]?.achievementsUnlocked).toEqual(['total:1'])
  })

  it('ignores non-integer legacy achievement values during migration', () => {
    const parsed = parseImportData(
      JSON.stringify({
        version: 2,
        exportedAt: '2026-08-11T03:00:00.000Z',
        profile: null,
        diary: [],
        achievementsSeen: [1.5, 2],
        prefMode: null,
      }),
    )

    expect(parsed.users[0]?.achievementsSeen).toEqual(['total:2'])
  })

  it('rejects a v3 user with more than one active formal plan', () => {
    const firstPlan = makePlan({ id: 'plan_first' })
    const secondPlan = makePlan({ id: 'plan_second' })
    const user = makeLocalUser({
      plans: [firstPlan, secondPlan],
      selectedPlanId: firstPlan.id,
    })

    expect(() =>
      parseImportData(
        JSON.stringify(
          makeExportData({
            activeUserId: user.id,
            users: [user],
          }),
        ),
      ),
    ).toThrow('每位使用者只能有一個 active plan')
  })
})
