import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useAppData } from '../../src/app/AppDataContext'
import { NotificationStack } from '../../src/components/NotificationStack'
import { renderWithAppData } from '../helpers/renderWithAppData'

function NotificationHarness() {
  const { notify } = useAppData()
  return (
    <>
      <button type="button" onClick={() => notify('ok', '訊息 A')}>
        add A
      </button>
      <button type="button" onClick={() => notify('warn', '訊息 B')}>
        add B
      </button>
      <NotificationStack />
    </>
  )
}

describe('NotificationStack interactions', () => {
  it('dismisses only the clicked notification', async () => {
    const user = userEvent.setup()
    renderWithAppData(<NotificationHarness />)

    await user.click(screen.getByRole('button', { name: 'add A' }))
    await user.click(screen.getByRole('button', { name: 'add B' }))
    await user.click(screen.getByRole('button', { name: /訊息 A/ }))

    expect(screen.queryByText('訊息 A')).not.toBeInTheDocument()
    expect(screen.getByText('訊息 B')).toBeInTheDocument()
  })

  it('auto-dismisses stacked messages ten seconds after each message was added', () => {
    vi.useFakeTimers()
    renderWithAppData(<NotificationHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'add A' }))
    act(() => vi.advanceTimersByTime(5_000))
    fireEvent.click(screen.getByRole('button', { name: 'add B' }))
    act(() => vi.advanceTimersByTime(5_000))

    expect(screen.queryByText('訊息 A')).not.toBeInTheDocument()
    expect(screen.getByText('訊息 B')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.queryByText('訊息 B')).not.toBeInTheDocument()
  })
})
