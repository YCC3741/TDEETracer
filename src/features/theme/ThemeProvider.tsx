import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { ThemeContext } from './ThemeContext'
import {
  isTheme,
  readThemePreference,
  writeThemePreference,
  type Theme,
} from './themeStorage'

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

export interface ThemeMediaQuery {
  readonly matches: boolean
  addEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ): void
  removeEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ): void
}

interface ThemeProviderProps extends PropsWithChildren {
  storage?: Storage
  media?: ThemeMediaQuery
}

interface ThemeState {
  theme: Theme
  explicitPreference: Theme | null
}

function readDocumentTheme(): Theme | null {
  const value = document.documentElement.dataset.theme
  return isTheme(value) ? value : null
}

function resolveSystemTheme(media: ThemeMediaQuery): Theme {
  return media.matches ? 'dark' : 'light'
}

function applyDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({
  children,
  storage = window.localStorage,
  media,
}: ThemeProviderProps) {
  const mediaQuery = useMemo(
    () => media ?? window.matchMedia(DARK_MODE_QUERY),
    [media],
  )
  const [state, setState] = useState<ThemeState>(() => {
    const explicitPreference = readThemePreference(storage)
    return {
      explicitPreference,
      theme:
        explicitPreference ??
        readDocumentTheme() ??
        resolveSystemTheme(mediaQuery),
    }
  })

  useLayoutEffect(() => {
    applyDocumentTheme(state.theme)
  }, [state.theme])

  useEffect(() => {
    if (state.explicitPreference) return

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const theme = event.matches ? 'dark' : 'light'
      setState((current) => {
        if (current.explicitPreference) return current
        applyDocumentTheme(theme)
        return {
          explicitPreference: null,
          theme,
        }
      })
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () =>
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [mediaQuery, state.explicitPreference])

  const toggleTheme = useCallback(() => {
    const theme = state.theme === 'dark' ? 'light' : 'dark'
    writeThemePreference(storage, theme)
    applyDocumentTheme(theme)
    setState({ explicitPreference: theme, theme })
  }, [state.theme, storage])

  const value = useMemo(
    () => ({ theme: state.theme, toggleTheme }),
    [state.theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
