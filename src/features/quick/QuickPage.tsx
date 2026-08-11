import { useMemo } from 'react'
import { useAppData } from '../../app/AppDataContext'
import {
  buildSafetyWarnings,
  calculateBmr,
  calculateTdee,
  isProfileReady,
  plannedDeficit,
} from '../../domain/calculations'
import { todayString } from '../../domain/date'
import { simulateWeightPath } from '../../domain/projection'
import type { Profile } from '../../domain/types'
import { profilesHaveSameSettings } from '../../domain/workspace'
import { ProfileForm } from './ProfileForm'
import { QuickResults } from './QuickResults'

interface QuickPageProps {
  onDraftChanged?: (profile: Profile) => void
}

export function QuickPage({ onDraftChanged }: QuickPageProps) {
  const { activeUser, quickDraft, setQuickDraft, notify } = useAppData()
  const today = useMemo(() => new Date(), [])
  const simulation = useMemo(
    () =>
      isProfileReady(quickDraft)
        ? simulateWeightPath(quickDraft, { startDate: today })
        : null,
    [quickDraft, today],
  )

  const handleSubmit = (nextProfile: Profile) => {
    const savedProfile: Profile = {
      ...nextProfile,
      planStartedAt: todayString(today),
    }
    const numericValues = [
      nextProfile.age,
      nextProfile.height,
      nextProfile.weight,
      nextProfile.target,
      nextProfile.factor,
    ]
    if (!numericValues.every((value) => Number.isFinite(value) && value > 0)) {
      notify('danger', '請完整填寫有效數字。')
      return
    }
    if (savedProfile.target >= savedProfile.weight) {
      notify('danger', '目標體重必須低於起始體重。')
      return
    }
    const selectedValue =
      nextProfile.mode === 'intake' ? nextProfile.intake : nextProfile.deficit
    if (!selectedValue || selectedValue <= 0) {
      notify('danger', '請填寫有效的每日熱量策略。')
      return
    }

    const bmr = calculateBmr(
      savedProfile.weight,
      savedProfile.height,
      savedProfile.age,
      savedProfile.sex,
    )
    const tdee = calculateTdee(savedProfile)
    if (plannedDeficit(savedProfile, tdee, savedProfile.mode) < 5) {
      notify('danger', '目前設定沒有足夠熱量赤字，無法估算下降路徑。')
      return
    }

    const draftChanged = !profilesHaveSameSettings(quickDraft, savedProfile)
    if (!setQuickDraft(savedProfile)) return
    notify('ok', '已儲存 Quick 草稿。')
    if (draftChanged) onDraftChanged?.(savedProfile)
    buildSafetyWarnings(savedProfile, bmr).forEach((warning) =>
      notify(warning.type, warning.text),
    )
  }

  return (
    <main className="page-content">
      <section className="page-hero quick-hero">
        <div>
          <span className="eyebrow">Quick calculation</span>
          <h1>先看見方向 再決定步伐</h1>
        </div>
      </section>

      <div
        className={`quick-workspace${quickDraft && simulation ? ' has-results' : ''}`}
      >
        <section className="card form-card">
          <header className="section-head">
            <div>
              <span className="eyebrow">Profile & strategy</span>
              <h2>身體資料與熱量策略</h2>
            </div>
          </header>
          <ProfileForm
            key={`${activeUser.id}-${quickDraft ? JSON.stringify(quickDraft) : 'empty-profile'}`}
            profile={quickDraft}
            onSubmit={handleSubmit}
          />
        </section>

        {quickDraft && simulation ? (
          <QuickResults
            profile={quickDraft}
            simulation={simulation}
            startDate={today}
            measurements={[]}
          />
        ) : null}
      </div>
    </main>
  )
}
