import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { AppDataProvider } from '../../src/app/AppDataProvider'
import { ThemeProvider } from '../../src/features/theme/ThemeProvider'
import { TestStorage } from './TestStorage'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  storage?: TestStorage
}

export function renderWithAppData(ui: ReactElement, options: Options = {}) {
  const { storage = new TestStorage(), ...renderOptions } = options
  const result = render(
    <ThemeProvider>
      <AppDataProvider storage={storage}>{ui}</AppDataProvider>
    </ThemeProvider>,
    renderOptions,
  )
  return { ...result, storage }
}
