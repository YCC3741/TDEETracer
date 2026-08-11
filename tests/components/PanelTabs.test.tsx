import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SimulationResult } from '../../src/domain/types'
import { DiaryOverviewPanel } from '../../src/features/diary/DiaryOverviewPanel'
import { ProjectionPanel } from '../../src/features/projection/ProjectionPanel'
import { makeProfile } from '../helpers/testData'

const simulation: SimulationResult = {
  daily: [75, 74.9],
  dayMeta: [],
  days: 1,
  reached: false,
  plateaued: false,
  finalWeight: 72.9,
}

describe('panel tab keyboard navigation', () => {
  it('uses roving focus with Arrow, Home and End in projection tabs', async () => {
    const user = userEvent.setup()
    render(
      <ProjectionPanel
        profile={makeProfile()}
        simulation={simulation}
        startDate={new Date('2026-08-11T08:00:00')}
        contentTabs={[
          {
            label: '預估減重路程',
            eyebrow: 'Summary',
            title: '預估減重路程',
            content: <p>摘要</p>,
          },
        ]}
      />,
    )
    const summaryTab = screen.getByRole('tab', { name: '預估減重路程' })
    const chartTab = screen.getByRole('tab', { name: '體重曲線' })
    const tableTab = screen.getByRole('tab', { name: '每月預估' })

    summaryTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(chartTab).toHaveFocus()
    expect(chartTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{End}')
    expect(tableTab).toHaveFocus()
    expect(tableTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(summaryTab).toHaveFocus()
    expect(summaryTab).toHaveAttribute('aria-selected', 'true')
    expect(chartTab).toHaveAttribute('tabindex', '-1')
  })

  it('switches diary overview tabs with horizontal arrow keys', async () => {
    const user = userEvent.setup()
    render(
      <DiaryOverviewPanel
        year={2026}
        month={7}
        selectedDate="2026-08-11"
        diary={[]}
        checkinDays={0}
        longestStreak={0}
        unlockedIds={[]}
        onSelectDate={vi.fn()}
        onMonthChange={vi.fn()}
      />,
    )
    const calendarTab = screen.getByRole('tab', { name: '簽到日曆' })
    const achievementsTab = screen.getByRole('tab', { name: '簽到成就' })

    calendarTab.focus()
    await user.keyboard('{ArrowRight}')
    expect(achievementsTab).toHaveFocus()
    expect(achievementsTab).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(calendarTab).toHaveFocus()
    expect(calendarTab).toHaveAttribute('aria-selected', 'true')
  })
})
