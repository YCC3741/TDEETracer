import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useAppData } from '../../src/app/AppDataContext'
import { STORAGE_WORKSPACE } from '../../src/domain/constants'
import { parseImportData } from '../../src/storage/importExport'
import { renderWithAppData } from '../helpers/renderWithAppData'
import { TestStorage } from '../helpers/TestStorage'
import {
  makeDiaryDay,
  makeExportData,
  makeLocalUser,
  makePlan,
  makeProfile,
} from '../helpers/testData'

function CommandHarness({ otherUserId }: { otherUserId: string }) {
  const appData = useAppData()
  return (
    <>
      <output aria-label="current-user">{appData.activeUser.name}</output>
      <output aria-label="current-plan">
        {appData.selectedPlan?.name ?? 'none'}
      </output>
      <output aria-label="day-count">{appData.diary.length}</output>
      <output aria-label="user-count">{appData.users.length}</output>
      <output aria-label="messages">
        {appData.notifications.map((item) => item.text).join('|')}
      </output>
      <button type="button" onClick={() => appData.selectUser(otherUserId)}>
        switch user
      </button>
      <button
        type="button"
        onClick={() =>
          appData.selectedPlan && appData.archivePlan(appData.selectedPlan.id)
        }
      >
        archive
      </button>
      <button
        type="button"
        onClick={() => appData.upsertDay(makeDiaryDay('2026-08-12'))}
      >
        add day
      </button>
      <button
        type="button"
        onClick={() => appData.deleteUser(appData.activeUser.id)}
      >
        delete user
      </button>
    </>
  )
}

function PlanCommandHarness({ targetPlanId }: { targetPlanId: string }) {
  const appData = useAppData()
  return (
    <>
      <output aria-label="selected-plan">
        {appData.selectedPlan?.id ?? 'none'}
      </output>
      <output aria-label="preferred-mode">{appData.prefMode ?? 'none'}</output>
      <output aria-label="plan-count">{appData.activeUser.plans.length}</output>
      <output aria-label="messages">
        {appData.notifications.map((item) => item.text).join('|')}
      </output>
      <button
        type="button"
        onClick={() => {
          appData.selectPlan(targetPlanId)
          appData.setPreferredMode('diary')
        }}
      >
        select and prefer
      </button>
      <button
        type="button"
        onClick={() => appData.renamePlan(targetPlanId, '不應修改')}
      >
        rename target
      </button>
      <button
        type="button"
        onClick={() => appData.reactivatePlan(targetPlanId)}
      >
        reactivate target
      </button>
      <button type="button" onClick={() => appData.deletePlan(targetPlanId)}>
        delete target
      </button>
      <button type="button" onClick={() => appData.createPlan('Quick 新計畫')}>
        replace from quick
      </button>
    </>
  )
}

describe('workspace commands', () => {
  it('isolates selected plans when switching local users', async () => {
    const user = userEvent.setup()
    const firstPlan = makePlan({ id: 'plan_a', name: 'A 計畫' })
    const secondPlan = makePlan({
      id: 'plan_b',
      name: 'B 計畫',
      profile: makeProfile({ weight: 90 }),
      diary: [makeDiaryDay('2026-08-10')],
    })
    const firstUser = makeLocalUser({
      id: 'user_a',
      name: '使用者 A',
      plans: [firstPlan],
      selectedPlanId: firstPlan.id,
    })
    const secondUser = makeLocalUser({
      id: 'user_b',
      name: '使用者 B',
      plans: [secondPlan],
      selectedPlanId: secondPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: firstUser.id,
          users: [firstUser, secondUser],
        }),
      ),
    })
    renderWithAppData(<CommandHarness otherUserId={secondUser.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'switch user' }))

    expect(screen.getByLabelText('current-user')).toHaveTextContent('使用者 B')
    expect(screen.getByLabelText('current-plan')).toHaveTextContent('B 計畫')
    expect(screen.getByLabelText('day-count')).toHaveTextContent('1')
  })

  it('rejects diary mutations after a plan is archived', async () => {
    const user = userEvent.setup()
    const plan = makePlan()
    const localUser = makeLocalUser({
      plans: [plan],
      selectedPlanId: plan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<CommandHarness otherUserId={localUser.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'archive' }))
    await user.click(screen.getByRole('button', { name: 'add day' }))

    expect(screen.getByLabelText('day-count')).toHaveTextContent('0')
    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '請先選擇進行中的計畫。',
    )
  })

  it('keeps the final local user when a delete command is attempted', async () => {
    const user = userEvent.setup()
    const localUser = makeLocalUser()
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<CommandHarness otherUserId={localUser.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'delete user' }))

    expect(screen.getByLabelText('user-count')).toHaveTextContent('1')
    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '至少需要保留一位本機使用者。',
    )
  })

  it('keeps sequential plan selection and preferred-mode updates atomic', async () => {
    const user = userEvent.setup()
    const firstPlan = makePlan({ id: 'plan_first', name: '第一計畫' })
    const secondPlan = makePlan({
      id: 'plan_second',
      name: '第二計畫',
      status: 'archived',
      archivedAt: '2026-08-10T04:00:00.000Z',
    })
    const localUser = makeLocalUser({
      plans: [firstPlan, secondPlan],
      selectedPlanId: firstPlan.id,
      preferredMode: 'quick',
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={secondPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'select and prefer' }))

    expect(screen.getByLabelText('selected-plan')).toHaveTextContent(
      secondPlan.id,
    )
    expect(screen.getByLabelText('preferred-mode')).toHaveTextContent('diary')
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].selectedPlanId).toBe(secondPlan.id)
    expect(workspace.users[0].preferredMode).toBe('diary')
  })

  it('rejects every rename attempt against an archived plan', async () => {
    const user = userEvent.setup()
    const archivedPlan = makePlan({
      status: 'archived',
      archivedAt: '2026-08-11T04:00:00.000Z',
    })
    const localUser = makeLocalUser({
      plans: [archivedPlan],
      selectedPlanId: archivedPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={archivedPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'rename target' }))

    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '已封存計畫為唯讀，無法修改。',
    )
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0].name).toBe(archivedPlan.name)
  })

  it('mutates only the selected plan of the active user', async () => {
    const user = userEvent.setup()
    const selectedPlan = makePlan({ id: 'plan_selected', diary: [] })
    const siblingPlan = makePlan({
      id: 'plan_sibling',
      status: 'archived',
      archivedAt: '2026-08-09T04:00:00.000Z',
      diary: [makeDiaryDay('2026-08-09')],
    })
    const activeUser = makeLocalUser({
      id: 'user_active',
      plans: [selectedPlan, siblingPlan],
      selectedPlanId: selectedPlan.id,
    })
    const otherUser = makeLocalUser({
      id: 'user_other',
      plans: [
        makePlan({
          id: 'plan_other',
          diary: [makeDiaryDay('2026-08-08')],
        }),
      ],
      selectedPlanId: 'plan_other',
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: activeUser.id,
          users: [activeUser, otherUser],
        }),
      ),
    })
    renderWithAppData(<CommandHarness otherUserId={otherUser.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'add day' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0].diary).toHaveLength(1)
    expect(workspace.users[0].plans[1]).toEqual(siblingPlan)
    expect(workspace.users[1]).toEqual(otherUser)
  })

  it('atomically archives the current plan when Quick creates a replacement', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({
      id: 'plan_current',
      name: '目前計畫',
      diary: [
        makeDiaryDay('2026-08-10', {
          actualWeightKg: 70,
          entries: [],
        }),
      ],
    })
    const localUser = makeLocalUser({
      quickDraft: makeProfile({ target: 58, intake: 1400 }),
      plans: [currentPlan],
      selectedPlanId: currentPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={currentPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'replace from quick' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    const plans = workspace.users[0].plans
    expect(
      plans.filter((plan: { status: string }) => plan.status === 'active'),
    ).toHaveLength(1)
    expect(plans[0]).toMatchObject({
      id: currentPlan.id,
      status: 'archived',
      diary: currentPlan.diary,
    })
    expect(plans[1]).toMatchObject({
      name: 'Quick 新計畫',
      status: 'active',
      diary: [],
      profile: {
        weight: 70,
        target: 58,
        intake: 1400,
      },
    })
    expect(workspace.users[0].selectedPlanId).toBe(plans[1].id)
  })

  it('rejects replacement when the latest weight no longer exceeds the Quick target', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({
      id: 'plan_current',
      diary: [
        makeDiaryDay('2026-08-10', {
          actualWeightKg: 57.5,
          entries: [],
        }),
      ],
    })
    const localUser = makeLocalUser({
      quickDraft: makeProfile({ weight: 75, target: 58 }),
      plans: [currentPlan],
      selectedPlanId: currentPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={currentPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'replace from quick' }))

    expect(screen.getByLabelText('plan-count')).toHaveTextContent('1')
    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '最新實測體重必須高於目標體重，請先調整 Quick 目標。',
    )
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([currentPlan])
  })

  it('keeps the old active plan when replacement persistence fails', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({ id: 'plan_current' })
    const localUser = makeLocalUser({
      plans: [currentPlan],
      selectedPlanId: currentPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={currentPlan.id} />, {
      storage,
    })
    storage.failWritesFor(STORAGE_WORKSPACE)

    await user.click(screen.getByRole('button', { name: 'replace from quick' }))

    expect(screen.getByLabelText('plan-count')).toHaveTextContent('1')
    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '無法建立精確計畫。',
    )
    storage.failWritesFor(null)
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([currentPlan])
  })

  it('atomically reactivates an archived plan with all history intact', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({ id: 'plan_current', name: '目前計畫' })
    const archivedPlan = makePlan({
      id: 'plan_archived',
      name: '封存計畫',
      status: 'archived',
      archivedAt: '2026-08-10T04:00:00.000Z',
      diary: [makeDiaryDay('2026-08-09', { actualWeightKg: 71.5 })],
    })
    const localUser = makeLocalUser({
      plans: [currentPlan, archivedPlan],
      selectedPlanId: currentPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={archivedPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'reactivate target' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0]).toMatchObject({
      id: currentPlan.id,
      status: 'archived',
    })
    expect(workspace.users[0].plans[1]).toMatchObject({
      id: archivedPlan.id,
      status: 'active',
      archivedAt: null,
      diary: archivedPlan.diary,
    })
    expect(workspace.users[0].selectedPlanId).toBe(archivedPlan.id)
  })

  it('keeps both plan states unchanged when reactivation persistence fails', async () => {
    const user = userEvent.setup()
    const archivedPlan = makePlan({
      id: 'plan_archived',
      status: 'archived',
      archivedAt: '2026-08-10T04:00:00.000Z',
      diary: [makeDiaryDay('2026-08-09', { actualWeightKg: 71.5 })],
    })
    const currentPlan = makePlan({
      id: 'plan_current',
      sourcePlanId: archivedPlan.id,
    })
    const localUser = makeLocalUser({
      plans: [currentPlan, archivedPlan],
      selectedPlanId: currentPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={archivedPlan.id} />, {
      storage,
    })
    storage.failWritesFor(STORAGE_WORKSPACE)

    await user.click(screen.getByRole('button', { name: 'reactivate target' }))

    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '無法重新啟用計畫。',
    )
    storage.failWritesFor(null)
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([currentPlan, archivedPlan])
    expect(workspace.users[0].selectedPlanId).toBe(currentPlan.id)
  })

  it('deletes only an archived plan and selects the active fallback', async () => {
    const user = userEvent.setup()
    const archivedPlan = makePlan({
      id: 'plan_archived',
      status: 'archived',
      archivedAt: '2026-08-10T04:00:00.000Z',
      diary: [makeDiaryDay('2026-08-09', { actualWeightKg: 71.5 })],
    })
    const currentPlan = makePlan({
      id: 'plan_current',
      sourcePlanId: archivedPlan.id,
    })
    const localUser = makeLocalUser({
      plans: [currentPlan, archivedPlan],
      selectedPlanId: archivedPlan.id,
      preferredMode: 'diary',
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={archivedPlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'delete target' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toHaveLength(1)
    expect(workspace.users[0].plans[0]).toMatchObject({
      id: currentPlan.id,
      sourcePlanId: null,
    })
    expect(workspace.users[0].selectedPlanId).toBe(currentPlan.id)
    expect(workspace.users[0].preferredMode).toBe('diary')
    expect(() =>
      parseImportData(
        JSON.stringify({
          ...workspace,
          exportedAt: '2026-08-11T03:00:00.000Z',
        }),
      ),
    ).not.toThrow()
  })

  it('does not delete active plans', async () => {
    const user = userEvent.setup()
    const activePlan = makePlan({ id: 'plan_active' })
    const localUser = makeLocalUser({
      plans: [activePlan],
      selectedPlanId: activePlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={activePlan.id} />, {
      storage,
    })

    await user.click(screen.getByRole('button', { name: 'delete target' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([activePlan])
  })

  it('keeps archived history when deletion persistence fails', async () => {
    const user = userEvent.setup()
    const archivedPlan = makePlan({
      id: 'plan_archived',
      status: 'archived',
      archivedAt: '2026-08-10T04:00:00.000Z',
      diary: [makeDiaryDay('2026-08-09', { actualWeightKg: 71.5 })],
    })
    const localUser = makeLocalUser({
      plans: [archivedPlan],
      selectedPlanId: archivedPlan.id,
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: localUser.id,
          users: [localUser],
        }),
      ),
    })
    renderWithAppData(<PlanCommandHarness targetPlanId={archivedPlan.id} />, {
      storage,
    })
    storage.failWritesFor(STORAGE_WORKSPACE)

    await user.click(screen.getByRole('button', { name: 'delete target' }))

    expect(screen.getByLabelText('messages')).toHaveTextContent(
      '無法刪除封存計畫。',
    )
    storage.failWritesFor(null)
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([archivedPlan])
    expect(workspace.users[0].selectedPlanId).toBe(archivedPlan.id)
  })
})
