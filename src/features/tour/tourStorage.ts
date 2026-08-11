export const STORAGE_GUIDED_TOUR = 'tdee_guided_tour_v1'

export type TourPreference = 'completed' | 'skipped'

interface StoredTourPreference {
  version: 1
  status: TourPreference
}

export function readTourPreference(storage: Storage): TourPreference | null {
  try {
    const raw = storage.getItem(STORAGE_GUIDED_TOUR)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<StoredTourPreference>
    if (
      value.version === 1 &&
      (value.status === 'completed' || value.status === 'skipped')
    ) {
      return value.status
    }
  } catch {
    return null
  }
  return null
}

export function writeTourPreference(
  storage: Storage,
  status: TourPreference,
): boolean {
  try {
    const value: StoredTourPreference = { version: 1, status }
    storage.setItem(STORAGE_GUIDED_TOUR, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearTourPreference(storage: Storage): boolean {
  try {
    storage.removeItem(STORAGE_GUIDED_TOUR)
    return true
  } catch {
    return false
  }
}
