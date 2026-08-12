import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationStack } from '../../../src/components/NotificationStack'
import {
  STORAGE_ACHIEVEMENTS,
  STORAGE_DIARY,
  STORAGE_PROFILE,
  STORAGE_WORKSPACE,
} from '../../../src/domain/constants'
import { DiaryPage } from '../../../src/features/diary/DiaryPage'
import { renderWithAppData } from '../../helpers/renderWithAppData'
import { TestStorage } from '../../helpers/TestStorage'
import { makeDiaryDay, makeProfile } from '../../helpers/testData'

function makeDiaryStorage(days = [makeDiaryDay('2026-08-03')]) {
  return new TestStorage({
    [STORAGE_PROFILE]: JSON.stringify(makeProfile()),
    [STORAGE_DIARY]: JSON.stringify(days),
    [STORAGE_ACHIEVEMENTS]: JSON.stringify(days.length ? [1] : []),
  })
}

function renderDiary(storage = makeDiaryStorage()) {
  return renderWithAppData(
    <>
      <DiaryPage />
      <NotificationStack />
    </>,
    { storage },
  )
}

function storedDiary(storage: TestStorage) {
  const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
  if (!workspace) return JSON.parse(storage.getItem(STORAGE_DIARY) ?? '[]')
  const user = workspace.users.find(
    (item: { id: string }) => item.id === workspace.activeUserId,
  )
  return (
    user?.plans.find((plan: { id: string }) => plan.id === user.selectedPlanId)
      ?.diary ?? []
  )
}

function storedAchievements(storage: TestStorage) {
  const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
  const user = workspace?.users.find(
    (item: { id: string }) => item.id === workspace.activeUserId,
  )
  return user?.achievementsSeen ?? []
}

async function chooseTime(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  hour: string,
  minute: string,
) {
  await user.click(screen.getByLabelText(label))
  const popup = await screen.findByRole('dialog', { name: '選擇時間' })
  await user.click(within(popup).getByRole('option', { name: `${hour} 時` }))
  await user.click(within(popup).getByRole('option', { name: `${minute} 分` }))
  await user.click(within(popup).getByRole('button', { name: '套用' }))
}

describe('DiaryPage date and entry interactions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-11T08:30:00'))
  })

  it('uses a seven-day rail and opens the complete marked month on demand', async () => {
    const user = userEvent.setup()
    const { container } = renderDiary()

    const rail = screen.getByRole('region', { name: '七日日期導覽' })
    expect(
      within(rail).getAllByRole('button', { name: /選擇 2026\/08\// }),
    ).toHaveLength(7)
    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/08\/11/ }),
    ).toHaveAttribute('aria-current', 'date')
    expect(
      within(rail)
        .getByRole('button', { name: /選擇 2026\/08\/11/ })
        .querySelector('.date-today-marker'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '2026 年 8 月' }),
    ).not.toBeInTheDocument()

    await user.click(within(rail).getByRole('button', { name: '開啟完整月曆' }))
    const calendar = screen.getByRole('dialog', { name: '完整月曆' })
    expect(
      within(calendar).getByRole('heading', { name: '2026 年 8 月' }),
    ).toBeInTheDocument()
    expect(
      within(calendar).getByRole('button', { name: '2026/08/03，有簽到紀錄' }),
    ).toHaveClass('checked')
    expect(
      within(calendar)
        .getByRole('button', { name: '2026/08/11' })
        .querySelector('.date-today-marker'),
    ).toBeInTheDocument()

    await user.click(
      within(calendar).getByRole('button', { name: '2026/08/05' }),
    )
    expect(calendar).not.toBeInTheDocument()
    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/08\/05/ }),
    ).toHaveAttribute('aria-current', 'date')
    expect(container.querySelector('.diary-date-rail')).toBeInTheDocument()
  })

  it('keeps five editor destinations visible and opens their content', async () => {
    const user = userEvent.setup()
    const { container } = renderDiary()
    const dashboard = container.querySelector<HTMLElement>('.diary-dashboard')
    let editor = container.querySelector<HTMLElement>('.diary-editor')

    expect(dashboard).toContainElement(editor)
    expect(
      container.querySelector('.diary-overview-card'),
    ).not.toBeInTheDocument()
    if (!dashboard || !editor) throw new Error('Missing diary editor layout')
    const editorLayout = dashboard.querySelector<HTMLElement>(
      '.diary-editor-layout',
    )
    const editorStage = dashboard.querySelector<HTMLElement>(
      '.diary-editor-stage',
    )
    const initialEditorBody =
      editor.querySelector<HTMLElement>('.diary-editor-body')
    const entriesDestination = within(dashboard).getByRole('button', {
      name: '查看當日紀錄，共 0 筆',
    })
    const foodCategory = within(dashboard).getByRole('button', {
      name: '新增飲食',
    })
    const exerciseCategory = within(dashboard).getByRole('button', {
      name: '新增運動',
    })
    const weightCategory = within(dashboard).getByRole('button', {
      name: '記錄體重',
    })
    expect(foodCategory).toHaveAttribute('aria-pressed', 'false')
    const achievementCategory = within(dashboard).getByRole('button', {
      name: '查看成就',
    })
    expect(achievementCategory).toHaveAttribute('aria-pressed', 'false')
    const categoryRail = dashboard.querySelector<HTMLElement>(
      '.layered-category-rail',
    )
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'false')
    expect(editorStage).toHaveAttribute('data-open', 'false')
    expect(categoryRail).toHaveAttribute('data-expanded', 'false')
    expect(editor).toHaveAttribute('aria-hidden', 'true')
    expect(editor).toHaveAttribute('inert')
    expect(categoryRail?.children).toHaveLength(5)
    expect(
      within(categoryRail!)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      '新增飲食',
      '新增運動',
      '記錄體重',
      '查看當日紀錄，共 0 筆',
      '查看成就',
    ])
    expect(
      screen.queryByRole('heading', { name: '新增今日紀錄' }),
    ).not.toBeInTheDocument()
    const dateRailSummary = container.querySelector('.date-rail-summary')
    expect(dateRailSummary).toHaveTextContent('飲食攝取+0 kcal')
    expect(dateRailSummary).toHaveTextContent('運動消耗−0 kcal')
    expect(dateRailSummary?.parentElement).toHaveClass('date-rail-copy')
    const weeklyProgress = screen.getByRole('progressbar', {
      name: '本週簽到進度',
    })
    expect(weeklyProgress).toHaveAttribute('max', '7')
    expect(weeklyProgress.closest('aside')).toHaveClass(
      'weekly-progress-hud',
      'floating-route-hud',
    )

    await user.click(achievementCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing achievement editor')
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'true')
    expect(editorStage).toHaveAttribute('data-open', 'true')
    expect(categoryRail).toHaveAttribute('data-expanded', 'true')
    expect(achievementCategory).toHaveAttribute('aria-pressed', 'true')
    expect(editor).toHaveAttribute('data-animated-panel', 'true')
    expect(editor.querySelector('.diary-editor-body')).not.toBe(
      initialEditorBody,
    )
    expect(
      within(editor).getByRole('heading', { name: '旅程成就' }),
    ).toBeInTheDocument()
    expect(within(editor).queryByLabelText('日期')).not.toBeInTheDocument()
    expect(editor.querySelector('.day-summary')).not.toBeInTheDocument()
    const achievementPanel = editor.querySelector<HTMLElement>(
      '.entry-achievement-panel',
    )
    expect(
      within(editor).getByText('Achievements / Journey'),
    ).toBeInTheDocument()
    expect(
      within(editor).queryByRole('heading', { name: 'Journey Milestones' }),
    ).not.toBeInTheDocument()
    expect(within(editor).queryByText('跨計畫累積')).not.toBeInTheDocument()
    expect(
      within(editor).queryByText(
        '統計目前使用者的所有正式計畫；已封存計畫與永久解鎖里程碑都會保留。',
      ),
    ).not.toBeInTheDocument()
    expect(editor.querySelector('.entry-active-ribbon')).not.toBeInTheDocument()
    expect(within(achievementPanel!).getByText('初來乍到')).toBeInTheDocument()
    expect(achievementPanel).toHaveTextContent('累積紀錄1 日')
    expect(achievementPanel).toHaveTextContent('最長連續1 日')
    expect(
      achievementPanel?.querySelector('.achievement-node > i'),
    ).toBeInTheDocument()
    expect(achievementPanel?.closest('.entry-form-window')).not.toBeNull()
    await user.click(achievementCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing collapsed editor')
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'false')
    expect(editorStage).toHaveAttribute('data-open', 'false')
    expect(categoryRail).toHaveAttribute('data-expanded', 'false')
    expect(achievementCategory).toHaveAttribute('aria-pressed', 'false')
    expect(editor).toHaveAttribute('aria-hidden', 'true')
    await user.click(foodCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing direct-entry editor')
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'true')
    expect(editorLayout).toHaveAttribute('data-entry-layout', 'direct')
    expect(
      dashboard.querySelector('.diary-entry-route-ribbon.food'),
    ).toBeInTheDocument()
    expect(
      within(editor).getByRole('heading', { name: '新增飲食' }),
    ).toBeInTheDocument()
    expect(within(editor).queryByLabelText('日期')).not.toBeInTheDocument()
    expect(editor.querySelector('.day-summary')).not.toBeInTheDocument()

    const foodEditor = editor
    await user.click(exerciseCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing exercise editor')
    expect(editor).not.toBe(foodEditor)
    expect(
      dashboard.querySelector('.diary-entry-route-ribbon.exercise'),
    ).toBeInTheDocument()
    expect(
      within(editor).getByRole('heading', { name: '新增運動' }),
    ).toBeInTheDocument()

    const exerciseEditor = editor
    await user.click(weightCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing weight editor')
    expect(editor).not.toBe(exerciseEditor)
    expect(
      dashboard.querySelector('.diary-entry-route-ribbon.weight'),
    ).toBeInTheDocument()
    expect(
      within(editor).getByRole('heading', { name: '記錄體重' }),
    ).toBeInTheDocument()

    await user.click(foodCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing restored food editor')

    await user.click(entriesDestination)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing entries editor')
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'true')
    expect(editorLayout).toHaveAttribute('data-entry-layout', 'standard')
    expect(editor).toHaveAttribute('data-animated-panel', 'true')
    expect(
      dashboard.querySelector('.diary-entry-route-ribbon'),
    ).not.toBeInTheDocument()
    expect(entriesDestination).toHaveAttribute('aria-pressed', 'true')
    expect(foodCategory).toHaveAttribute('aria-pressed', 'false')
    expect(categoryRail?.children).toHaveLength(5)
    expect(
      within(editor).getByRole('heading', { name: '當日紀錄' }),
    ).toBeInTheDocument()
    expect(within(editor).getByText('Records / Daily Log')).toBeInTheDocument()
    expect(editor.querySelector('.section-head')).toHaveAttribute(
      'data-compact',
      'true',
    )
    expect(
      within(editor).getByText('這一天還沒有任何紀錄。'),
    ).toBeInTheDocument()
    expect(
      within(editor).queryByLabelText('熱量（kcal）'),
    ).not.toBeInTheDocument()
    expect(within(editor).queryByLabelText('日期')).not.toBeInTheDocument()
    expect(editor.querySelector('.day-summary')).not.toBeInTheDocument()
    const entriesPanel = editor.querySelector<HTMLElement>(
      '.editor-entries-panel',
    )
    expect(entriesPanel).toHaveClass('editor-entries-panel')
    expect(entriesPanel?.querySelector('.entry-list')).toBeInTheDocument()
    expect(entriesPanel?.querySelector('.button-row')).toBeInTheDocument()

    await user.click(entriesDestination)
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'false')
    expect(categoryRail).toHaveAttribute('data-expanded', 'false')
    await user.click(foodCategory)
    editor = dashboard.querySelector<HTMLElement>('.diary-editor')
    if (!editor) throw new Error('Missing reopened direct-entry editor')
    expect(editorLayout).toHaveAttribute('data-rail-expanded', 'true')
    expect(foodCategory).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(editor).getByRole('heading', { name: '新增飲食' }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', { name: '2026 年 8 月' }),
    ).not.toBeInTheDocument()
  })

  it('keeps actions outside a scrollable list when records exceed five', async () => {
    const user = userEvent.setup()
    const day = makeDiaryDay('2026-08-11', {
      entries: Array.from({ length: 6 }, (_, index) => ({
        id: `food-${index}`,
        type: 'food' as const,
        time: '12:00',
        label: '飲食',
        kcal: 100 + index,
      })),
    })
    const { container } = renderDiary(makeDiaryStorage([day]))

    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 6 筆' }),
    )

    const entryList = container.querySelector<HTMLElement>('.entry-list')
    const deleteDayButton = screen.getByRole('button', {
      name: '刪除此日全部',
    })
    expect(entryList).toHaveAttribute('data-scrollable', 'true')
    expect(entryList).toHaveAttribute('tabindex', '0')
    expect(entryList).toHaveAccessibleName('當日紀錄列表，共 6 筆')
    expect(entryList?.querySelectorAll('.entry-row.food')).toHaveLength(6)
    expect(entryList).not.toContainElement(deleteDayButton)
  })

  it('adds, overwrites and removes one actual weight without a check-in', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    const { container } = renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '記錄體重' }))
    const weightInput = screen.getByLabelText('實際體重（kg）')
    await user.type(weightInput, '72.4')
    await user.click(screen.getByRole('button', { name: '＋ 新增體重紀錄' }))

    expect(storedDiary(storage)).toMatchObject([
      {
        date: '2026-08-11',
        actualWeightKg: 72.4,
        entries: [],
      },
    ])
    expect(storedAchievements(storage)).toEqual([])
    expect(container.querySelector('.date-rail-days .today')).not.toHaveClass(
      'checked',
    )

    const savedWeightInput = screen.getByLabelText('實際體重（kg）')
    await user.clear(savedWeightInput)
    await user.type(savedWeightInput, '72.1')
    await user.click(screen.getByRole('button', { name: '更新體重紀錄' }))
    expect(storedDiary(storage)[0].actualWeightKg).toBe(72.1)

    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 1 筆' }),
    )
    expect(screen.getByText('72.1 kg')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '刪除此體重紀錄' }))
    expect(storedDiary(storage)).toEqual([])
  })

  it('edits food, exercise and weight records from their rows', async () => {
    const user = userEvent.setup()
    const day = makeDiaryDay('2026-08-11', {
      actualWeightKg: 72.8,
      entries: [
        {
          id: 'food_edit',
          type: 'food',
          time: '11:08',
          label: '飲食',
          kcal: 580,
        },
        {
          id: 'exercise_edit',
          type: 'exercise',
          time: '11:47',
          presetId: 'walk',
          name: '走路（一般）',
          met: 3.5,
          minutes: 7,
          kcal: 30,
        },
      ],
    })
    const storage = makeDiaryStorage([day])
    renderDiary(storage)
    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 3 筆' }),
    )

    await user.click(screen.getByRole('button', { name: '編輯飲食紀錄 11:08' }))
    let dialog = screen.getByRole('dialog', { name: '編輯飲食紀錄' })
    const calorieInput = within(dialog).getByLabelText('熱量（kcal）')
    expect(calorieInput).toHaveValue(580)
    await user.clear(calorieInput)
    await user.type(calorieInput, '620')
    await user.click(
      within(dialog).getByRole('button', { name: '儲存飲食修改' }),
    )

    expect(storedDiary(storage)[0].entries[0]).toMatchObject({
      id: 'food_edit',
      kcal: 620,
    })

    const exerciseEdit = screen.getByRole('button', {
      name: '編輯運動紀錄 走路（一般） 11:47',
    })
    exerciseEdit.focus()
    await user.keyboard('{Enter}')
    dialog = screen.getByRole('dialog', { name: '編輯運動紀錄' })
    const minutesInput = within(dialog).getByLabelText('時長（分）')
    expect(minutesInput).toHaveValue(7)
    await user.clear(minutesInput)
    await user.type(minutesInput, '14')
    await user.click(
      within(dialog).getByRole('button', { name: '儲存運動修改' }),
    )

    expect(storedDiary(storage)[0].entries[1]).toMatchObject({
      id: 'exercise_edit',
      minutes: 14,
      kcal: 59,
    })

    await user.click(
      screen.getByRole('button', { name: '編輯體重紀錄 72.8 kg' }),
    )
    dialog = screen.getByRole('dialog', { name: '編輯體重紀錄' })
    const weightInput = within(dialog).getByLabelText('實際體重（kg）')
    expect(weightInput).toHaveValue(72.8)
    await user.clear(weightInput)
    await user.type(weightInput, '72.4')
    await user.click(
      within(dialog).getByRole('button', { name: '儲存體重修改' }),
    )

    expect(storedDiary(storage)[0].actualWeightKg).toBe(72.4)
    expect(screen.getByText('已更新實際體重。')).toBeInTheDocument()
  })

  it('keeps invalid edits open and restores row focus after cancelling', async () => {
    const user = userEvent.setup()
    const day = makeDiaryDay('2026-08-11', {
      entries: [
        {
          id: 'food_cancel',
          type: 'food',
          time: '12:00',
          label: '飲食',
          kcal: 500,
        },
      ],
    })
    const storage = makeDiaryStorage([day])
    renderDiary(storage)
    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 1 筆' }),
    )
    const editButton = screen.getByRole('button', {
      name: '編輯飲食紀錄 12:00',
    })

    await user.click(editButton)
    const dialog = screen.getByRole('dialog', { name: '編輯飲食紀錄' })
    const calorieInput = within(dialog).getByLabelText('熱量（kcal）')
    await user.clear(calorieInput)
    await user.click(
      within(dialog).getByRole('button', { name: '儲存飲食修改' }),
    )

    expect(screen.getByText('請填寫有效的飲食熱量。')).toBeInTheDocument()
    expect(dialog).toBeInTheDocument()
    expect(storedDiary(storage)[0].entries[0].kcal).toBe(500)

    await user.type(calorieInput, '550')
    storage.failWritesFor(STORAGE_WORKSPACE)
    await user.click(
      within(dialog).getByRole('button', { name: '儲存飲食修改' }),
    )
    expect(screen.getByText('無法儲存日記資料。')).toBeInTheDocument()
    expect(dialog).toBeInTheDocument()
    expect(storedDiary(storage)[0].entries[0].kcal).toBe(500)
    storage.failWritesFor(null)

    await user.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(
      screen.queryByRole('dialog', { name: '編輯飲食紀錄' }),
    ).not.toBeInTheDocument()
    expect(editButton).toHaveFocus()
  })

  it('does not expose editing or deletion in read-only plans', async () => {
    const storage = makeDiaryStorage([
      makeDiaryDay('2026-08-11', { actualWeightKg: 72.8 }),
    ])
    renderWithAppData(<DiaryPage readOnly />, { storage })

    expect(screen.getByText('72.8 kg')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /編輯.*紀錄/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '刪除此明細' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '刪除此體重紀錄' }),
    ).not.toBeInTheDocument()
  })

  it('rejects actual weight records on a future date', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '選擇 2026/08/12' }))
    await user.click(screen.getByRole('button', { name: '記錄體重' }))
    await user.type(screen.getByLabelText('實際體重（kg）'), '72')
    await user.click(screen.getByRole('button', { name: '＋ 新增體重紀錄' }))

    expect(storedDiary(storage)).toEqual([])
    expect(screen.getByText('無法記錄未來日期的體重。')).toBeInTheDocument()
  })

  it('combines detailed forecast, chart and monthly table in one tabbed card', async () => {
    const user = userEvent.setup()
    const { container } = renderDiary()
    const projection =
      container.querySelector<HTMLElement>('.detail-projection')

    if (!projection) throw new Error('Missing detailed projection')
    expect(projection.querySelectorAll(':scope > .card')).toHaveLength(1)

    const tabs = within(projection).getAllByRole('tab')
    const summaryTab = within(projection).getByRole('tab', {
      name: '詳細預測',
    })
    const chartTab = within(projection).getByRole('tab', { name: '體重曲線' })
    const tableTab = within(projection).getByRole('tab', { name: '每月預估' })

    expect(tabs).toHaveLength(3)
    expect(summaryTab).toHaveAttribute('aria-selected', 'true')
    expect(
      within(projection).getByRole('heading', { name: '依明細動態更新' }),
    ).toBeInTheDocument()
    expect(
      within(projection).queryByText('有紀錄日：實際攝取＋運動'),
    ).not.toBeInTheDocument()
    expect(
      within(projection).queryByText('預測如何使用日記資料？'),
    ).not.toBeInTheDocument()

    await user.click(chartTab)
    expect(
      within(projection).getByRole('heading', { name: '體重下降曲線' }),
    ).toBeInTheDocument()

    await user.click(tableTab)
    expect(within(projection).getByRole('table')).toBeInTheDocument()
  })

  it('hooks month controls, calendar days and return-today to the date rail', async () => {
    const user = userEvent.setup()
    renderDiary()
    const rail = screen.getByRole('region', { name: '七日日期導覽' })

    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/08\/11/ }),
    ).toHaveAttribute('aria-current', 'date')
    await user.click(screen.getByRole('button', { name: '開啟完整月曆' }))
    const calendar = screen.getByRole('dialog', { name: '完整月曆' })
    await user.click(within(calendar).getByRole('button', { name: '下個月' }))
    expect(
      within(calendar).getByRole('heading', { name: '2026 年 9 月' }),
    ).toBeInTheDocument()
    await user.click(within(calendar).getByRole('button', { name: '上個月' }))
    await user.click(
      within(calendar).getByRole('button', { name: '2026/08/05' }),
    )
    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/08\/05/ }),
    ).toHaveAttribute('aria-current', 'date')

    await user.click(screen.getByRole('button', { name: '開啟完整月曆' }))
    const nextCalendar = screen.getByRole('dialog', { name: '完整月曆' })
    await user.click(
      within(nextCalendar).getByRole('button', { name: '下個月' }),
    )
    await user.click(
      within(nextCalendar).getByRole('button', { name: '2026/09/02' }),
    )
    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/09\/02/ }),
    ).toHaveAttribute('aria-current', 'date')

    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 0 筆' }),
    )
    await user.click(screen.getByRole('button', { name: '回到今天' }))
    expect(
      within(rail).getByRole('button', { name: /選擇 2026\/08\/11/ }),
    ).toHaveAttribute('aria-current', 'date')
  })

  it('adds food by Enter and announces achievements without blocking logging', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    const { container } = renderDiary(storage)

    await chooseTime(user, '時間（選填）', '13', '30')
    const calorieInput = screen.getByLabelText('熱量（kcal）')
    await user.type(calorieInput, '450')
    await user.type(calorieInput, '{Enter}')

    expect(storedDiary(storage)[0]).toMatchObject({
      date: '2026-08-11',
      entries: [
        {
          type: 'food',
          time: '13:30',
          kcal: 450,
        },
      ],
    })
    expect(screen.getAllByText('+450 kcal')).toHaveLength(1)
    expect(
      container.querySelector('.date-rail-summary')?.children,
    ).toHaveLength(2)
    expect(screen.queryByText('選擇日期')).not.toBeInTheDocument()
    expect(screen.queryByText('紀錄類型')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: '初來乍到' }),
    ).not.toBeInTheDocument()
    const achievementToast = screen.getByRole('button', {
      name: /解鎖 Journey Milestone：初來乍到/,
    })
    expect(achievementToast).toHaveTextContent(
      '解鎖 Journey Milestone：初來乍到',
    )
    expect(calorieInput).toHaveFocus()
    await user.click(achievementToast)
    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 1 筆' }),
    )
    expect(screen.getAllByText('+450 kcal')).toHaveLength(2)
    expect(container.querySelector('.date-rail-summary')).toBeInTheDocument()
    expect(
      container.querySelector('.diary-editor .day-summary'),
    ).not.toBeInTheDocument()
  })

  it('uses short exercise names with MET details in themed tooltips', async () => {
    const user = userEvent.setup()
    renderDiary(makeDiaryStorage([]))

    await user.click(screen.getByRole('button', { name: '新增運動' }))
    const typeSelect = screen.getByRole('combobox', { name: '類型' })
    expect(typeSelect).toHaveTextContent('走路')
    await user.click(typeSelect)

    expect(await screen.findByRole('option', { name: '走路' })).toBeVisible()
    expect(screen.getByRole('option', { name: '休閒自行車' })).toBeVisible()
    expect(
      screen.queryByRole('option', { name: /MET 3\.5/ }),
    ).not.toBeInTheDocument()

    const info = screen.getByLabelText('顯示說明 一般步行 · MET 3.5')
    info.focus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '一般步行 · MET 3.5',
    )
  })

  it('unlocks and displays an independent four-day streak achievement', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([
      makeDiaryDay('2026-08-08'),
      makeDiaryDay('2026-08-09'),
      makeDiaryDay('2026-08-10'),
    ])
    storage.setItem(STORAGE_ACHIEVEMENTS, JSON.stringify([1, 2]))
    renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '新增飲食' }))
    await user.type(screen.getByLabelText('熱量（kcal）'), '450')
    await user.click(screen.getByRole('button', { name: '＋ 新增飲食並計算' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const streakToast = screen.getByRole('button', {
      name: /解鎖 Journey Milestone：連續起步/,
    })
    expect(streakToast).toHaveTextContent('歷史最長連續 4 天')
    expect(storedAchievements(storage)).toEqual(
      expect.arrayContaining(['total:4', 'streak:4']),
    )

    expect(screen.queryByText('連續紀錄')).not.toBeInTheDocument()
    expect(screen.queryByText('最長 4 天')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '查看成就' }))
    expect(screen.getByText('連續起步').closest('.achievement')).toHaveClass(
      'unlocked',
    )
  })

  it('adds preset, manual and custom exercise values to their hooked entries', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '新增運動' }))
    const calorieInput = screen.getByLabelText('消耗（kcal）')
    await chooseTime(user, '時間', '18', '45')
    expect(calorieInput).toHaveValue(131)
    await user.click(screen.getByRole('button', { name: '＋ 新增運動並計算' }))

    await user.clear(calorieInput)
    await user.type(calorieInput, '200')
    await user.click(screen.getByRole('button', { name: '＋ 新增運動並計算' }))

    await user.click(screen.getByRole('combobox', { name: '類型' }))
    await user.click(await screen.findByRole('option', { name: '自訂' }))
    await user.type(screen.getByLabelText('自訂名稱'), '爬樓梯')
    await user.type(screen.getByLabelText('自訂 MET 或每小時 kcal'), '6')
    await user.clear(screen.getByLabelText('時長（分）'))
    await user.type(screen.getByLabelText('時長（分）'), '20')
    await user.click(screen.getByRole('button', { name: '＋ 新增運動並計算' }))

    expect(storedDiary(storage)[0].entries).toMatchObject([
      {
        type: 'exercise',
        presetId: 'walk',
        time: '18:45',
        minutes: 30,
        kcal: 131,
      },
      {
        type: 'exercise',
        presetId: 'walk',
        minutes: 30,
        kcal: 200,
      },
      {
        type: 'exercise',
        presetId: 'custom',
        name: '爬樓梯',
        met: 6,
        minutes: 20,
        kcal: 150,
      },
    ])

    await user.click(screen.getByRole('button', { name: '新增飲食' }))
    expect(screen.getByLabelText('熱量（kcal）')).toBeInTheDocument()
  })

  it('accepts arbitrary whole-number food calories', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '新增飲食' }))
    await user.type(screen.getByLabelText('熱量（kcal）'), '555')
    await user.click(screen.getByRole('button', { name: '＋ 新增飲食並計算' }))

    expect(storedDiary(storage)[0].entries[0]).toMatchObject({
      type: 'food',
      kcal: 555,
    })
  })

  it('enforces entry input ranges before the add handler runs', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    renderDiary(storage)

    await user.click(screen.getByRole('button', { name: '新增飲食' }))
    await user.type(screen.getByLabelText('熱量（kcal）'), '10001')
    await user.click(screen.getByRole('button', { name: '＋ 新增飲食並計算' }))
    expect(storedDiary(storage)).toEqual([])

    await user.click(screen.getByRole('button', { name: '新增運動' }))
    await user.clear(screen.getByLabelText('時長（分）'))
    await user.type(screen.getByLabelText('時長（分）'), '601')
    await user.click(screen.getByRole('button', { name: '＋ 新增運動並計算' }))
    expect(storedDiary(storage)).toEqual([])
  })

  it('hooks single-entry removal and whole-day confirm cancel/accept to storage', async () => {
    const user = userEvent.setup()
    const day = makeDiaryDay('2026-08-11', {
      entries: [
        {
          id: 'food-1',
          type: 'food',
          time: '08:00',
          label: '飲食',
          kcal: 300,
        },
        {
          id: 'food-2',
          type: 'food',
          time: '12:00',
          label: '飲食',
          kcal: 500,
        },
      ],
    })
    const storage = makeDiaryStorage([day])
    renderDiary(storage)

    await user.click(
      screen.getByRole('button', { name: '查看當日紀錄，共 2 筆' }),
    )
    const removeButtons = screen.getAllByRole('button', { name: '刪除此明細' })
    await user.click(removeButtons[0]!)
    expect(storedDiary(storage)[0].entries).toHaveLength(1)
    expect(
      screen.queryByRole('dialog', { name: /編輯.*紀錄/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '刪除此日全部' }))
    let dialog = screen.getByRole('dialog', { name: '確定刪除？' })
    expect(dialog).toHaveTextContent(
      '確定刪除這一天的全部紀錄嗎？此操作無法復原。',
    )
    await user.click(within(dialog).getByRole('button', { name: '取消' }))
    expect(storedDiary(storage)).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '刪除此日全部' }))
    dialog = screen.getByRole('dialog', { name: '確定刪除？' })
    await user.click(within(dialog).getByRole('button', { name: '確定刪除' }))
    expect(storedDiary(storage)).toEqual([])
  })

  it('does not announce success or unlock achievements when diary persistence fails', async () => {
    const user = userEvent.setup()
    const storage = makeDiaryStorage([])
    renderDiary(storage)
    storage.failWritesFor(STORAGE_WORKSPACE)

    await user.click(screen.getByRole('button', { name: '新增飲食' }))
    await user.type(screen.getByLabelText('熱量（kcal）'), '450')
    await user.click(screen.getByRole('button', { name: '＋ 新增飲食並計算' }))

    expect(screen.getByText('無法儲存日記資料。')).toBeInTheDocument()
    expect(
      screen.queryByText('已新增飲食 +450 kcal，總計已更新。'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
