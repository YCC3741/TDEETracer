import { screen } from '@testing-library/react'
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
  factor: string
  intake: string
}

const validValues: QuickValues = {
  sex: 'female',
  age: '30',
  height: '170',
  weight: '75',
  target: '65',
  factor: '1.375',
  intake: '1500',
}

const activityLabels: Record<string, string> = {
  '1.2': '久坐',
  '1.375': '輕度',
  '1.55': '中度',
  '1.725': '高度',
  '1.9': '超高強度',
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
  await chooseOption(user, '平均活動量', activityLabels[values.factor]!)
  await user.type(screen.getByLabelText('每日攝取熱量'), values.intake)
}

describe('QuickPage interactions', () => {
  it('keeps document scrolling enabled while a select popup is open', async () => {
    const user = userEvent.setup()
    renderQuick()

    await user.click(screen.getByRole('combobox', { name: '性別' }))
    expect(await screen.findByRole('option', { name: '女性' })).toBeVisible()
    expect(document.documentElement.style.overflow).not.toBe('hidden')
    expect(document.body.style.overflow).not.toBe('hidden')

    await user.keyboard('{Escape}')
  })

  it('uses short activity labels with hover details', async () => {
    const user = userEvent.setup()
    renderQuick()

    await user.click(screen.getByRole('combobox', { name: '平均活動量' }))

    expect(await screen.findByRole('option', { name: '久坐' })).toBeVisible()
    expect(screen.getByRole('option', { name: '輕度' })).toBeVisible()
    const info = screen.getByLabelText('顯示說明 幾乎不運動')
    await user.hover(info)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('幾乎不運動')
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
      factor: 1.375,
      intake: 1500,
      deficit: null,
      mode: 'intake',
      planStartedAt: expect.any(String),
    })
    expect(
      screen.getByRole('heading', { name: '預估減重路程' }),
    ).toBeInTheDocument()
    expect(workspace).toHaveClass('has-results')
    expect(workspace?.querySelector(':scope > .form-card')).toBeInTheDocument()
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

    const intake = screen.getByLabelText('每日攝取熱量')
    const weight = screen.getByLabelText('起始體重')
    await user.clear(weight)
    await user.type(weight, '80')
    await user.clear(intake)
    await user.type(intake, '1600')
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

    await user.click(screen.getByRole('button', { name: '設定固定赤字' }))
    expect(screen.getByLabelText('每日固定赤字')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '設定每日攝取' }))
    expect(screen.getByLabelText('每日攝取熱量')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '設定固定赤字' }))
    await chooseOption(user, '性別', '男性')
    await user.type(screen.getByLabelText('年齡'), '30')
    await user.type(screen.getByLabelText('身高'), '180')
    await user.type(screen.getByLabelText('起始體重'), '90')
    await user.type(screen.getByLabelText('目標體重'), '75')
    await chooseOption(user, '平均活動量', '中度')
    const deficitInput = screen.getByLabelText('每日固定赤字')
    await user.type(deficitInput, '500')
    await user.type(deficitInput, '{Enter}')

    expect(storedQuickDraft(storage)).toMatchObject({
      sex: 'male',
      mode: 'deficit',
      intake: null,
      deficit: 500,
    })
    expect(
      screen.getByRole('heading', { name: '預估減重路程' }),
    ).toBeInTheDocument()
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

  it('lets native input ranges block out-of-range values', async () => {
    const user = userEvent.setup()
    const { storage } = renderQuick()

    await fillQuickForm(user, { ...validValues, age: '101' })
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(storage.getItem(STORAGE_WORKSPACE)).toBeNull()
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
