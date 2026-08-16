import { describe, expect, it } from 'vitest'
import { DATA_EXPORT_VERSION } from '../src/domain/constants'
import { parseImportData } from '../src/storage/importExport'
import workspaceV3 from './fixtures/workspace-v3.json'

/**
 * One frozen payload per retired shape. These files never change: they are the
 * evidence that lets a migration step be deleted one day, and the alarm if a
 * step stops handling the shape it was written for.
 */
describe('frozen payloads still import', () => {
  it('reads a third-version export and names its activity levels', () => {
    const data = parseImportData(JSON.stringify(workspaceV3))
    const user = data.users[0]!
    const plan = user.plans[0]!

    expect(data.version).toBe(DATA_EXPORT_VERSION)
    expect(user.quickDraft?.activityLevel).toBe('light')
    expect(plan.profile?.activityLevel).toBe('extreme')
  })

  it('keeps everything else in a third-version export intact', () => {
    const data = parseImportData(JSON.stringify(workspaceV3))
    const plan = data.users[0]!.plans[0]!
    const day = plan.diary[0]!

    expect(plan.profile?.deficit).toBe(500)
    expect(day.actualWeightKg).toBe(91.8)
    expect(day.entries).toHaveLength(2)
    expect(data.users[0]!.achievementsUnlocked).toEqual(['total:1'])
  })
})
