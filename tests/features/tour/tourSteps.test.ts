import { describe, expect, it } from 'vitest'
import {
  createTourSteps,
  type TourStepId,
} from '../../../src/features/tour/tourSteps'

const completeStepOrder: TourStepId[] = [
  'quick-profile',
  'quick-fields',
  'quick-strategy',
  'quick-submit',
  'quick-results',
  'mode-switch',
  'plan-create',
  'diary-route',
  'diary-editor',
  'food-form',
  'exercise-tab',
  'exercise-form',
  'weight-tab',
  'weight-form',
  'records-tab',
  'records-panel',
  'achievement-tab',
  'achievement-panel',
]

describe('guided tour steps', () => {
  it('follows the current Quick and Diary workflow in order', () => {
    const steps = createTourSteps(false)

    expect(steps.map(({ id }) => id)).toEqual(completeStepOrder)
    expect(new Set(steps.map(({ anchor }) => anchor)).size).toBe(steps.length)
    expect(
      steps.filter(({ requiresAction }) => requiresAction).map(({ id }) => id),
    ).toEqual([
      'quick-submit',
      'mode-switch',
      'plan-create',
      'diary-editor',
      'food-form',
      'exercise-tab',
      'exercise-form',
      'weight-tab',
      'weight-form',
      'records-tab',
      'achievement-tab',
    ])
  })

  it('removes only plan creation when an active plan already exists', () => {
    const steps = createTourSteps(true)

    expect(steps.map(({ id }) => id)).toEqual(
      completeStepOrder.filter((id) => id !== 'plan-create'),
    )
    expect(steps.find(({ id }) => id === 'diary-route')?.anchor).toBe(
      'diary-date-rail',
    )
    expect(steps.at(-1)).toMatchObject({
      id: 'achievement-panel',
      anchor: 'achievement-panel',
    })
  })
})
