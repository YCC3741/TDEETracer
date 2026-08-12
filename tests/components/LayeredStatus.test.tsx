import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LayeredStatus } from '../../src/components/layered/LayeredStatus'

describe('LayeredStatus', () => {
  it('exposes an accessible progress value and visible status detail', () => {
    render(
      <LayeredStatus
        className="test-status"
        floating
        label="Quick 資料完成度"
        value={3}
        max={6}
        detail="STEP 01"
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: 'Quick 資料完成度' }),
    ).toHaveAttribute('value', '3')
    expect(screen.getByText('3 / 6')).toBeInTheDocument()
    expect(screen.getByText('STEP 01')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'Quick 資料完成度' }),
    ).toHaveClass('floating-route-hud', 'test-status')
  })
})
