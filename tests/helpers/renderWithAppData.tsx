import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { AppDataProvider } from '../../src/app/AppDataProvider'
import { TestStorage } from './TestStorage'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  storage?: TestStorage
}

export function renderWithAppData(ui: ReactElement, options: Options = {}) {
  const { storage = new TestStorage(), ...renderOptions } = options
  const result = render(
    <AppDataProvider storage={storage}>{ui}</AppDataProvider>,
    renderOptions,
  )
  return { ...result, storage }
}
