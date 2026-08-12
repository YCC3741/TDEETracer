import { describe, expect, it } from 'vitest'
import favicon from '../../favicon.svg?raw'
import indexDocument from '../../index.html?raw'

describe('favicon', () => {
  it('uses the theme-aware monochrome compass mark', () => {
    expect(indexDocument).toContain(
      '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />',
    )
    expect(favicon).toContain('viewBox="0 0 32 32"')
    expect(favicon).toContain('prefers-color-scheme: dark')
    expect(favicon).toContain('data-logo-part="compass"')
    expect(favicon).toContain('data-logo-part="start"')
    expect(favicon).toContain('data-logo-part="route"')
    expect(favicon).toContain('data-logo-part="goal"')
  })
})
