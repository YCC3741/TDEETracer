import { createContext, useContext } from 'react'
import type { Theme } from './themeStorage'

export interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function useCurrentTheme(): Theme {
  const context = useContext(ThemeContext)
  if (context) return context.theme
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}
