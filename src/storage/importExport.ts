import { DATA_EXPORT_VERSION } from '../domain/constants'
import { todayString } from '../domain/date'
import type { AppDataState, ExportData } from '../domain/types'
import { validateExportEnvelope } from '../domain/validation'
import { migrateLegacyExport, parseWorkspaceData } from './workspaceMigration'

export function createExportData(state: AppDataState): ExportData {
  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    activeUserId: state.activeUserId,
    users: state.users,
  }
}

export function serialiseExportData(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

export function parseImportData(json: string): ExportData {
  let raw: unknown
  try {
    raw = JSON.parse(json) as unknown
  } catch {
    throw new Error('JSON 無法解析')
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'version' in raw &&
    raw.version === DATA_EXPORT_VERSION
  ) {
    const workspace = parseWorkspaceData(raw)
    return {
      ...workspace,
      exportedAt:
        'exportedAt' in raw && typeof raw.exportedAt === 'string'
          ? raw.exportedAt
          : new Date().toISOString(),
    }
  }

  const envelope = validateExportEnvelope(raw)
  const workspace = migrateLegacyExport(
    envelope.profile,
    envelope.diary,
    envelope.achievementsSeen,
    envelope.prefMode,
  )
  return {
    ...workspace,
    exportedAt: envelope.exportedAt,
  }
}

export function downloadExportData(data: ExportData): void {
  const blob = new Blob([serialiseExportData(data)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `tdee-data-${todayString()}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function readImportFile(file: File): Promise<ExportData> {
  return parseImportData(await file.text())
}
