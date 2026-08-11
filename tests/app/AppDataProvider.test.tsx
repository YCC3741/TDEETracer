import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useAppData } from '../../src/app/AppDataContext'
import {
  STORAGE_ACHIEVEMENTS,
  STORAGE_DIARY,
  STORAGE_PREFERRED_MODE,
  STORAGE_PROFILE,
  STORAGE_WORKSPACE,
} from '../../src/domain/constants'
import { renderWithAppData } from '../helpers/renderWithAppData'
import { TestStorage } from '../helpers/TestStorage'
import { makeDiaryDay, makeProfile } from '../helpers/testData'

function ProviderHarness() {
  const appData = useAppData()
  return (
    <>
      <output aria-label="profile">
        {appData.profile ? String(appData.profile.weight) : 'none'}
      </output>
      <output aria-label="quick">
        {appData.quickDraft ? String(appData.quickDraft.weight) : 'none'}
      </output>
      <output aria-label="diary">
        {appData.diary
          .map((day) => `${day.date}:${day.entries[0]?.id}`)
          .join('|')}
      </output>
      <output aria-label="achievements">
        {appData.achievementsSeen.join(',')}
      </output>
      <output aria-label="mode">{appData.prefMode ?? 'none'}</output>
      <output aria-label="notifications">
        {appData.notifications
          .map((notification) => notification.text)
          .join('|')}
      </output>
      <button
        type="button"
        onClick={() => appData.setQuickDraft(makeProfile())}
      >
        set profile
      </button>
      <button
        type="button"
        onClick={() => appData.upsertDay(makeDiaryDay('2026-08-12'))}
      >
        add later day
      </button>
      <button
        type="button"
        onClick={() =>
          appData.upsertDay(
            makeDiaryDay('2026-08-11', {
              entries: [
                {
                  id: 'replacement',
                  type: 'food',
                  time: '',
                  label: '飲食',
                  kcal: 600,
                },
              ],
            }),
          )
        }
      >
        replace earlier day
      </button>
    </>
  )
}

describe('AppDataProvider', () => {
  it('hydrates all four compatible storage keys', () => {
    const profile = makeProfile()
    const day = makeDiaryDay('2026-08-11')
    const storage = new TestStorage({
      [STORAGE_PROFILE]: JSON.stringify(profile),
      [STORAGE_DIARY]: JSON.stringify([day]),
      [STORAGE_ACHIEVEMENTS]: JSON.stringify([1, 2]),
      [STORAGE_PREFERRED_MODE]: 'diary',
    })

    renderWithAppData(<ProviderHarness />, { storage })

    expect(screen.getByLabelText('profile')).toHaveTextContent('75')
    expect(screen.getByLabelText('diary')).toHaveTextContent('2026-08-11')
    expect(screen.getByLabelText('achievements')).toHaveTextContent(
      'total:1,total:2',
    )
    expect(screen.getByLabelText('mode')).toHaveTextContent('diary')
  })

  it('persists profile and keeps upserted diary days sorted and unique', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage({
      [STORAGE_DIARY]: JSON.stringify([makeDiaryDay('2026-08-11')]),
    })
    renderWithAppData(<ProviderHarness />, { storage })

    await user.click(screen.getByRole('button', { name: 'set profile' }))
    await user.click(screen.getByRole('button', { name: 'add later day' }))
    await user.click(
      screen.getByRole('button', { name: 'replace earlier day' }),
    )

    expect(screen.getByLabelText('quick')).toHaveTextContent('75')
    expect(screen.getByLabelText('diary')).toHaveTextContent(
      '2026-08-11:replacement|2026-08-12:2026-08-12_food',
    )
    const workspace = JSON.parse(storage.getItem(STORAGE_WORKSPACE) ?? 'null')
    const storedDiary = workspace.users[0].plans[0].diary
    expect(storedDiary).toHaveLength(2)
  })

  it('keeps state unchanged and reports a storage write failure', async () => {
    const user = userEvent.setup()
    const storage = new TestStorage()
    storage.failWritesFor(STORAGE_WORKSPACE)
    renderWithAppData(<ProviderHarness />, { storage })

    await user.click(screen.getByRole('button', { name: 'set profile' }))

    expect(screen.getByLabelText('quick')).toHaveTextContent('none')
    expect(screen.getByLabelText('notifications')).toHaveTextContent(
      '無法儲存 Quick 草稿。',
    )
  })
})
