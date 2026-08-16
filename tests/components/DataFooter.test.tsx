import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataMenu } from '../../src/components/DataMenu'
import { DATA_EXPORT_VERSION } from '../../src/domain/constants'
import { NotificationStack } from '../../src/components/NotificationStack'
import {
  STORAGE_PREFERRED_MODE,
  STORAGE_PROFILE,
  STORAGE_WORKSPACE,
} from '../../src/domain/constants'
import { renderWithAppData } from '../helpers/renderWithAppData'
import { TestStorage } from '../helpers/TestStorage'
import { makeExportData, makeLocalUser, makeProfile } from '../helpers/testData'

function jsonFile(value: unknown, name = 'tdee-data.json') {
  const text = JSON.stringify(value)
  const file = new File([text], name, { type: 'application/json' })
  Object.defineProperty(file, 'text', {
    configurable: true,
    value: async () => text,
  })
  return file
}

function renderMenu(storage = new TestStorage()) {
  const onImported = vi.fn()
  const result = renderWithAppData(
    <>
      <DataMenu onImported={onImported} />
      <NotificationStack />
    </>,
    { storage },
  )
  const fileInput =
    result.container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!fileInput) throw new Error('Missing import file input')
  return { ...result, fileInput, onImported }
}

describe('DataMenu interactions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-11T08:30:00'))
  })

  it('hooks the import button to the hidden file input', async () => {
    const user = userEvent.setup()
    const { fileInput } = renderMenu()
    const click = vi
      .spyOn(fileInput, 'click')
      .mockImplementation(() => undefined)

    await user.click(screen.getByRole('button', { name: '開啟資料選單' }))
    await user.click(screen.getByRole('menuitem', { name: '匯入資料 JSON' }))

    expect(click).toHaveBeenCalledOnce()
  })

  it('closes with Escape or an outside press and restores focus on Escape', async () => {
    const user = userEvent.setup()
    renderMenu()
    const trigger = screen.getByRole('button', { name: '開啟資料選單' })

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps data unchanged when import confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const original = makeProfile({ weight: 80 })
    const storage = new TestStorage({
      [STORAGE_PROFILE]: JSON.stringify(original),
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { fileInput, onImported } = renderMenu(storage)

    await user.upload(fileInput, jsonFile(makeExportData()))

    expect(JSON.parse(storage.getItem(STORAGE_PROFILE) ?? 'null')).toEqual(
      original,
    )
    expect(onImported).not.toHaveBeenCalled()
    expect(screen.queryByText('已匯入資料並套用。')).not.toBeInTheDocument()
  })

  it('reports invalid JSON without replacing any storage key', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage({
      [STORAGE_PREFERRED_MODE]: 'quick',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { fileInput, onImported } = renderMenu(storage)
    const file = new File(['invalid json'], 'bad.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: async () => 'invalid json',
    })

    await user.upload(fileInput, file)

    expect(
      await screen.findByText('匯入失敗：JSON 無法解析'),
    ).toBeInTheDocument()
    expect(storage.getItem(STORAGE_PREFERRED_MODE)).toBe('quick')
    expect(onImported).not.toHaveBeenCalled()
  })

  it('imports a validated snapshot into all hooked storage targets', async () => {
    const user = userEvent.setup()
    const importedUser = makeLocalUser({
      preferredMode: 'diary',
      achievementsSeen: ['total:1', 'total:2'],
      achievementsUnlocked: ['total:1', 'total:2'],
    })
    const data = makeExportData({
      activeUserId: importedUser.id,
      users: [importedUser],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { storage, fileInput, onImported } = renderMenu()

    await user.upload(fileInput, jsonFile(data))

    expect(await screen.findByText('已匯入資料並套用。')).toBeInTheDocument()
    expect(JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')).toEqual({
      version: DATA_EXPORT_VERSION,
      activeUserId: importedUser.id,
      users: [importedUser],
    })
    expect(onImported).toHaveBeenCalledWith('diary')
  })

  it('does not announce success or change mode when an import write fails', async () => {
    const user = userEvent.setup()
    const original = makeProfile({ weight: 80 })
    const storage = new TestStorage({
      [STORAGE_PROFILE]: JSON.stringify(original),
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { fileInput, onImported } = renderMenu(storage)
    storage.failWritesFor(STORAGE_WORKSPACE)

    await user.upload(fileInput, jsonFile(makeExportData()))

    expect(
      await screen.findByText('資料格式正確，但無法寫入本機儲存空間。'),
    ).toBeInTheDocument()
    expect(screen.queryByText('已匯入資料並套用。')).not.toBeInTheDocument()
    expect(onImported).not.toHaveBeenCalled()
    expect(JSON.parse(storage.getItem(STORAGE_PROFILE) ?? 'null')).toEqual(
      original,
    )
  })

  it('hooks export to a dated JSON download and success notification', async () => {
    const user = userEvent.setup()
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test')
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    renderMenu(
      new TestStorage({
        [STORAGE_PROFILE]: JSON.stringify(makeProfile()),
      }),
    )

    await user.click(screen.getByRole('button', { name: '開啟資料選單' }))
    await user.click(screen.getByRole('menuitem', { name: '匯出資料 JSON' }))

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob))
    expect(anchorClick).toHaveBeenCalledOnce()
    const anchor = anchorClick.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('tdee-data-2026-08-11.json')
    expect(anchor.href).toBe('blob:test')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test')
    expect(screen.getByText('已匯出本機資料 JSON。')).toBeInTheDocument()
  })
})
