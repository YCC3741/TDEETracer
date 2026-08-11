import { describe, expect, it } from 'vitest'
import { STORAGE_PROFILE, STORAGE_WORKSPACE } from '../src/domain/constants'
import {
  loadInitialData,
  replaceStoredData,
} from '../src/storage/localStorageRepository'
import { femaleProfileFixture } from './fixtures'
import { makeExportData } from './helpers/testData'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()
  private failAfterWriteKey: string | null = null

  failNextWriteAfterMutation(key: string): void {
    this.failAfterWriteKey = key
  }

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
    if (this.failAfterWriteKey === key) {
      this.failAfterWriteKey = null
      throw new Error(`Storage write failed after mutation for ${key}`)
    }
  }
}

describe('local storage repository', () => {
  it('round-trips a version three workspace', () => {
    const storage = new MemoryStorage()
    const data = makeExportData()

    replaceStoredData(storage, data)
    const loaded = loadInitialData(storage)

    expect(loaded.activeUserId).toBe(data.activeUserId)
    expect(loaded.users).toEqual(data.users)
    expect(storage.getItem(STORAGE_WORKSPACE)).not.toBeNull()
  })

  it('persists a stable plan date when loading a legacy profile', () => {
    const storage = new MemoryStorage()
    const legacyProfile = {
      ...femaleProfileFixture,
      planStartedAt: undefined,
    }
    storage.setItem(STORAGE_PROFILE, JSON.stringify(legacyProfile))

    const loaded = loadInitialData(storage)

    const migratedProfile = loaded.users[0]?.quickDraft
    expect(migratedProfile?.planStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(
      JSON.parse(storage.getItem(STORAGE_PROFILE) ?? 'null').planStartedAt,
    ).toBe(migratedProfile?.planStartedAt)
  })

  it('keeps legacy migration idempotent and does not overwrite v3 on reload', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_PROFILE, JSON.stringify(femaleProfileFixture))

    const first = loadInitialData(storage)
    const firstWorkspace = storage.getItem(STORAGE_WORKSPACE)
    const second = loadInitialData(storage)

    expect(second.users).toEqual(first.users)
    expect(storage.getItem(STORAGE_WORKSPACE)).toBe(firstWorkspace)
    expect(storage.getItem(STORAGE_PROFILE)).toBe(
      JSON.stringify(femaleProfileFixture),
    )
  })

  it('never revives stale legacy data when an existing v3 document is malformed', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_WORKSPACE, '{malformed')
    storage.setItem(STORAGE_PROFILE, JSON.stringify(femaleProfileFixture))

    expect(() => loadInitialData(storage)).toThrow('workspace JSON 無法解析')
    expect(storage.getItem(STORAGE_WORKSPACE)).toBe('{malformed')
  })

  it('restores the previous workspace when storage fails after mutation', () => {
    const storage = new MemoryStorage()
    const previous = makeExportData()
    replaceStoredData(storage, previous)
    const previousWorkspace = storage.getItem(STORAGE_WORKSPACE)
    const replacement = makeExportData({
      activeUserId: previous.activeUserId,
      users: [
        {
          ...previous.users[0]!,
          name: '不應留下',
        },
      ],
    })
    storage.failNextWriteAfterMutation(STORAGE_WORKSPACE)

    expect(() => replaceStoredData(storage, replacement)).toThrow(
      'Storage write failed after mutation',
    )
    expect(storage.getItem(STORAGE_WORKSPACE)).toBe(previousWorkspace)
  })
})
