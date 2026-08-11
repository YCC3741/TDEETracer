import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../src/App'
import {
  STORAGE_PREFERRED_MODE,
  STORAGE_WORKSPACE,
} from '../../src/domain/constants'
import { renderWithAppData } from '../helpers/renderWithAppData'
import { TestStorage } from '../helpers/TestStorage'
import { makeExportData, makeLocalUser, makePlan } from '../helpers/testData'

function jsonFile(value: unknown) {
  const text = JSON.stringify(value)
  const file = new File([text], 'workspace.json', {
    type: 'application/json',
  })
  Object.defineProperty(file, 'text', {
    configurable: true,
    value: async () => text,
  })
  return file
}

describe('App navigation interactions', () => {
  it('starts at Home without a preference and hooks the Quick choice to view, hash and storage', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    window.history.replaceState(null, '', '/#diary')
    renderWithAppData(<App />, { storage })

    expect(
      screen.getByRole('heading', {
        name: '看見每一步的改變',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /開始快速估算/ }))

    expect(
      screen.getByRole('heading', { name: '先看見方向 再決定步伐' }),
    ).toBeInTheDocument()
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].preferredMode).toBe('quick')
    expect(window.location.hash).toBe('#quick')
  })

  it('guards the detailed page until a Quick draft can create a plan', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage({
      [STORAGE_PREFERRED_MODE]: 'quick',
    })
    renderWithAppData(<App />, { storage })

    const modeSwitch = screen.getByRole('switch', {
      name: '切換到精細計算',
    })
    await user.click(modeSwitch)

    expect(
      screen.getByRole('dialog', { name: '開始精確計畫' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/請先完成一次有效的 Quick 試算/),
    ).toBeInTheDocument()
    expect(window.location.hash).not.toBe('#diary')

    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(modeSwitch).toHaveFocus()
  })

  it('uses the same plan guard from the Home detailed choice', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('button', { name: /開始記錄/ }))

    expect(
      screen.getByRole('dialog', { name: '開始精確計畫' }),
    ).toBeInTheDocument()
  })

  it('uses a valid hash over the stored preference', () => {
    const storage = new TestStorage({
      [STORAGE_PREFERRED_MODE]: 'diary',
    })
    window.history.replaceState(null, '', '/#quick')

    renderWithAppData(<App />, { storage })

    expect(
      screen.getByRole('heading', { name: '先看見方向 再決定步伐' }),
    ).toBeInTheDocument()
  })

  it('falls back to the stored preference for an invalid hash', () => {
    const storage = new TestStorage({
      [STORAGE_PREFERRED_MODE]: 'diary',
    })
    window.history.replaceState(null, '', '/#unknown')

    renderWithAppData(<App />, { storage })

    expect(
      screen.getByRole('heading', { name: '看見每一步的改變' }),
    ).toBeInTheDocument()
  })

  it('creates a named plan from the current Quick draft before entering Detailed', async () => {
    const user = userEvent.setup()
    const localUser = makeLocalUser({
      plans: [],
      selectedPlanId: null,
      preferredMode: 'quick',
    })
    const workspace = makeExportData({
      activeUserId: localUser.id,
      users: [localUser],
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(workspace),
    })
    window.history.replaceState(null, '', '/#quick')
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('switch', { name: '切換到精細計算' }))
    const dialog = screen.getByRole('dialog', { name: '開始精確計畫' })
    await user.type(
      screen.getByRole('textbox', { name: '計畫名稱' }),
      '第一個計畫',
    )
    await user.click(screen.getByRole('button', { name: '建立計畫' }))

    expect(dialog).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: '記下今天 讓預測回到真實生活',
      }),
    ).toBeInTheDocument()
    const stored = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(stored.users[0].plans[0]).toMatchObject({
      name: '第一個計畫',
      status: 'active',
      diary: [],
    })
  })

  it('opens an archived plan as read-only', () => {
    const archivedPlan = makePlan({
      status: 'archived',
      archivedAt: '2026-08-11T06:00:00.000Z',
    })
    const localUser = makeLocalUser({
      plans: [archivedPlan],
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
    window.history.replaceState(null, '', '/#diary')

    renderWithAppData(<App />, { storage })

    expect(screen.getByText('此計畫已封存，目前為唯讀模式')).toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: '新增紀錄' }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.pace-float')).not.toBeInTheDocument()
  })

  it('routes a diary-mode import without a selected plan to Quick', async () => {
    const user = userEvent.setup()
    const importedUser = makeLocalUser({
      plans: [],
      selectedPlanId: null,
      preferredMode: 'diary',
    })
    const storage = new TestStorage()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    window.history.replaceState(null, '', '/#quick')
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('Missing workspace import input')
    await user.upload(
      input,
      jsonFile(
        makeExportData({
          activeUserId: importedUser.id,
          users: [importedUser],
        }),
      ),
    )

    expect(
      await screen.findByRole('heading', {
        name: '先看見方向 再決定步伐',
      }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('#quick')
  })

  it('reactivates an archived plan with its complete diary history', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({
      id: 'plan_current_before_copy',
      name: '目前計畫',
    })
    const sourcePlan = makePlan({
      id: 'plan_archive_source',
      name: '舊計畫',
      status: 'archived',
      archivedAt: '2026-08-11T06:00:00.000Z',
      diary: [
        {
          date: '2026-08-10',
          actualWeightKg: 72,
          exerciseStatus: 'no',
          note: '',
          entries: [],
          updatedAt: '2026-08-10T06:00:00.000Z',
        },
      ],
    })
    const localUser = makeLocalUser({
      plans: [currentPlan, sourcePlan],
      selectedPlanId: sourcePlan.id,
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
    window.history.replaceState(null, '', '/#diary')
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    const planItem = screen
      .getAllByText('舊計畫')
      .map((element) => element.closest<HTMLElement>('.workspace-plan-item'))
      .find((element): element is HTMLElement => element !== null)
    if (!planItem) throw new Error('Missing archived plan item')
    await user.click(within(planItem).getByRole('button', { name: '重新啟用' }))
    const confirmation = screen.getByRole('dialog', {
      name: '重新啟用計畫？',
    })
    expect(confirmation).toHaveTextContent('目前計畫將封存為唯讀')
    expect(confirmation).toHaveTextContent('全部日記與體重會完整保留')
    let workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toHaveLength(2)
    expect(workspace.users[0].plans[0].status).toBe('active')
    await user.click(
      within(confirmation).getByRole('button', { name: '確認重新啟用' }),
    )

    workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0]).toMatchObject({
      id: currentPlan.id,
      status: 'archived',
    })
    expect(workspace.users[0].plans[1]).toMatchObject({
      id: sourcePlan.id,
      status: 'active',
      archivedAt: null,
      diary: sourcePlan.diary,
    })
    expect(workspace.users[0].plans).toHaveLength(2)
    expect(document.querySelector('.pace-float')).toBeInTheDocument()
  })

  it('returns to Quick after deleting the selected archived plan without an active fallback', async () => {
    const user = userEvent.setup()
    const archivedPlan = makePlan({
      id: 'plan_only_archive',
      name: '唯一封存計畫',
      status: 'archived',
      archivedAt: '2026-08-11T06:00:00.000Z',
    })
    const localUser = makeLocalUser({
      plans: [archivedPlan],
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
    window.history.replaceState(null, '', '/#diary')
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '刪除 唯一封存計畫' }))
    const dialog = screen.getByRole('dialog', {
      name: '永久刪除封存計畫？',
    })
    await user.click(within(dialog).getByRole('button', { name: '永久刪除' }))

    expect(
      screen.getByRole('heading', { name: '先看見方向 再決定步伐' }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('#quick')
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toEqual([])
    expect(workspace.users[0].selectedPlanId).toBeNull()
  })

  it('navigates to the replacement user Quick page after deleting the active user', async () => {
    const user = userEvent.setup()
    const firstUser = makeLocalUser({
      id: 'user_delete',
      name: '待刪除',
      preferredMode: 'diary',
    })
    const secondUser = makeLocalUser({
      id: 'user_keep',
      name: '保留使用者',
      plans: [],
      selectedPlanId: null,
      preferredMode: 'quick',
    })
    const storage = new TestStorage({
      [STORAGE_WORKSPACE]: JSON.stringify(
        makeExportData({
          activeUserId: firstUser.id,
          users: [firstUser, secondUser],
        }),
      ),
    })
    window.history.replaceState(null, '', '/#diary')
    renderWithAppData(<App />, { storage })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '刪除此使用者' }))
    const dialog = screen.getByRole('dialog', {
      name: '永久刪除使用者？',
    })
    await user.click(within(dialog).getByRole('button', { name: '永久刪除' }))

    expect(
      screen.getByRole('heading', {
        name: '先看見方向 再決定步伐',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('保留使用者')).toBeInTheDocument()
    expect(window.location.hash).toBe('#quick')
    expect(document.querySelector('.pace-float')).not.toBeInTheDocument()
  })

  it('warns that Quick is isolated and can atomically replace the formal plan', async () => {
    const user = userEvent.setup()
    const currentPlan = makePlan({
      id: 'plan_current',
      name: '目前正式計畫',
    })
    const localUser = makeLocalUser({
      plans: [currentPlan],
      selectedPlanId: currentPlan.id,
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
    window.history.replaceState(null, '', '/#quick')
    renderWithAppData(<App />, { storage })

    const intake = screen.getByLabelText('每日攝取熱量')
    await user.clear(intake)
    await user.type(intake, '1600')
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    const notice = screen.getByRole('dialog', {
      name: '快速試算已更新',
    })
    expect(notice).toHaveTextContent('不會影響正式計畫「目前正式計畫」')
    let workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0]).toMatchObject({
      status: 'active',
      profile: { intake: 1500 },
    })

    await user.click(within(notice).getByRole('button', { name: '只保留試算' }))
    expect(
      screen.queryByRole('dialog', { name: '快速試算已更新' }),
    ).not.toBeInTheDocument()
    workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans[0].status).toBe('active')

    const updatedIntake = screen.getByLabelText('每日攝取熱量')
    await user.clear(updatedIntake)
    await user.type(updatedIntake, '1700')
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))
    const replacementNotice = screen.getByRole('dialog', {
      name: '快速試算已更新',
    })
    await user.click(
      within(replacementNotice).getByRole('button', {
        name: '建立新正式計畫',
      }),
    )
    const startDialog = screen.getByRole('dialog', {
      name: '開始精確計畫',
    })
    expect(startDialog).toHaveTextContent('目前正式計畫將封存為唯讀')
    expect(
      within(startDialog).getByText('新計畫會使用目前試算設定'),
    ).toBeInTheDocument()
    expect(within(startDialog).getByText('日記從空白開始')).toBeInTheDocument()
    const nameInput = within(startDialog).getByRole('textbox', {
      name: '計畫名稱',
    })
    await user.type(nameInput, '新版正式計畫')
    await user.click(
      within(startDialog).getByRole('button', { name: '建立計畫' }),
    )

    const confirmation = screen.getByRole('dialog', {
      name: '封存並建立新計畫',
    })
    expect(confirmation).toHaveTextContent('目前正式計畫將封存為唯讀')
    workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toHaveLength(1)
    expect(workspace.users[0].plans[0].status).toBe('active')
    await user.click(
      within(confirmation).getByRole('button', { name: '封存並建立' }),
    )

    workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    expect(workspace.users[0].plans).toHaveLength(2)
    expect(workspace.users[0].plans[0]).toMatchObject({
      id: currentPlan.id,
      status: 'archived',
      profile: { intake: 1500 },
    })
    expect(workspace.users[0].plans[1]).toMatchObject({
      name: '新版正式計畫',
      status: 'active',
      diary: [],
      profile: { intake: 1700 },
    })
    expect(window.location.hash).toBe('#diary')
  })
})
