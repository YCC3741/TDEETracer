export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayString(now = new Date()): string {
  return toDateString(now)
}

export function addDays(base: Date, days: number): Date {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  return date
}

export function formatDisplayDate(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

export function durationText(days: number): string {
  const months = Math.floor(days / 30.44)
  const rest = Math.round(days - months * 30.44)
  if (months === 0) return `${rest} 天`
  return rest > 0 ? `${months} 個月又 ${rest} 天` : `${months} 個月`
}

export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

export function currentTimeString(now = new Date()): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
