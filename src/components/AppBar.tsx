import { useAppData } from '../app/AppDataContext'
import type { PageName, WorkMode } from '../domain/types'
import { WorkspaceDrawer } from './WorkspaceDrawer'

interface AppBarProps {
  mode: PageName
  onModeChange: (mode: WorkMode) => void
  onImported: (mode: WorkMode | null) => void
  onOpenPlan: (planId: string) => void
  onStartPlan: () => void
  onUserSelected: () => void
}

export function AppBar({
  mode,
  onModeChange,
  onImported,
  onOpenPlan,
  onStartPlan,
  onUserSelected,
}: AppBarProps) {
  const { activeUser, selectedPlan } = useAppData()
  const isDiary = mode === 'diary'
  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <WorkspaceDrawer
          onOpenPlan={onOpenPlan}
          onStartPlan={onStartPlan}
          onUserSelected={onUserSelected}
          onImported={onImported}
        />
        <div className="app-bar-title">
          <span className="eyebrow">{activeUser.name}</span>
          <strong>
            {mode === 'home'
              ? 'TDEE Planner'
              : isDiary
                ? (selectedPlan?.name ?? '精細計算')
                : '快速計算'}
          </strong>
        </div>
        <div
          className={`mode-switch-wrap${mode === 'home' ? ' hidden' : ''}`}
          aria-label="切換計算模式"
        >
          <span className={!isDiary ? 'active' : ''}>快速</span>
          <button
            className={`mode-toggle${isDiary ? ' on' : ''}`}
            type="button"
            role="switch"
            aria-checked={isDiary}
            aria-label={isDiary ? '切換到快速計算' : '切換到精細計算'}
            onClick={() => onModeChange(isDiary ? 'quick' : 'diary')}
          >
            <span />
          </button>
          <span className={isDiary ? 'active' : ''}>精細</span>
        </div>
      </div>
    </header>
  )
}
