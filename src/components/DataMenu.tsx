import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { useAppData } from '../app/AppDataContext'
import type { WorkMode } from '../domain/types'
import {
  createExportData,
  downloadExportData,
  readImportFile,
} from '../storage/importExport'

interface DataMenuProps {
  onImported: (mode: WorkMode | null) => void
}

export function DataMenu({ onImported }: DataMenuProps) {
  const appData = useAppData()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    firstItemRef.current?.focus()

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const exportData = () => {
    setOpen(false)
    downloadExportData(createExportData(appData))
    appData.notify('ok', '已匯出本機資料 JSON。')
  }

  const chooseImportFile = () => {
    setOpen(false)
    inputRef.current?.click()
  }

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm('匯入會覆寫目前本機的個人資料與日記，確定繼續？')) {
      return
    }
    try {
      const data = await readImportFile(file)
      if (!appData.replaceData(data)) return
      const importedUser = data.users.find(
        (user) => user.id === data.activeUserId,
      )
      onImported(importedUser?.preferredMode ?? null)
      appData.notify('ok', '已匯入資料並套用。')
    } catch (error) {
      const message = error instanceof Error ? error.message : '無法讀取檔案'
      appData.notify('danger', `匯入失敗：${message}`)
    }
  }

  return (
    <div className="data-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        className="data-menu-trigger"
        type="button"
        aria-label="開啟資料選單"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {open ? (
        <div className="data-menu-popup" id={menuId} role="menu">
          <span className="data-menu-label">Data</span>
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={exportData}
          >
            匯出資料 JSON
          </button>
          <button type="button" role="menuitem" onClick={chooseImportFile}>
            匯入資料 JSON
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        className="data-menu-input"
        type="file"
        accept="application/json,.json"
        onChange={importData}
      />
    </div>
  )
}
