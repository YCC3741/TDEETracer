import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_THEME,
  readThemePreference,
  writeThemePreference,
} from '../../../src/features/theme/themeStorage'
import { TestStorage } from '../../helpers/TestStorage'

describe('theme storage', () => {
  it('reads only supported explicit theme preferences', () => {
    expect(readThemePreference(new TestStorage())).toBeNull()
    expect(
      readThemePreference(new TestStorage({ [STORAGE_THEME]: 'light' })),
    ).toBe('light')
    expect(
      readThemePreference(new TestStorage({ [STORAGE_THEME]: 'dark' })),
    ).toBe('dark')
    expect(
      readThemePreference(new TestStorage({ [STORAGE_THEME]: 'sepia' })),
    ).toBeNull()
  })

  it('does not throw when storage reads or writes fail', () => {
    const storage = new TestStorage()
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked')
    })

    expect(readThemePreference(storage)).toBeNull()

    vi.restoreAllMocks()
    storage.failWritesFor(STORAGE_THEME)
    expect(writeThemePreference(storage, 'dark')).toBe(false)
  })

  it('persists a valid preference for future reloads', () => {
    const storage = new TestStorage()

    expect(writeThemePreference(storage, 'dark')).toBe(true)
    expect(readThemePreference(storage)).toBe('dark')
  })
})
