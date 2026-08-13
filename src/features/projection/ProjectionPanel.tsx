import { useId, useState, type ReactNode } from 'react'
import { MonthlyProjectionTable } from '../../components/MonthlyProjectionTable'
import { WeightChart } from '../../components/WeightChart'
import { handleTabListKeyDown } from '../../components/tabKeyboard'
import type {
  Profile,
  SimulationResult,
  WeightMeasurement,
} from '../../domain/types'

type ProjectionView = `content-${number}` | 'chart' | 'table'

export interface ProjectionContentTab {
  label: string
  eyebrow: string
  title: string
  content: ReactNode
}

interface ProjectionPanelProps {
  profile: Profile
  simulation: SimulationResult
  startDate: Date
  showSource?: boolean
  title?: string
  contentTabs?: ProjectionContentTab[]
  measurements?: WeightMeasurement[]
}

export function ProjectionPanel({
  profile,
  simulation,
  startDate,
  showSource = false,
  title = '體重變化預估',
  contentTabs = [],
  measurements = [],
}: ProjectionPanelProps) {
  const [view, setView] = useState<ProjectionView>(
    contentTabs.length ? 'content-0' : 'chart',
  )
  const panelId = useId()
  const contentIndex = view.startsWith('content-')
    ? Number(view.replace('content-', ''))
    : -1
  const activeContent = contentTabs[contentIndex]
  const activeView =
    activeContent || view === 'chart' || view === 'table' ? view : 'chart'
  const tabs: Array<{ id: ProjectionView; label: string }> = []

  contentTabs.forEach((tab, index) => {
    tabs.push({ id: `content-${index}`, label: tab.label })
  })
  tabs.push(
    { id: 'chart', label: '體重曲線' },
    { id: 'table', label: '每月預估' },
  )

  const eyebrow = activeContent
    ? activeContent.eyebrow
    : activeView === 'chart'
      ? 'Projection'
      : 'Monthly forecast'
  const heading = activeContent
    ? activeContent.title
    : activeView === 'chart'
      ? title
      : '每月預估'

  return (
    <section className="card projection-card layered-projection layered-panel-shell">
      <header className="section-head projection-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{heading}</h2>
        </div>
        <div
          className="panel-tabs layered-ribbon-tabs"
          role="tablist"
          aria-label="預測顯示方式"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              id={`${panelId}-${tab.id}-tab`}
              className={activeView === tab.id ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={activeView === tab.id}
              aria-controls={`${panelId}-${tab.id}-panel`}
              tabIndex={activeView === tab.id ? 0 : -1}
              onClick={() => setView(tab.id)}
              onKeyDown={(event) =>
                handleTabListKeyDown(event, index, tabs.length, (nextIndex) =>
                  setView(tabs[nextIndex]!.id),
                )
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div
        id={`${panelId}-${activeView}-panel`}
        role="tabpanel"
        aria-labelledby={`${panelId}-${activeView}-tab`}
      >
        {activeContent ? (
          activeContent.content
        ) : activeView === 'chart' ? (
          <WeightChart
            simulation={simulation}
            startDate={startDate}
            label={
              measurements.length
                ? showSource
                  ? '更新後預估＋日記'
                  : '更新後預估'
                : showSource
                  ? '計畫＋日記'
                  : '預估體重'
            }
            measurements={measurements}
          />
        ) : (
          <MonthlyProjectionTable
            simulation={simulation}
            profile={profile}
            startDate={startDate}
            showSource={showSource}
          />
        )}
      </div>
    </section>
  )
}
