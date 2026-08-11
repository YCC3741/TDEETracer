import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useTour } from '../../../src/features/tour/TourContext'
import { TourProvider } from '../../../src/features/tour/TourProvider'
import {
  STORAGE_GUIDED_TOUR,
  readTourPreference,
} from '../../../src/features/tour/tourStorage'
import { renderWithAppData } from '../../helpers/renderWithAppData'
import { TestStorage } from '../../helpers/TestStorage'

function TourHarness() {
  const tour = useTour()
  return (
    <>
      <output aria-label="phase">{tour.phase}</output>
      <output aria-label="step">{tour.step?.id ?? 'none'}</output>
      <output aria-label="count">{tour.stepCount}</output>
      <button
        type="button"
        onClick={() => tour.start({ hasActivePlan: false })}
      >
        start new
      </button>
      <button type="button" onClick={() => tour.start({ hasActivePlan: true })}>
        start existing
      </button>
      <button type="button" onClick={tour.next}>
        next
      </button>
      <button type="button" onClick={tour.skip}>
        skip
      </button>
      <button type="button" onClick={tour.complete}>
        complete
      </button>
    </>
  )
}

describe('TourProvider', () => {
  it('opens welcome once and traverses the non-action steps', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    renderWithAppData(
      <TourProvider storage={storage}>
        <TourHarness />
      </TourProvider>,
    )

    expect(screen.getByLabelText('phase')).toHaveTextContent('welcome')
    await user.click(screen.getByRole('button', { name: 'start new' }))
    expect(screen.getByLabelText('step')).toHaveTextContent('quick-profile')
    expect(screen.getByLabelText('count')).toHaveTextContent('13')

    await user.click(screen.getByRole('button', { name: 'next' }))
    expect(screen.getByLabelText('step')).toHaveTextContent('quick-fields')
  })

  it('skips plan creation on rerun and persists skip or completion', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage({
      [STORAGE_GUIDED_TOUR]: JSON.stringify({
        version: 1,
        status: 'completed',
      }),
    })
    renderWithAppData(
      <TourProvider storage={storage}>
        <TourHarness />
      </TourProvider>,
    )

    expect(screen.getByLabelText('phase')).toHaveTextContent('inactive')
    await user.click(screen.getByRole('button', { name: 'start existing' }))
    expect(screen.getByLabelText('count')).toHaveTextContent('12')

    await user.click(screen.getByRole('button', { name: 'skip' }))
    expect(readTourPreference(storage)).toBe('skipped')
    await user.click(screen.getByRole('button', { name: 'start existing' }))
    await user.click(screen.getByRole('button', { name: 'complete' }))
    expect(readTourPreference(storage)).toBe('completed')
  })
})
