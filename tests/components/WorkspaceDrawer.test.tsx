import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceDrawer } from '../../src/components/WorkspaceDrawer'
import { NotificationStack } from '../../src/components/NotificationStack'
import { STORAGE_WORKSPACE } from '../../src/domain/constants'
import type { PlanRecord } from '../../src/domain/types'
import { renderWithAppData } from '../helpers/renderWithAppData'
import { TestStorage } from '../helpers/TestStorage'
import { makeExportData, makeLocalUser, makePlan } from '../helpers/testData'

function renderDrawer(
  options: {
    archivedPlans?: PlanRecord[]
    selectedPlanId?: string
  } = {},
) {
  const activePlan = makePlan({ id: 'plan_active', name: '進行計畫' })
  const archivedPlans = options.archivedPlans ?? [
    makePlan({
      id: 'plan_archived',
      name: '舊計畫',
      status: 'archived',
      archivedAt: '2026-08-10T03:00:00.000Z',
    }),
  ]
  const user = makeLocalUser({
    id: 'user_primary',
    plans: [activePlan, ...archivedPlans],
    selectedPlanId: options.selectedPlanId ?? activePlan.id,
  })
  const otherUser = makeLocalUser({
    id: 'user_other',
    name: '其他使用者',
    plans: [],
    selectedPlanId: null,
  })
  const storage = new TestStorage({
    [STORAGE_WORKSPACE]: JSON.stringify(
      makeExportData({
        activeUserId: user.id,
        users: [user, otherUser],
      }),
    ),
  })
  const onStartPlan = vi.fn()
  const onOpenPlan = vi.fn()
  const onUserSelected = vi.fn()
  const result = renderWithAppData(
    <>
      <WorkspaceDrawer
        onOpenPlan={onOpenPlan}
        onStartPlan={onStartPlan}
        onRestartTour={vi.fn()}
        onUserSelected={onUserSelected}
        onImported={vi.fn()}
      />
      <NotificationStack />
    </>,
    { storage },
  )
  return { ...result, storage, onStartPlan, onOpenPlan, onUserSelected }
}

describe('WorkspaceDrawer', () => {
  it('opens accessibly, restores focus on Escape and lists plan groups', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const trigger = screen.getByRole('button', { name: '開啟工作區選單' })

    await user.click(trigger)
    expect(
      screen.getByRole('heading', { name: '本機使用者與計畫' }),
    ).toBeInTheDocument()
    expect(screen.getByText('進行計畫')).toBeInTheDocument()
    expect(screen.getByText('舊計畫')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('heading', { name: '本機使用者與計畫' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('archives active plans and reactivates archived history', async () => {
    const user = userEvent.setup()
    const { storage, onOpenPlan } = renderDrawer()

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '封存 進行計畫' }))
    const dialog = screen.getByRole('dialog', { name: '封存這個計畫？' })
    await user.click(within(dialog).getByRole('button', { name: '確認封存' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(
      workspace.users[0].plans.find(
        (plan: { id: string }) => plan.id === 'plan_active',
      ),
    ).toMatchObject({ status: 'archived' })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    const oldPlanItem = screen
      .getByText('舊計畫')
      .closest<HTMLElement>('.workspace-plan-item')
    if (!oldPlanItem) throw new Error('Missing archived plan item')
    await user.click(
      within(oldPlanItem).getByRole('button', { name: '重新啟用' }),
    )
    const reactivateDialog = screen.getByRole('dialog', {
      name: '重新啟用計畫？',
    })
    await user.click(
      within(reactivateDialog).getByRole('button', {
        name: '確認重新啟用',
      }),
    )
    const reactivatedWorkspace = JSON.parse(
      storage.getItem(STORAGE_WORKSPACE) ?? 'null',
    )
    expect(
      reactivatedWorkspace.users[0].plans.find(
        (plan: { id: string }) => plan.id === 'plan_archived',
      ),
    ).toMatchObject({ status: 'active', archivedAt: null })
    expect(onOpenPlan).toHaveBeenCalledWith('plan_archived')
  })

  it('shows three recent archived plans and expands or collapses the rest', async () => {
    const user = userEvent.setup()
    const archivedPlans = [
      makePlan({
        id: 'archive_oldest',
        name: '最舊封存',
        status: 'archived',
        archivedAt: '2026-08-01T03:00:00.000Z',
      }),
      makePlan({
        id: 'archive_newest',
        name: '最新封存',
        status: 'archived',
        archivedAt: '2026-08-10T03:00:00.000Z',
      }),
      makePlan({
        id: 'archive_middle',
        name: '中間封存',
        status: 'archived',
        archivedAt: '2026-08-05T03:00:00.000Z',
      }),
      makePlan({
        id: 'archive_recent',
        name: '次新封存',
        status: 'archived',
        archivedAt: '2026-08-09T03:00:00.000Z',
      }),
    ]
    renderDrawer({ archivedPlans })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))

    expect(screen.getByText('最新封存')).toBeInTheDocument()
    expect(screen.getByText('次新封存')).toBeInTheDocument()
    expect(screen.getByText('中間封存')).toBeInTheDocument()
    expect(screen.queryByText('最舊封存')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '展開所有已封存計畫' }))
    expect(screen.getByText('最舊封存')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '收合已封存計畫' }))
    expect(screen.queryByText('最舊封存')).not.toBeInTheDocument()
  })

  it('permanently deletes an archived plan after confirmation', async () => {
    const user = userEvent.setup()
    const { storage, onOpenPlan } = renderDrawer({
      selectedPlanId: 'plan_archived',
    })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '刪除 舊計畫' }))

    const dialog = screen.getByRole('dialog', {
      name: '永久刪除封存計畫？',
    })
    expect(dialog).toHaveTextContent('舊計畫')
    expect(dialog).toHaveTextContent('全部日記、飲食、運動與體重紀錄將永久刪除')
    await user.click(within(dialog).getByRole('button', { name: '永久刪除' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(
      workspace.users[0].plans.some(
        (plan: { id: string }) => plan.id === 'plan_archived',
      ),
    ).toBe(false)
    expect(workspace.users[0].selectedPlanId).toBe('plan_active')
    expect(onOpenPlan).toHaveBeenCalledWith('plan_active')
  })

  it('permanently deletes the current user after confirmation', async () => {
    const user = userEvent.setup()
    const { storage, onUserSelected } = renderDrawer()

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '刪除此使用者' }))
    const dialog = screen.getByRole('dialog', {
      name: '永久刪除使用者？',
    })
    expect(dialog).toHaveTextContent('全部日記與成就都會永久刪除')
    await user.click(within(dialog).getByRole('button', { name: '永久刪除' }))

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users).toHaveLength(1)
    expect(workspace.activeUserId).toBe('user_other')
    expect(onUserSelected).toHaveBeenCalledOnce()
  })

  it('restores focus to the Drawer trigger after cancelling a plan action', async () => {
    const user = userEvent.setup()
    renderDrawer()
    const trigger = screen.getByRole('button', { name: '開啟工作區選單' })

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: '封存 進行計畫' }))
    const dialog = screen.getByRole('dialog', { name: '封存這個計畫？' })
    await user.click(within(dialog).getByRole('button', { name: '取消' }))

    expect(trigger).toHaveFocus()
  })

  it('closes the Drawer before announcing a successful export', async () => {
    const user = userEvent.setup()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:workspace')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    )
    renderDrawer()

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '匯出資料 JSON' }))

    expect(
      screen.queryByRole('heading', { name: '本機使用者與計畫' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('已匯出全部本機資料 JSON。')).toBeInTheDocument()
  })

  it('closes the production Drawer and exposes an import parse error', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderDrawer()
    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('Missing workspace import input')
    const file = new File(['invalid'], 'invalid.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: async () => 'invalid',
    })

    await user.upload(input, file)

    expect(
      await screen.findByText('匯入失敗：JSON 無法解析'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '本機使用者與計畫' }),
    ).not.toBeInTheDocument()
  })

  it('opens a focused Dialog from the separated add-user action', async () => {
    const user = userEvent.setup()
    const { storage, onUserSelected } = renderDrawer()
    const trigger = screen.getByRole('button', { name: '開啟工作區選單' })

    await user.click(trigger)
    expect(
      screen.queryByRole('textbox', { name: '新增使用者名稱' }),
    ).not.toBeInTheDocument()
    const addUserButton = screen.getByRole('button', {
      name: '＋ 新增使用者',
    })
    expect(
      screen.getByText('Data').compareDocumentPosition(addUserButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    await user.click(addUserButton)

    let dialog = screen.getByRole('dialog', { name: '新增使用者' })
    const nameInput = within(dialog).getByRole('textbox', {
      name: '使用者名稱',
    })
    expect(
      within(dialog).getByRole('button', { name: '建立使用者' }),
    ).toBeDisabled()
    await waitFor(() => expect(nameInput).toHaveFocus())
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: '新增使用者' }),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: '＋ 新增使用者' }))
    dialog = screen.getByRole('dialog', { name: '新增使用者' })
    const secondNameInput = within(dialog).getByRole('textbox', {
      name: '使用者名稱',
    })
    const createButton = within(dialog).getByRole('button', {
      name: '建立使用者',
    })
    expect(createButton).toBeDisabled()
    await user.type(secondNameInput, '新使用者')
    expect(createButton).toBeEnabled()
    await user.keyboard('{Enter}')

    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users).toHaveLength(3)
    expect(workspace.activeUserId).toBe(workspace.users[2].id)
    expect(workspace.users[2].name).toBe('新使用者')
    expect(onUserSelected).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('dialog', { name: '新增使用者' }),
    ).not.toBeInTheDocument()
  })
})
