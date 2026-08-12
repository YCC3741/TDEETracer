import type { PageName, WorkMode } from '../domain/types'
import { BrandMark } from './BrandMark'
import { MobileNavigation } from './MobileNavigation'
import { ThemeToggle } from './ThemeToggle'
import { WorkspaceDrawer } from './WorkspaceDrawer'

interface AppBarProps {
  mode: PageName
  onHome: () => void
  onModeChange: (mode: WorkMode) => void
  onImported: (mode: WorkMode | null) => void
  onOpenPlan: (planId: string) => void
  onStartPlan: () => void
  onRestartTour: () => void
  onUserSelected: () => void
}

export function AppBar({
  mode,
  onHome,
  onModeChange,
  onImported,
  onOpenPlan,
  onStartPlan,
  onRestartTour,
  onUserSelected,
}: AppBarProps) {
  const workspaceProps = {
    onOpenPlan,
    onStartPlan,
    onRestartTour,
    onUserSelected,
    onImported,
  }

  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <div className="app-bar-leading">
          <button
            className="app-brand"
            type="button"
            aria-label="前往首頁"
            onClick={onHome}
          >
            <BrandMark className="app-brand-mark" />
            <span>
              <strong>TDEETracer</strong>
              <small>Future route planner</small>
            </span>
          </button>
          <WorkspaceDrawer {...workspaceProps} />
        </div>

        <nav
          className="page-tabs-nav"
          aria-label="主要導覽"
          data-tour-anchor="mode-switch"
        >
          <button
            className={mode === 'quick' ? 'active' : ''}
            type="button"
            aria-label="前往快速規劃"
            aria-current={mode === 'quick' ? 'page' : undefined}
            onClick={() => onModeChange('quick')}
          >
            快速規劃
          </button>
          <button
            className={mode === 'diary' ? 'active' : ''}
            type="button"
            aria-label="前往追蹤日誌"
            aria-current={mode === 'diary' ? 'page' : undefined}
            onClick={() => onModeChange('diary')}
          >
            追蹤日誌
          </button>
        </nav>

        <div className="app-bar-actions">
          <ThemeToggle />
          <MobileNavigation
            onHome={onHome}
            onModeChange={onModeChange}
            workspaceEntry={<WorkspaceDrawer {...workspaceProps} />}
          />
        </div>
      </div>
    </header>
  )
}
