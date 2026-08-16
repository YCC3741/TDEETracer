import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NotificationStack } from '../../../src/components/NotificationStack'
import {
  STORAGE_DIARY,
  STORAGE_PROFILE,
  STORAGE_WORKSPACE,
} from '../../../src/domain/constants'
import { QuickPage } from '../../../src/features/quick/QuickPage'
import { renderWithAppData } from '../../helpers/renderWithAppData'
import { TestStorage } from '../../helpers/TestStorage'
import { makeDiaryDay, makeProfile } from '../../helpers/testData'

interface QuickValues {
  sex: 'female' | 'male'
  age: string
  height: string
  weight: string
  target: string
  activityLevel: string
  intake: string
}

const validValues: QuickValues = {
  sex: 'female',
  age: '30',
  height: '170',
  weight: '75',
  target: '65',
  activityLevel: 'light',
  intake: '1500',
}

const activityLabels: Record<string, string> = {
  sedentary: '久坐',
  light: '輕度',
  moderate: '中度',
  high: '高度',
  extreme: '超高強度',
}

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

function renderQuick(storage = new TestStorage()) {
  return renderWithAppData(
    <>
      <QuickPage />
      <NotificationStack />
    </>,
    { storage },
  )
}

function storedWorkspace(storage: TestStorage) {
  return JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
}

function storedQuickDraft(storage: TestStorage) {
  const workspace = storedWorkspace(storage)
  return workspace?.users.find(
    (user: { id: string }) => user.id === workspace.activeUserId,
  )?.quickDraft
}

async function fillQuickForm(
  user: ReturnType<typeof userEvent.setup>,
  values: QuickValues = validValues,
) {
  await chooseOption(user, '性別', values.sex === 'female' ? '女性' : '男性')
  await user.type(screen.getByLabelText('年齡'), values.age)
  await user.type(screen.getByLabelText('身高'), values.height)
  await user.type(screen.getByLabelText('起始體重'), values.weight)
  await user.type(screen.getByLabelText('目標體重'), values.target)
  await chooseOption(user, '平均活動量', activityLabels[values.activityLevel]!)
  await user.click(screen.getByRole('button', { name: '下一步：熱量策略' }))
  await user.type(screen.getByLabelText('每日攝取熱量'), values.intake)
  await user.click(screen.getByRole('button', { name: '下一步：確認估算' }))
}

describe('QuickPage interactions', () => {
  it('presents the draft as a layered journey with accessible completion status', async () => {
    const user = userEvent.setup()
    renderQuick()

    const summary = screen.getByRole('region', { name: 'Quick 旅程摘要' })
    const progress = screen.getByRole('progressbar', {
      name: 'Quick 資料完成度',
    })
    expect(summary).toHaveTextContent('— kg')
    expect(progress).toHaveAttribute('value', '0')

    await chooseOption(user, '性別', '女性')
    await user.type(screen.getByLabelText('年齡'), '30')

    expect(progress).toHaveAttribute('value', '2')
  })

  it('keeps document scrolling enabled while a select popup is open', async () => {
    const user = userEvent.setup()
    renderQuick()

    await user.click(screen.getByRole('combobox', { name: '性別' }))
    expect(await screen.findByRole('option', { name: '女性' })).toBeVisible()
    expect(document.documentElement.style.overflow).not.toBe('hidden')
    expect(document.body.style.overflow).not.toBe('hidden')

    await user.keyboard('{Escape}')
  })

  it('uses short activity labels with keyboard-accessible details', async () => {
    const user = userEvent.setup()
    renderQuick()

    await user.click(screen.getByRole('combobox', { name: '平均活動量' }))

    expect(await screen.findByRole('option', { name: '久坐' })).toBeVisible()
    expect(screen.getByRole('option', { name: '輕度' })).toBeVisible()
    const info = screen.getByLabelText('顯示說明 幾乎不運動')
    info.focus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('幾乎不運動')
  })

  it('moves through three explicit steps and saves only from the review step', async () => {
    const user = userEvent.setup()
    const { container, storage } = renderQuick()
    const form = document.querySelector('.quick-form')
    const firstDetailWindow = container.querySelector('.quick-detail-window')

    expect(form).toHaveAttribute('data-active-step', '1')
    expect(screen.getByRole('region', { name: 'Quick 旅程摘要' })).toHaveClass(
      'layered-panel-shell',
    )
    expect(firstDetailWindow).toHaveClass('layered-panel-shell')
    expect(
      screen.getByRole('heading', { name: '1. 身體資料' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('每日攝取熱量')).not.toBeInTheDocument()

    await chooseOption(user, '性別', '女性')
    await user.type(screen.getByLabelText('年齡'), '30')
    await user.type(screen.getByLabelText('身高'), '170')
    await user.type(screen.getByLabelText('起始體重'), '75')
    await user.type(screen.getByLabelText('目標體重'), '65')
    await chooseOption(user, '平均活動量', '輕度')
    await user.click(screen.getByRole('button', { name: '下一步：熱量策略' }))

    expect(form).toHaveAttribute('data-active-step', '2')
    const secondDetailWindow = container.querySelector('.quick-detail-window')
    expect(secondDetailWindow).not.toBe(firstDetailWindow)
    expect(
      screen.getByRole('heading', { name: '2. 熱量策略' }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('每日攝取熱量'), '1500')
    await user.click(screen.getByRole('button', { name: '下一步：確認估算' }))

    expect(form).toHaveAttribute('data-active-step', '3')
    expect(container.querySelector('.quick-detail-window')).not.toBe(
      secondDetailWindow,
    )
    expect(
      screen.getByRole('heading', { name: '3. 確認估算' }),
    ).toBeInTheDocument()
    expect(screen.getByText('75 kg → 65 kg')).toBeInTheDocument()
    expect(storage.getItem(STORAGE_WORKSPACE)).toBeNull()

    await user.click(screen.getByRole('button', { name: '計算減重路程' }))
    expect(storedQuickDraft(storage)).toMatchObject({
      weight: 75,
      target: 65,
      intake: 1500,
    })
  })

  it('hooks every profile input and intake submit to storage, notification and results', async () => {
    const user = userEvent.setup()
    const { storage, container } = renderQuick()
    const workspace = container.querySelector<HTMLElement>('.quick-workspace')

    expect(workspace).not.toHaveClass('has-results')

    await fillQuickForm(user)
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storedQuickDraft(storage)).toEqual({
      sex: 'female',
      age: 30,
      height: 170,
      weight: 75,
      target: 65,
      activityLevel: 'light',
      intake: 1500,
      deficit: null,
      mode: 'intake',
      planStartedAt: expect.any(String),
    })
    expect(
      screen.getByRole('heading', { name: '預估減重路程' }),
    ).toBeInTheDocument()
    const primaryResult = screen.getByRole('region', {
      name: 'Quick 主要結果',
    })
    expect(primaryResult).toHaveClass('layered-panel-shell')
    expect(within(primaryResult).getByText('每日建議攝取')).toBeInTheDocument()
    expect(within(primaryResult).getByText('1,500 kcal')).toBeInTheDocument()
    const routeEta = within(primaryResult).getByText('預估抵達').parentElement
    expect(routeEta).toHaveClass('quick-route-eta')
    expect(routeEta).toHaveTextContent(/約.+預估.+到達目標/)
    expect(
      within(primaryResult).queryByText('Quick 草稿已儲存'),
    ).not.toBeInTheDocument()
    expect(
      within(primaryResult).queryByText('查看估算假設與安全提醒'),
    ).not.toBeInTheDocument()
    const routeTrack =
      primaryResult.querySelector<HTMLElement>('.quick-route-track')
    expect(
      routeTrack?.querySelector('.quick-route-start-node'),
    ).toHaveAttribute('data-size', 'small')
    expect(routeTrack?.querySelector('.quick-route-goal-node')).toHaveAttribute(
      'data-state',
      'complete',
    )
    expect(routeTrack?.querySelector('i')).not.toBeInTheDocument()
    expect(workspace).toHaveClass('has-results')
    expect(
      workspace?.querySelector(':scope > .quick-configurator'),
    ).toBeInTheDocument()
    expect(workspace?.querySelector(':scope > .results')).toBeInTheDocument()
    expect(screen.getByText('已儲存 Quick 草稿。')).toBeInTheDocument()

    const routeTab = screen.getByRole('tab', { name: '預估減重路程' })
    const tdeeTab = screen.getByRole('tab', { name: 'TDEE 看板' })
    const chartTab = screen.getByRole('tab', { name: '體重曲線' })
    const tableTab = screen.getByRole('tab', { name: '每月預估' })

    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(routeTab).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.queryByRole('heading', { name: '各活動量 TDEE 看板' }),
    ).not.toBeInTheDocument()

    await user.click(tdeeTab)
    expect(
      screen.getByRole('heading', { name: '各活動量 TDEE 看板' }),
    ).toBeInTheDocument()

    await user.click(chartTab)
    expect(
      screen.getByRole('heading', { name: '體重變化預估' }),
    ).toBeInTheDocument()

    await user.click(tableTab)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('keeps the formal plan unchanged when the Quick draft changes', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage({
      [STORAGE_PROFILE]: JSON.stringify(
        makeProfile({ weight: 75, planStartedAt: '2026-08-01' }),
      ),
      [STORAGE_DIARY]: JSON.stringify([
        makeDiaryDay('2026-08-10', {
          actualWeightKg: 71.8,
          entries: [],
        }),
      ]),
    })
    renderQuick(storage)

    await user.click(
      screen.getByRole('button', { name: '前往步驟 1：身體資料' }),
    )
    const weight = screen.getByLabelText('起始體重')
    await user.clear(weight)
    await user.type(weight, '80')
    await user.click(
      screen.getByRole('button', { name: '前往步驟 2：熱量策略' }),
    )
    const intake = screen.getByLabelText('每日攝取熱量')
    await user.clear(intake)
    await user.type(intake, '1600')
    await user.click(screen.getByRole('button', { name: '下一步：確認估算' }))
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storedQuickDraft(storage)).toMatchObject({
      weight: 80,
      intake: 1600,
    })
    const workspace = storedWorkspace(storage)
    expect(workspace.users[0].plans[0].profile.weight).toBe(75)
    expect(screen.getByText('已儲存 Quick 草稿。')).toBeInTheDocument()
  })

  it('hooks the fixed-deficit switch and Enter submit to the deficit strategy', async () => {
    const user = userEvent.setup()
    const { storage } = renderQuick()

    await chooseOption(user, '性別', '男性')
    await user.type(screen.getByLabelText('年齡'), '30')
    await user.type(screen.getByLabelText('身高'), '180')
    await user.type(screen.getByLabelText('起始體重'), '90')
    await user.type(screen.getByLabelText('目標體重'), '75')
    await chooseOption(user, '平均活動量', '中度')
    await user.click(screen.getByRole('button', { name: '下一步：熱量策略' }))
    await user.click(screen.getByRole('button', { name: '設定固定赤字' }))
    expect(screen.getByLabelText('每日固定赤字')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '設定每日攝取' }))
    expect(screen.getByLabelText('每日攝取熱量')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '設定固定赤字' }))
    const deficitInput = screen.getByLabelText('每日固定赤字')
    await user.type(deficitInput, '500')
    await user.type(deficitInput, '{Enter}')
    expect(
      screen.getByRole('heading', { name: '3. 確認估算' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storedQuickDraft(storage)).toMatchObject({
      sex: 'male',
      mode: 'deficit',
      intake: null,
      deficit: 500,
    })
    expect(
      screen.getByRole('heading', { name: '預估減重路程' }),
    ).toBeInTheDocument()
    const primaryResult = screen.getByRole('region', {
      name: 'Quick 主要結果',
    })
    expect(within(primaryResult).getByText('每日固定赤字')).toBeInTheDocument()
    expect(within(primaryResult).getByText('500 kcal')).toBeInTheDocument()
  })

  it('rejects a target that is not below the starting weight', async () => {
    const user = userEvent.setup()
    const { storage } = renderQuick()

    await fillQuickForm(user, { ...validValues, target: '75' })
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storage.getItem(STORAGE_WORKSPACE)).toBeNull()
    expect(screen.getByText('目標體重必須低於起始體重。')).toBeInTheDocument()
  })

  it('rejects an intake that does not create a deficit', async () => {
    const user = userEvent.setup()
    const { storage } = renderQuick()

    await fillQuickForm(user, { ...validValues, intake: '3000' })
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storage.getItem(STORAGE_WORKSPACE)).toBeNull()
    expect(
      screen.getByText('目前設定沒有足夠熱量赤字，無法估算下降路徑。'),
    ).toBeInTheDocument()
  })

  it('keeps safety warnings in notifications without a persistent result card', async () => {
    const user = userEvent.setup()
    renderQuick()

    await fillQuickForm(user, { ...validValues, intake: '1100' })
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    const result = screen.getByRole('region', { name: 'Quick 主要結果' })
    expect(
      screen.getByText('每日攝取 1100 kcal 低於一般建議下限（1200 kcal）。'),
    ).toBeInTheDocument()
    expect(result).not.toHaveTextContent(
      '每日攝取 1100 kcal 低於一般建議下限（1200 kcal）。',
    )
    expect(
      within(result).queryByRole('note', { name: '安全提醒' }),
    ).not.toBeInTheDocument()
  })

  it('keeps out-of-range values on the profile step with an inline error', async () => {
    const user = userEvent.setup()
    const { storage } = renderQuick()

    await chooseOption(user, '性別', '女性')
    await user.type(screen.getByLabelText('年齡'), '101')
    await user.type(screen.getByLabelText('身高'), '170')
    await user.type(screen.getByLabelText('起始體重'), '75')
    await user.type(screen.getByLabelText('目標體重'), '65')
    await chooseOption(user, '平均活動量', '輕度')
    await user.click(screen.getByRole('button', { name: '下一步：熱量策略' }))

    expect(storage.getItem(STORAGE_WORKSPACE)).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent(
      '年齡必須介於 14 至 100 歲。',
    )
    expect(
      screen.getByRole('heading', { name: '1. 身體資料' }),
    ).toBeInTheDocument()
  })

  it('does not announce success when profile persistence fails', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    storage.failWritesFor(STORAGE_WORKSPACE)
    renderQuick(storage)

    await fillQuickForm(user)
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(screen.getByText('無法儲存 Quick 草稿。')).toBeInTheDocument()
    expect(screen.queryByText('已儲存 Quick 草稿。')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '預估減重路程' }),
    ).not.toBeInTheDocument()
  })
})
