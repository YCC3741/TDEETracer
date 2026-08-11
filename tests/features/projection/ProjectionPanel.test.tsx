import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { simulateWeightPath } from '../../../src/domain/projection'
import { ProjectionPanel } from '../../../src/features/projection/ProjectionPanel'
import { makeProfile } from '../../helpers/testData'

describe('ProjectionPanel tabs', () => {
  it('switches chart and monthly table inside one frame', async () => {
    const user = userEvent.setup()
    const profile = makeProfile()
    const startDate = new Date('2026-08-11T08:00:00')
    const simulation = simulateWeightPath(profile, { startDate })

    render(
      <ProjectionPanel
        profile={profile}
        simulation={simulation}
        startDate={startDate}
        title="體重下降曲線"
      />,
    )

    const chartTab = screen.getByRole('tab', { name: '體重曲線' })
    const tableTab = screen.getByRole('tab', { name: '每月預估' })
    expect(chartTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: '體重下降曲線' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(tableTab)

    expect(tableTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: '每月預估' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()

    await user.click(chartTab)
    expect(chartTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('supports custom content tabs before the projection views', async () => {
    const user = userEvent.setup()
    const profile = makeProfile()
    const startDate = new Date('2026-08-11T08:00:00')
    const simulation = simulateWeightPath(profile, { startDate })

    render(
      <ProjectionPanel
        profile={profile}
        simulation={simulation}
        startDate={startDate}
        contentTabs={[
          {
            label: '預估減重路程',
            eyebrow: 'Your route',
            title: '預估減重路程',
            content: <p>路程摘要內容</p>,
          },
          {
            label: 'TDEE 看板',
            eyebrow: 'All activity levels',
            title: '各活動量 TDEE 看板',
            content: <p>TDEE 摘要內容</p>,
          },
        ]}
      />,
    )

    const tabs = screen.getAllByRole('tab')
    const routeTab = screen.getByRole('tab', { name: '預估減重路程' })
    const tdeeTab = screen.getByRole('tab', { name: 'TDEE 看板' })
    const chartTab = screen.getByRole('tab', { name: '體重曲線' })

    expect(tabs).toHaveLength(4)
    expect(routeTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: '預估減重路程' }),
    ).toBeInTheDocument()
    expect(screen.getByText('路程摘要內容')).toBeInTheDocument()

    await user.click(tdeeTab)
    expect(tdeeTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('TDEE 摘要內容')).toBeInTheDocument()

    await user.click(chartTab)

    expect(chartTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('路程摘要內容')).not.toBeInTheDocument()
    expect(screen.queryByText('TDEE 摘要內容')).not.toBeInTheDocument()
  })
})
