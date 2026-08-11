import { createContext, useContext } from 'react'
import type { TourStep, TourStepId } from './tourSteps'

export type TourPhase = 'inactive' | 'welcome' | 'active'

export interface TourStartOptions {
  hasActivePlan: boolean
}

export interface TourContextValue {
  phase: TourPhase
  step: TourStep | null
  stepIndex: number
  stepCount: number
  start: (options: TourStartOptions) => void
  restart: () => void
  skip: () => void
  next: () => void
  previous: () => void
  goTo: (stepId: TourStepId) => void
  complete: () => void
}

const inactiveTour: TourContextValue = {
  phase: 'inactive',
  step: null,
  stepIndex: 0,
  stepCount: 0,
  start: () => undefined,
  restart: () => undefined,
  skip: () => undefined,
  next: () => undefined,
  previous: () => undefined,
  goTo: () => undefined,
  complete: () => undefined,
}

export const TourContext = createContext<TourContextValue>(inactiveTour)

export function useTour(): TourContextValue {
  return useContext(TourContext)
}
