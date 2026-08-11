export class TestStorage implements Storage {
  private readonly values = new Map<string, string>()
  private failedKey: string | null = null

  constructor(initial: Record<string, string> = {}) {
    Object.entries(initial).forEach(([key, value]) =>
      this.values.set(key, value),
    )
  }

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  failWritesFor(key: string | null): void {
    this.failedKey = key
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    if (this.failedKey === key || this.failedKey === '*') {
      throw new Error(`Storage write failed for ${key}`)
    }
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    if (this.failedKey === key || this.failedKey === '*') {
      throw new Error(`Storage write failed for ${key}`)
    }
    this.values.set(key, value)
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.values)
  }
}
