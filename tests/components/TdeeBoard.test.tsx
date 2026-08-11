import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TdeeBoard } from '../../src/components/TdeeBoard'

describe('TdeeBoard', () => {
  it('shows compact labels and reveals full details from the whole card', async () => {
    const user = userEvent.setup()
    render(<TdeeBoard bmr={1000} />)

    expect(screen.getByText('睡覺／休息')).toBeInTheDocument()
    expect(screen.getByText('久坐')).toBeInTheDocument()
    expect(screen.getByText('輕度')).toBeInTheDocument()
    expect(screen.getByText('中度')).toBeInTheDocument()
    expect(screen.getByText('高度')).toBeInTheDocument()
    expect(screen.getByText('超高強度')).toBeInTheDocument()
    expect(screen.queryByText('每週運動 1–3 天')).not.toBeInTheDocument()

    const lightCard = screen.getByText('輕度').closest<HTMLElement>('article')
    if (!lightCard) throw new Error('Missing light activity card')
    await user.hover(lightCard)

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '每週運動 1–3 天',
    )
  })

  it('exposes card details from keyboard focus', async () => {
    const user = userEvent.setup()
    render(<TdeeBoard bmr={1000} />)

    await user.tab()

    expect(screen.getByText('睡覺／休息').closest('article')).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '純躺著/睡覺 約等於 BMR 基礎代謝',
    )
  })
})
