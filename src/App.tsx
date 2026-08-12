import { useLayoutEffect, useMemo, useState } from 'react'
import { useAppData } from './app/AppDataContext'
import { AppBar } from './components/AppBar'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DataFooter } from './components/DataFooter'
import { NotificationStack } from './components/NotificationStack'
import { PaceFloat } from './components/PaceFloat'
import { QuickDraftNoticeDialog } from './components/QuickDraftNoticeDialog'
import { StartDetailedPlanDialog } from './components/StartDetailedPlanDialog'
import { isProfileReady } from './domain/calculations'
import {
  buildActualsByDate,
  buildWeightMeasurements,
  computePaceVsPlan,
} from './domain/projection'
import type { PageName, WorkMode } from './domain/types'
import { profilesHaveSameSettings } from './domain/workspace'
import { DetailedPlanPage } from './features/diary/DetailedPlanPage'
import { HomePage } from './features/home/HomePage'
import { QuickPage } from './features/quick/QuickPage'
import { useTour } from './features/tour/TourContext'
import { TourOverlay } from './features/tour/TourOverlay'
import { TourWelcomeDialog } from './features/tour/TourWelcomeDialog'

interface PendingPlanCreation {
  name: string
}

function initialPage(
  preferredMode: WorkMode | null,
  hasSelectedPlan: boolean,
): PageName {
  const hash = window.location.hash.replace('#', '')
  if (!preferredMode) return 'home'
  const requested = hash === 'quick' || hash === 'diary' ? hash : preferredMode
  return requested === 'diary' && !hasSelectedPlan ? 'home' : requested
}

export function App() {
  const tour = useTour()
  const {
    prefMode,
    setPreferredMode,
    profile,
    quickDraft,
    diary,
    activeUser,
    selectedPlan,
    selectPlan,
    createPlan,
  } = useAppData()
  const [page, setPage] = useState<PageName>(() =>
    initialPage(prefMode, selectedPlan !== null),
  )
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [quickNoticePlanId, setQuickNoticePlanId] = useState<string | null>(
    null,
  )
  const [pendingPlanCreation, setPendingPlanCreation] =
    useState<PendingPlanCreation | null>(null)
  const activePlan =
    activeUser.plans.find((plan) => plan.status === 'active') ?? null

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.page = page
    return () => {
      delete root.dataset.page
    }
  }, [page])

  const chooseMode = (mode: WorkMode) => {
    if (mode === 'diary' && selectedPlan?.status !== 'active') {
      const fallback = activeUser.plans.find((plan) => plan.status === 'active')
      if (fallback) {
        selectPlan(fallback.id)
      } else {
        setPlanDialogOpen(true)
        if (tour.step?.id === 'mode-switch') tour.goTo('plan-create')
        return
      }
    }
    setPreferredMode(mode)
    setPage(mode)
    window.history.replaceState(null, '', `#${mode}`)
    if (mode === 'diary' && tour.step?.id === 'mode-switch') {
      tour.goTo('diary-route')
    }
  }

  const applyImportedMode = (mode: WorkMode | null) => {
    const nextPage = mode ?? 'home'
    setPage(nextPage)
    window.history.replaceState(
      null,
      '',
      nextPage === 'home' ? window.location.pathname : `#${nextPage}`,
    )
  }

  const openPlan = () => {
    setPage('diary')
    window.history.replaceState(null, '', '#diary')
  }

  const completePlanCreation = (name: string): boolean => {
    const planId = createPlan(name)
    if (!planId) return false
    setPlanDialogOpen(false)
    setPage('diary')
    window.history.replaceState(null, '', '#diary')
    if (tour.step?.id === 'plan-create') tour.goTo('diary-route')
    return true
  }

  const pace = useMemo(
    () =>
      isProfileReady(profile)
        ? computePaceVsPlan(
            profile,
            buildActualsByDate(diary),
            new Date(),
            buildWeightMeasurements(diary),
          )
        : null,
    [diary, profile],
  )

  const quickNoticePlan =
    activeUser.plans.find(
      (plan) => plan.id === quickNoticePlanId && plan.status === 'active',
    ) ?? null
  const planTemplate = quickDraft

  return (
    <div className="app-shell with-app-bar" data-page={page}>
      <AppBar
        mode={page}
        onHome={() => {
          setPage('home')
          window.history.replaceState(null, '', window.location.pathname)
        }}
        onModeChange={chooseMode}
        onImported={applyImportedMode}
        onOpenPlan={openPlan}
        onStartPlan={() => setPlanDialogOpen(true)}
        onRestartTour={tour.restart}
        onUserSelected={() => {
          setPage('quick')
          window.history.replaceState(null, '', '#quick')
        }}
      />

      {page === 'home' ? <HomePage onChoose={chooseMode} /> : null}
      {page === 'quick' ? (
        <QuickPage
          onDraftChanged={(profile) => {
            if (
              tour.phase !== 'active' &&
              activePlan?.profile &&
              !profilesHaveSameSettings(activePlan.profile, profile)
            ) {
              setQuickNoticePlanId(activePlan.id)
            }
          }}
        />
      ) : null}
      {page === 'diary' && selectedPlan ? <DetailedPlanPage /> : null}

      {page === 'diary' && selectedPlan?.status === 'active' ? (
        <PaceFloat pace={pace} hasPlan={isProfileReady(profile)} />
      ) : null}
      {page !== 'home' ? <DataFooter /> : null}
      <NotificationStack />
      {quickNoticePlan ? (
        <QuickDraftNoticeDialog
          planName={quickNoticePlan.name}
          onKeepDraft={() => setQuickNoticePlanId(null)}
          onCreatePlan={() => {
            setQuickNoticePlanId(null)
            setPlanDialogOpen(true)
          }}
        />
      ) : null}
      {planDialogOpen ? (
        <StartDetailedPlanDialog
          open
          profile={isProfileReady(planTemplate) ? planTemplate : null}
          initialName=""
          {...(activePlan ? { replacesPlanName: activePlan.name } : {})}
          onCancel={() => setPlanDialogOpen(false)}
          onStart={(name) => {
            if (activePlan) {
              setPlanDialogOpen(false)
              setPendingPlanCreation({ name })
              return
            }
            completePlanCreation(name)
          }}
          onGoQuick={() => {
            setPlanDialogOpen(false)
            chooseMode('quick')
          }}
        />
      ) : null}
      <ConfirmDialog
        open={pendingPlanCreation !== null}
        title="封存並建立新計畫"
        description={`${activePlan?.name ?? '目前正式計畫'}將封存為唯讀
舊日記與體重會完整保留
新計畫日記從空白開始`}
        confirmLabel="封存並建立"
        onCancel={() => setPendingPlanCreation(null)}
        onConfirm={() => {
          if (
            pendingPlanCreation &&
            completePlanCreation(pendingPlanCreation.name)
          ) {
            setPendingPlanCreation(null)
          }
        }}
      />
      <TourWelcomeDialog
        open={tour.phase === 'welcome'}
        onStart={() => {
          chooseMode('quick')
          tour.start({ hasActivePlan: activePlan !== null })
        }}
        onSkip={tour.skip}
      />
      <TourOverlay />
    </div>
  )
}
