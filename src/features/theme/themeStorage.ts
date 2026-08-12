export const STORAGE_THEME = 'tdee_theme_v1'

export type Theme = 'light' | 'dark'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function readThemePreference(storage: Storage): Theme | null {
  try {
    const value = storage.getItem(STORAGE_THEME)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

export function writeThemePreference(storage: Storage, theme: Theme): boolean {
  try {
    storage.setItem(STORAGE_THEME, theme)
    return true
  } catch {
    return false
  }
}
