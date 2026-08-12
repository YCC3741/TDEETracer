import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../../../src/App'
import { STORAGE_WORKSPACE } from '../../../src/domain/constants'
import { TourProvider } from '../../../src/features/tour/TourProvider'
import {
  STORAGE_GUIDED_TOUR,
  readTourPreference,
} from '../../../src/features/tour/tourStorage'
import { renderWithAppData } from '../../helpers/renderWithAppData'
import { TestStorage } from '../../helpers/TestStorage'
import { makeExportData, makeLocalUser } from '../../helpers/testData'

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

async function nextStep(user: ReturnType<typeof userEvent.setup>) {
  const button = screen.getByRole('button', { name: '下一步' })
  await waitFor(() => expect(button).toBeEnabled())
  await user.click(button)
}

function renderGuidedApp(
  options: {
    workspace?: ReturnType<typeof makeExportData>
    tourPreference?: 'completed' | 'skipped'
  } = {},
) {
  const workspaceStorage = new TestStorage(
    options.workspace
      ? { [STORAGE_WORKSPACE]: JSON.stringify(options.workspace) }
      : {},
  )
  const tourStorage = new TestStorage(
    options.tourPreference
      ? {
          [STORAGE_GUIDED_TOUR]: JSON.stringify({
            version: 1,
            status: options.tourPreference,
          }),
        }
      : {},
  )
  const result = renderWithAppData(
    <TourProvider storage={tourStorage}>
      <App />
    </TourProvider>,
    { storage: workspaceStorage },
  )
  return { ...result, workspaceStorage, tourStorage }
}

describe('Guided Tour', () => {
  it('offers a first-visit welcome and remembers when it is skipped', async () => {
    const user = userEvent.setup()
    const { tourStorage } = renderGuidedApp()

    const welcome = screen.getByRole('dialog', { name: '第一次使用嗎' })
    const start = within(welcome).getByRole('button', {
      name: '開始新手教學',
    })
    await waitFor(() => expect(start).toHaveFocus())
    await user.keyboard('{Escape}')

    expect(welcome).not.toBeInTheDocument()
    expect(readTourPreference(tourStorage)).toBe('skipped')
  })

  it('guides real data through Quick, plan, food, exercise and weight', async () => {
    const user = userEvent.setup()
    const { workspaceStorage, tourStorage } = renderGuidedApp()

    await user.click(
      within(screen.getByRole('dialog', { name: '第一次使用嗎' })).getByRole(
        'button',
        { name: '開始新手教學' },
      ),
    )
    expect(
      await screen.findByRole('dialog', { name: '從 Quick 開始' }),
    ).toBeInTheDocument()

    await nextStep(user)
    await chooseOption(user, '性別', '女性')
    await user.type(screen.getByLabelText('年齡'), '30')
    await user.type(screen.getByLabelText('身高'), '170')
    await user.type(screen.getByLabelText('起始體重'), '75')
    await user.type(screen.getByLabelText('目標體重'), '65')
    await chooseOption(user, '平均活動量', '輕度')

    await nextStep(user)
    await user.type(screen.getByLabelText('每日攝取熱量'), '1500')
    await nextStep(user)
    expect(
      screen.getByRole('button', { name: '請完成目前操作' }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))

    expect(
      await screen.findByRole('dialog', { name: '查看動態預估' }),
    ).toBeInTheDocument()
    await nextStep(user)
    await user.click(screen.getByRole('button', { name: '前往追蹤日誌' }))

    const planDialog = await screen.findByRole('dialog', {
      name: '開始精確計畫',
    })
    expect(
      await screen.findByRole('dialog', { name: '命名正式計畫' }),
    ).toBeInTheDocument()
    await user.type(
      within(planDialog).getByRole('textbox', { name: '計畫名稱' }),
      '我的第一個計畫',
    )
    await user.click(
      within(planDialog).getByRole('button', { name: '建立計畫' }),
    )

    expect(
      await screen.findByRole('dialog', { name: '認識每日路徑' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '七日日期導覽' }),
    ).toHaveAttribute('data-tour-anchor', 'diary-date-rail')
    await nextStep(user)

    expect(
      await screen.findByRole('dialog', { name: '認識每日紀錄' }),
    ).toBeInTheDocument()
    const foodDestination = screen.getByRole('button', { name: '新增飲食' })
    expect(foodDestination).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('button', { name: '請完成目前操作' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('heading', { name: '新增今日紀錄' }),
    ).not.toBeInTheDocument()
    await user.click(foodDestination)
    expect(
      await screen.findByRole('dialog', { name: '新增一筆飲食' }),
    ).toBeInTheDocument()
    expect(foodDestination).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByLabelText('熱量（kcal）'), '500')
    await user.click(screen.getByRole('button', { name: '＋ 新增飲食並計算' }))

    expect(
      await screen.findByRole('button', {
        name: /解鎖 Journey Milestone：初來乍到/,
      }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '新增運動' }))
    expect(
      await screen.findByRole('dialog', { name: '新增一筆運動' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '上一步' }))
    expect(
      await screen.findByRole('dialog', { name: '切換到運動' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('熱量（kcal）')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '新增運動' }))
    await user.click(screen.getByRole('button', { name: '＋ 新增運動並計算' }))

    await user.click(screen.getByRole('button', { name: '記錄體重' }))
    expect(
      await screen.findByRole('dialog', { name: '記錄實際體重' }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('實際體重（kg）'), '74.5')
    await user.click(screen.getByRole('button', { name: '＋ 新增體重紀錄' }))

    expect(
      await screen.findByRole('dialog', { name: '查看當日紀錄' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '請完成目前操作' }),
    ).toBeDisabled()
    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 3 筆' }),
    )
    expect(
      await screen.findByRole('dialog', { name: '管理當日紀錄' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '當日紀錄' }).closest('section'),
    ).toHaveAttribute('data-tour-anchor', 'records-panel')
    await user.click(screen.getByRole('button', { name: '上一步' }))
    expect(
      await screen.findByRole('dialog', { name: '查看當日紀錄' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 3 筆' }),
    )
    expect(
      await screen.findByRole('dialog', { name: '管理當日紀錄' }),
    ).toBeInTheDocument()
    await nextStep(user)

    expect(
      await screen.findByRole('dialog', { name: '查看旅程成就' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '請完成目前操作' }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '查看成就' }))
    expect(
      await screen.findByRole('dialog', { name: '累積旅程成就' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '旅程成就' }).closest('section'),
    ).toHaveAttribute('data-tour-anchor', 'achievement-panel')
    await user.click(screen.getByRole('button', { name: '上一步' }))
    expect(
      await screen.findByRole('dialog', { name: '查看旅程成就' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看成就' }))
    expect(
      await screen.findByRole('dialog', { name: '累積旅程成就' }),
    ).toBeInTheDocument()
    await nextStep(user)

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '略過教學' }),
      ).not.toBeInTheDocument(),
    )
    expect(readTourPreference(tourStorage)).toBe('completed')

    const workspace = JSON.parse(
      workspaceStorage.getItem(STORAGE_WORKSPACE) ?? 'null',
    )
    expect(workspace.users[0].plans[0]).toMatchObject({
      name: '我的第一個計畫',
      status: 'active',
      diary: [
        {
          actualWeightKg: 74.5,
          entries: [{ type: 'food', kcal: 500 }, { type: 'exercise' }],
        },
      ],
    })
    expect(tourStorage.getItem(STORAGE_GUIDED_TOUR)).toContain('completed')
  })

  it('restarts from the Drawer and reuses an existing active plan', async () => {
    const user = userEvent.setup()
    const localUser = makeLocalUser()
    renderGuidedApp({
      workspace: makeExportData({
        activeUserId: localUser.id,
        users: [localUser],
      }),
      tourPreference: 'completed',
    })

    await user.click(screen.getByRole('button', { name: '開啟工作區選單' }))
    await user.click(screen.getByRole('button', { name: '重新開始新手教學' }))
    const welcome = await screen.findByRole('dialog', { name: '第一次使用嗎' })
    await user.click(
      within(welcome).getByRole('button', { name: '開始新手教學' }),
    )

    await nextStep(user)
    await nextStep(user)
    const intake = screen.getByLabelText('每日攝取熱量')
    await user.clear(intake)
    await user.type(intake, '1550')
    await nextStep(user)
    await user.click(screen.getByRole('button', { name: '計算減重路程' }))
    expect(
      screen.queryByRole('dialog', { name: '快速試算已更新' }),
    ).not.toBeInTheDocument()
    await nextStep(user)
    await user.click(screen.getByRole('button', { name: '前往追蹤日誌' }))

    expect(
      await screen.findByRole('dialog', { name: '認識每日路徑' }),
    ).toBeInTheDocument()
    await nextStep(user)
    expect(
      await screen.findByRole('dialog', { name: '認識每日紀錄' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增飲食' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.queryByRole('dialog', { name: '開始精確計畫' }),
    ).not.toBeInTheDocument()
  })
})
