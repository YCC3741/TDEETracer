import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { DatePicker } from '../../src/components/DatePicker'
import { TimePicker } from '../../src/components/TimePicker'

function DateHarness() {
  const [value, setValue] = useState('2026-08-11')
  return <DatePicker label="日期" value={value} onValueChange={setValue} />
}

function TimeHarness() {
  const [value, setValue] = useState('13:30')
  return <TimePicker label="時間" value={value} onValueChange={setValue} />
}

describe('themed date and time pickers', () => {
  it('selects dates with arrow keys without locking document scrolling', async () => {
    const user = userEvent.setup()
    render(<DateHarness />)
    const trigger = screen.getByLabelText('日期')

    await user.click(trigger)
    const popup = await screen.findByRole('dialog', { name: '選擇日期' })
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
    expect(
      within(popup).getByRole('button', { name: '2026/08/11' }),
    ).toHaveFocus()

    await user.keyboard('{ArrowRight}{Enter}')

    expect(trigger).toHaveTextContent('2026/08/12')
    expect(
      screen.queryByRole('dialog', { name: '選擇日期' }),
    ).not.toBeInTheDocument()

    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('uses 24-hour columns with keyboard selection and applies the value', async () => {
    const user = userEvent.setup()
    render(<TimeHarness />)
    const trigger = screen.getByLabelText('時間')

    await user.click(trigger)
    const popup = await screen.findByRole('dialog', { name: '選擇時間' })
    const selectedHour = within(popup).getByRole('option', { name: '13 時' })
    expect(selectedHour).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(
      within(popup).getByRole('option', { name: '14 時' }),
    ).toHaveAttribute('aria-selected', 'true')
    await user.click(within(popup).getByRole('option', { name: '45 分' }))
    await user.click(within(popup).getByRole('button', { name: '套用' }))

    expect(trigger).toHaveTextContent('14:45')
  })
})
