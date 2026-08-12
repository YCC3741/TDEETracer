import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeToggle } from '../../src/components/ThemeToggle'
import { ThemeProvider } from '../../src/features/theme/ThemeProvider'
import { STORAGE_THEME } from '../../src/features/theme/themeStorage'
import { TestMediaQuery } from '../helpers/TestMediaQuery'
import { TestStorage } from '../helpers/TestStorage'

describe('ThemeToggle', () => {
  it('exposes state and persists keyboard interaction', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    const media = new TestMediaQuery(false)

    render(
      <ThemeProvider storage={storage} media={media}>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const toggle = screen.getByRole('button', { name: '夜間模式' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()

    toggle.focus()
    await user.keyboard('{Enter}')

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(storage.getItem(STORAGE_THEME)).toBe('dark')

    act(() => media.setMatches(false))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(storage.getItem(STORAGE_THEME)).toBe('light')
  })
})
