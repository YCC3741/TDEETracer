import { describe, expect, it } from 'vitest'
import {
  STORAGE_GUIDED_TOUR,
  clearTourPreference,
  readTourPreference,
  writeTourPreference,
} from '../../../src/features/tour/tourStorage'
import { TestStorage } from '../../helpers/TestStorage'

describe('guided tour storage', () => {
  it('reads only supported completed or skipped preferences', () => {
    const completed = new TestStorage({
      [STORAGE_GUIDED_TOUR]: JSON.stringify({
        version: 1,
        status: 'completed',
      }),
    })
    const skipped = new TestStorage({
      [STORAGE_GUIDED_TOUR]: JSON.stringify({
        version: 1,
        status: 'skipped',
      }),
    })

    expect(readTourPreference(completed)).toBe('completed')
    expect(readTourPreference(skipped)).toBe('skipped')
    expect(
      readTourPreference(
        new TestStorage({ [STORAGE_GUIDED_TOUR]: '{invalid' }),
      ),
    ).toBeNull()
    expect(
      readTourPreference(
        new TestStorage({
          [STORAGE_GUIDED_TOUR]: JSON.stringify({
            version: 2,
            status: 'completed',
          }),
        }),
      ),
    ).toBeNull()
  })

  it('writes and clears preferences without throwing on storage failures', () => {
    const storage = new TestStorage()

    expect(writeTourPreference(storage, 'completed')).toBe(true)
    expect(readTourPreference(storage)).toBe('completed')
    expect(clearTourPreference(storage)).toBe(true)
    expect(readTourPreference(storage)).toBeNull()

    storage.failWritesFor(STORAGE_GUIDED_TOUR)
    expect(writeTourPreference(storage, 'skipped')).toBe(false)
    expect(clearTourPreference(storage)).toBe(false)
  })
})
