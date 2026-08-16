import { describe, expect, it } from 'vitest'
import { DATA_EXPORT_VERSION } from '../../src/domain/constants'
import {
  upgradeProfileShape,
  upgradeWorkspaceShape,
} from '../../src/storage/schemaMigrations'

function v3Profile(factor: number): Record<string, unknown> {
  return {
    sex: 'female',
    age: 30,
    height: 170,
    weight: 75,
    target: 65,
    factor,
    intake: 1500,
    deficit: null,
    mode: 'intake',
    planStartedAt: '2026-08-11',
  }
}

function v3Workspace(factor: number): Record<string, unknown> {
  return {
    version: 3,
    activeUserId: 'u1',
    users: [
      {
        id: 'u1',
        name: '我的資料',
        quickDraft: v3Profile(factor),
        plans: [{ id: 'p1', name: '主要計畫', profile: v3Profile(factor) }],
      },
    ],
  }
}

function firstProfiles(raw: unknown): Record<string, unknown>[] {
  const workspace = raw as {
    users: {
      quickDraft: Record<string, unknown>
      plans: { profile: Record<string, unknown> }[]
    }[]
  }
  const user = workspace.users[0]!
  return [user.quickDraft, user.plans[0]!.profile]
}

describe('workspace schema chain', () => {
  it('names the activity level and drops the stored multiplier', () => {
    const upgraded = upgradeWorkspaceShape(v3Workspace(1.375))

    expect((upgraded as { version: number }).version).toBe(DATA_EXPORT_VERSION)
    firstProfiles(upgraded).forEach((profile) => {
      expect(profile.activityLevel).toBe('light')
      expect(profile).not.toHaveProperty('factor')
      expect(profile.weight).toBe(75)
    })
  })

  it('maps every multiplier the old form could store', () => {
    const expected: Array<[number, string]> = [
      [1, 'resting'],
      [1.2, 'sedentary'],
      [1.375, 'light'],
      [1.55, 'moderate'],
      [1.725, 'high'],
      [1.9, 'extreme'],
    ]

    expected.forEach(([factor, id]) => {
      const [quickDraft] = firstProfiles(
        upgradeWorkspaceShape(v3Workspace(factor)),
      )
      expect(quickDraft!.activityLevel).toBe(id)
    })
  })

  it('settles an imported multiplier that is off the ladder on its nearest level', () => {
    const [quickDraft] = firstProfiles(upgradeWorkspaceShape(v3Workspace(1.5)))
    expect(quickDraft!.activityLevel).toBe('moderate')
  })

  it('leaves a payload that already matches this build alone', () => {
    const current = {
      version: DATA_EXPORT_VERSION,
      activeUserId: 'u1',
      users: [],
    }
    expect(upgradeWorkspaceShape(current)).toEqual(current)
  })

  it('refuses a payload written by a newer build', () => {
    expect(() =>
      upgradeWorkspaceShape({ version: DATA_EXPORT_VERSION + 1, users: [] }),
    ).toThrow('不支援的資料版本')
  })

  it('hands a payload without a version to the legacy path untouched', () => {
    const legacy = { profile: null, diary: [] }
    expect(upgradeWorkspaceShape(legacy)).toBe(legacy)
  })

  it('upgrades a lone profile for the pre-workspace entry points', () => {
    const upgraded = upgradeProfileShape(v3Profile(1.725)) as Record<
      string,
      unknown
    >
    expect(upgraded.activityLevel).toBe('high')
    expect(upgraded).not.toHaveProperty('factor')
  })

  it('passes a profile it cannot read straight through', () => {
    expect(upgradeProfileShape(null)).toBeNull()
    expect(upgradeProfileShape({ sex: 'female' })).toEqual({ sex: 'female' })
  })
})
