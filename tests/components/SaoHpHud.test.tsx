import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SaoHpHud } from '../../src/components/sao/SaoHpHud'
import { buildGauge } from '../../src/domain/calculations'

describe('SAO HP HUD', () => {
  it('reads the intake rail as remaining allowance beside the selected date', () => {
    const { container } = render(
      <SaoHpHud
        intake={buildGauge(900, 1500)}
        activity={buildGauge(320, 525)}
        dateLabel="08 / 13"
      />,
    )

    expect(
      screen.getByRole('img', { name: '飲食剩餘 900 大卡，上限 1500 大卡' }),
    ).toHaveAttribute('data-stage', 'safe')
    expect(
      screen.getByRole('img', {
        name: '運動消耗 320 大卡，活動量目標 525 大卡',
      }),
    ).toBeInTheDocument()
    expect(container).toHaveTextContent('900 / 1500 kcal')
    expect(container).toHaveTextContent('08 / 13')
    expect(container).toHaveTextContent('320 / 525 kcal')
  })

  it('clamps the emptied intake rail while reporting the overrun', () => {
    const { container } = render(
      <SaoHpHud
        intake={buildGauge(-220, 1500)}
        activity={buildGauge(0, 525)}
        dateLabel="08 / 13"
      />,
    )

    expect(
      screen.getByRole('img', {
        name: '飲食已超出今日額度 220 大卡，上限 1500 大卡',
      }),
    ).toHaveAttribute('data-stage', 'critical')
    expect(
      container.querySelector('.sao-hp-window[data-depleted="true"]'),
    ).toHaveTextContent('-220 / 1500 kcal')
  })

  it('warns through the caution stage before the allowance runs out', () => {
    render(
      <SaoHpHud
        intake={buildGauge(450, 1500)}
        activity={buildGauge(0, 525)}
        dateLabel="08 / 13"
      />,
    )

    expect(screen.getByRole('img', { name: /飲食剩餘 450/ })).toHaveAttribute(
      'data-stage',
      'caution',
    )
  })

  it('drops the date window when a rail carries a single figure', () => {
    const { container } = render(
      <SaoHpHud
        intake={buildGauge(420, 1500)}
        activity={buildGauge(320, 525)}
        dateLabel="08 / 13"
      />,
    )
    const rails = container.querySelectorAll('.sao-hp-rail')

    expect(rails).toHaveLength(2)
    expect(rails[0]?.querySelectorAll('.sao-hp-window')).toHaveLength(2)
    expect(rails[1]?.querySelectorAll('.sao-hp-window')).toHaveLength(1)
  })
})
