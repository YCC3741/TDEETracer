import { Dialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import type { WorkMode } from '../domain/types'

interface MobileNavigationProps {
  onHome: () => void
  onModeChange: (mode: WorkMode) => void
  workspaceEntry: ReactNode
}

export function MobileNavigation({
  onHome,
  onModeChange,
  workspaceEntry,
}: MobileNavigationProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="mobile-menu-trigger"
        aria-label="開啟行動版選單"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="mobile-menu-backdrop" />
        <Dialog.Popup className="mobile-menu-popup">
          <header className="mobile-menu-head">
            <Dialog.Title>行動版導覽</Dialog.Title>
            <Dialog.Close aria-label="關閉行動版選單">×</Dialog.Close>
          </header>

          <nav className="mobile-page-nav" aria-label="頁面導覽">
            <Dialog.Close
              render={
                <button type="button" aria-label="前往首頁" onClick={onHome}>
                  首頁
                </button>
              }
            />
            <Dialog.Close
              render={
                <button
                  type="button"
                  aria-label="前往快速規劃"
                  onClick={() => onModeChange('quick')}
                >
                  快速規劃
                </button>
              }
            />
            <Dialog.Close
              render={
                <button
                  type="button"
                  aria-label="前往追蹤日誌"
                  onClick={() => onModeChange('diary')}
                >
                  追蹤日誌
                </button>
              }
            />
          </nav>

          <section className="mobile-workspace-entry">
            <span>工作區</span>
            {workspaceEntry}
          </section>

          <div className="mobile-local-data-status">
            <span aria-hidden="true" />
            資料只保留在目前裝置
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
