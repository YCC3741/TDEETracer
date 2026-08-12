import type { ThemeMediaQuery } from '../../src/features/theme/ThemeProvider'

export class TestMediaQuery implements ThemeMediaQuery {
  readonly media = '(prefers-color-scheme: dark)'
  private readonly listeners = new Set<(event: MediaQueryListEvent) => void>()

  constructor(public matches: boolean) {}

  addEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ) {
    if (type === 'change') this.listeners.add(listener)
  }

  removeEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
  ) {
    if (type === 'change') this.listeners.delete(listener)
  }

  setMatches(matches: boolean) {
    this.matches = matches
    const event = new Event('change') as MediaQueryListEvent
    Object.defineProperties(event, {
      matches: { value: matches },
      media: { value: this.media },
    })
    this.listeners.forEach((listener) => listener(event))
  }
}
