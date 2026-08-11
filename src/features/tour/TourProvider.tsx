import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { TourContext, type TourPhase } from './TourContext'
import {
  clearTourPreference,
  readTourPreference,
  writeTourPreference,
} from './tourStorage'
import { createTourSteps, type TourStepId } from './tourSteps'

interface TourProviderProps extends PropsWithChildren {
  storage?: Storage
}

export function TourProvider({
  children,
  storage = window.localStorage,
}: TourProviderProps) {
  const [phase, setPhase] = useState<TourPhase>(() =>
    readTourPreference(storage) ? 'inactive' : 'welcome',
  )
  const [skipPlanCreation, setSkipPlanCreation] = useState(false)
  const [stepId, setStepId] = useState<TourStepId>('quick-profile')
  const steps = useMemo(
    () => createTourSteps(skipPlanCreation),
    [skipPlanCreation],
  )
  const stepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === stepId),
  )
  const step = phase === 'active' ? (steps[stepIndex] ?? null) : null

  const start = useCallback(
    ({ hasActivePlan }: { hasActivePlan: boolean }) => {
      clearTourPreference(storage)
      setSkipPlanCreation(hasActivePlan)
      setStepId('quick-profile')
      setPhase('active')
    },
    [storage],
  )

  const restart = useCallback(() => {
    setPhase('welcome')
  }, [])

  const skip = useCallback(() => {
    writeTourPreference(storage, 'skipped')
    setPhase('inactive')
  }, [storage])

  const complete = useCallback(() => {
    writeTourPreference(storage, 'completed')
    setPhase('inactive')
  }, [storage])

  const goTo = useCallback(
    (nextStepId: TourStepId) => {
      if (
        createTourSteps(skipPlanCreation).some(({ id }) => id === nextStepId)
      ) {
        setStepId(nextStepId)
      }
    },
    [skipPlanCreation],
  )

  const next = useCallback(() => {
    const currentSteps = createTourSteps(skipPlanCreation)
    const currentIndex = currentSteps.findIndex(({ id }) => id === stepId)
    const currentStep = currentSteps[currentIndex]
    if (!currentStep || currentStep.requiresAction) return
    const nextStep = currentSteps[currentIndex + 1]
    if (nextStep) setStepId(nextStep.id)
    else complete()
  }, [complete, skipPlanCreation, stepId])

  const previous = useCallback(() => {
    const currentSteps = createTourSteps(skipPlanCreation)
    const currentIndex = currentSteps.findIndex(({ id }) => id === stepId)
    const previousStep = currentSteps[currentIndex - 1]
    if (previousStep) setStepId(previousStep.id)
  }, [skipPlanCreation, stepId])

  const value = useMemo(
    () => ({
      phase,
      step,
      stepIndex,
      stepCount: steps.length,
      start,
      restart,
      skip,
      next,
      previous,
      goTo,
      complete,
    }),
    [
      complete,
      goTo,
      next,
      phase,
      previous,
      restart,
      skip,
      start,
      step,
      stepIndex,
      steps.length,
    ],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}
