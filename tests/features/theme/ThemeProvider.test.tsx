import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../../src/features/theme/ThemeProvider'
import { useTheme } from '../../../src/features/theme/ThemeContext'
import { STORAGE_THEME } from '../../../src/features/theme/themeStorage'
import { TestMediaQuery } from '../../helpers/TestMediaQuery'
import { TestStorage } from '../../helpers/TestStorage'

function ThemeProbe() {
  const { theme } = useTheme()
  return <output aria-label="目前主題">{theme}</output>
}

describe('ThemeProvider', () => {
  it('uses a stored preference before the system preference', () => {
    const storage = new TestStorage({ [STORAGE_THEME]: 'dark' })
    const media = new TestMediaQuery(false)

    render(
      <ThemeProvider storage={storage} media={media}>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByLabelText('目前主題')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('follows system changes until the user sets an explicit preference', () => {
    const storage = new TestStorage()
    const media = new TestMediaQuery(false)

    render(
      <ThemeProvider storage={storage} media={media}>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByLabelText('目前主題')).toHaveTextContent('light')

    act(() => media.setMatches(true))

    expect(screen.getByLabelText('目前主題')).toHaveTextContent('dark')
    expect(storage.getItem(STORAGE_THEME)).toBeNull()
  })
})
