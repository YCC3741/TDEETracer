import { useState, type FormEvent } from 'react'
import { LayeredBranchBar } from '../../components/layered/LayeredBranchBar'
import { LayeredCircleNode } from '../../components/layered/LayeredCircleNode'
import { LayeredStatus } from '../../components/layered/LayeredStatus'
import { SelectField } from '../../components/SelectField'
import { ACTIVITY_LEVELS } from '../../domain/constants'
import { todayString } from '../../domain/date'
import type { PlanMode, Profile, Sex } from '../../domain/types'

export type QuickFormStep = 1 | 2 | 3

interface ProfileFormProps {
  profile: Profile | null
  onSubmit: (profile: Profile) => void
  requestedStep?: QuickFormStep
}

interface FormValues {
  sex: '' | Sex
  age: string
  height: string
  weight: string
  target: string
  factor: string
  intake: string
  deficit: string
}

const emptyValues: FormValues = {
  sex: '',
  age: '',
  height: '',
  weight: '',
  target: '',
  factor: '',
  intake: '',
  deficit: '',
}

const activityOptions = ACTIVITY_LEVELS.filter(
  (level) => level.factor !== 1,
).map((level) => {
  const [label, description] = level.name.split('：', 2)
  return {
    value: String(level.factor),
    label: label || level.name,
    ...(description ? { description } : {}),
  }
})

function valuesFromProfile(profile: Profile | null): FormValues {
  if (!profile) return emptyValues
  return {
    sex: profile.sex,
    age: String(profile.age),
    height: String(profile.height),
    weight: String(profile.weight),
    target: String(profile.target),
    factor: String(profile.factor),
    intake: profile.intake === null ? '' : String(profile.intake),
    deficit: profile.deficit === null ? '' : String(profile.deficit),
  }
}

function isWithin(value: string, minimum: number, maximum: number): boolean {
  const numericValue = Number(value)
  return (
    value !== '' &&
    Number.isFinite(numericValue) &&
    numericValue >= minimum &&
    numericValue <= maximum
  )
}

function profileStepError(values: FormValues): string | null {
  if (!values.sex) return '請選擇性別。'
  if (!isWithin(values.age, 14, 100)) return '年齡必須介於 14 至 100 歲。'
  if (!isWithin(values.height, 100, 230)) return '身高必須介於 100 至 230 cm。'
  if (!isWithin(values.weight, 25, 350))
    return '起始體重必須介於 25 至 350 kg。'
  if (!isWithin(values.target, 25, 350))
    return '目標體重必須介於 25 至 350 kg。'
  if (!isWithin(values.factor, 1.2, 1.9)) return '請選擇平均活動量。'
  return null
}

function strategyStepError(values: FormValues, mode: PlanMode): string | null {
  const selectedValue = mode === 'intake' ? values.intake : values.deficit
  if (!isWithin(selectedValue, 1, 10_000)) {
    return mode === 'intake'
      ? '請輸入有效的每日攝取熱量。'
      : '請輸入有效的每日固定赤字。'
  }
  return null
}

export function ProfileForm({
  profile,
  onSubmit,
  requestedStep,
}: ProfileFormProps) {
  const [mode, setMode] = useState<PlanMode>(profile?.mode ?? 'intake')
  const [values, setValues] = useState<FormValues>(() =>
    valuesFromProfile(profile),
  )
  const [step, setStep] = useState<QuickFormStep>(profile ? 2 : 1)
  const [error, setError] = useState<string | null>(null)
  const activeStep = requestedStep ?? step
  const profileCompletion = [
    values.sex,
    values.age,
    values.height,
    values.weight,
    values.target,
    values.factor,
  ].filter(Boolean).length
  const activeStepLabel =
    activeStep === 1 ? '身體資料' : activeStep === 2 ? '熱量策略' : '確認估算'

  const update = (key: keyof FormValues, value: string) => {
    setError(null)
    setValues((current) => ({ ...current, [key]: value }))
  }

  const goToStep = (nextStep: QuickFormStep) => {
    setError(null)
    setStep(nextStep)
  }

  const continueFromProfile = () => {
    const nextError = profileStepError(values)
    if (nextError) {
      setError(nextError)
      return
    }
    goToStep(2)
  }

  const continueFromStrategy = () => {
    const nextError = strategyStepError(values, mode)
    if (nextError) {
      setError(nextError)
      return
    }
    goToStep(3)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (activeStep === 1) {
      continueFromProfile()
      return
    }
    if (activeStep === 2) {
      continueFromStrategy()
      return
    }
    const nextProfileError = profileStepError(values)
    if (nextProfileError) {
      setError(nextProfileError)
      setStep(1)
      return
    }
    const nextStrategyError = strategyStepError(values, mode)
    if (nextStrategyError) {
      setError(nextStrategyError)
      setStep(2)
      return
    }
    if (!values.sex) return
    onSubmit({
      sex: values.sex,
      age: Number(values.age),
      height: Number(values.height),
      weight: Number(values.weight),
      target: Number(values.target),
      factor: Number(values.factor),
      intake: values.intake === '' ? null : Number(values.intake),
      deficit: values.deficit === '' ? null : Number(values.deficit),
      mode,
      planStartedAt: profile?.planStartedAt ?? todayString(),
    })
  }

  return (
    <form
      className="quick-form"
      data-active-step={activeStep}
      noValidate
      onSubmit={submit}
    >
      <aside
        className="quick-draft-summary layered-window"
        role="region"
        aria-label="Quick 旅程摘要"
      >
        <span className="layered-window-label">Route summary</span>
        <span className="quick-summary-orb" aria-hidden="true" />
        <h2>你的旅程</h2>
        <p>完成起點資料後，這裡會顯示目前狀態與目標之間的預估路徑。</p>
        <div className="quick-summary-route">
          <span>
            <small>目前體重</small>
            <strong>{values.weight || '—'} kg</strong>
          </span>
          <i aria-hidden="true" />
          <span>
            <small>目標體重</small>
            <strong>{values.target || '—'} kg</strong>
          </span>
        </div>
        <dl className="quick-summary-list">
          <div>
            <dt>身體資料</dt>
            <dd>{profileCompletion === 6 ? '完成' : '填寫中'}</dd>
          </div>
          <div>
            <dt>熱量策略</dt>
            <dd>
              {strategyStepError(values, mode) === null ? '已設定' : '尚未設定'}
            </dd>
          </div>
          <div>
            <dt>Quick 草稿</dt>
            <dd>{profile ? '已儲存' : '尚未儲存'}</dd>
          </div>
        </dl>
      </aside>

      <ol className="quick-step-rail" aria-label="Quick 估算步驟">
        {(
          [
            [1, '身體資料'],
            [2, '熱量策略'],
            [3, '確認估算'],
          ] as const
        ).map(([stepNumber, label]) => (
          <li key={stepNumber}>
            <button
              className={activeStep === stepNumber ? 'active' : ''}
              type="button"
              aria-label={`前往步驟 ${stepNumber}：${label}`}
              aria-current={activeStep === stepNumber ? 'step' : undefined}
              onClick={() => goToStep(stepNumber)}
            >
              <LayeredCircleNode
                className="quick-step-node"
                hiddenFromAssistiveTechnology
                tone={activeStep === stepNumber ? 'active' : 'neutral'}
              >
                {stepNumber}
              </LayeredCircleNode>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <LayeredBranchBar
        className="quick-active-ribbon"
        connector="left"
        hiddenFromAssistiveTechnology
        key={`quick-route-ribbon-${activeStep}`}
      >
        <span>{activeStepLabel}</span>
        <small>STEP 0{activeStep}</small>
      </LayeredBranchBar>

      <div
        className="quick-detail-window layered-window"
        key={`quick-detail-window-${activeStep}`}
      >
        {error ? (
          <p className="quick-form-error" role="alert">
            {error}
          </p>
        ) : null}

        {activeStep === 1 ? (
          <section
            className="quick-step-panel"
            data-tour-anchor="quick-profile-fields"
          >
            <header>
              <span className="layered-window-label">
                Profile / Basic information
              </span>
              <h3>1. 身體資料</h3>
              <p>建立估算起點；所有數值之後都能重新調整。</p>
            </header>
            <div className="form-grid">
              <SelectField
                label="性別"
                name="sex"
                required
                value={values.sex}
                options={[
                  { value: 'female', label: '女性' },
                  { value: 'male', label: '男性' },
                ]}
                onValueChange={(value) => update('sex', value)}
              />
              <label>
                年齡
                <input
                  required
                  min="14"
                  max="100"
                  step="1"
                  type="number"
                  value={values.age}
                  onChange={(event) => update('age', event.target.value)}
                  placeholder="歲"
                />
              </label>
              <label>
                身高
                <input
                  required
                  min="100"
                  max="230"
                  step="0.1"
                  type="number"
                  value={values.height}
                  onChange={(event) => update('height', event.target.value)}
                  placeholder="cm"
                />
              </label>
              <label>
                起始體重
                <input
                  required
                  min="25"
                  max="350"
                  step="0.1"
                  type="number"
                  value={values.weight}
                  onChange={(event) => update('weight', event.target.value)}
                  placeholder="kg"
                />
              </label>
              <label>
                目標體重
                <input
                  required
                  min="25"
                  max="350"
                  step="0.1"
                  type="number"
                  value={values.target}
                  onChange={(event) => update('target', event.target.value)}
                  placeholder="kg"
                />
              </label>
              <SelectField
                label="平均活動量"
                name="factor"
                required
                value={values.factor}
                options={activityOptions}
                onValueChange={(value) => update('factor', value)}
              />
            </div>
            <div className="quick-step-actions">
              <button
                className="primary-btn"
                type="button"
                onClick={continueFromProfile}
              >
                下一步：熱量策略
              </button>
            </div>
          </section>
        ) : null}

        {activeStep === 2 ? (
          <section
            className="quick-step-panel"
            data-tour-anchor="quick-strategy"
          >
            <header>
              <span className="layered-window-label">
                Strategy / Energy route
              </span>
              <h3>2. 熱量策略</h3>
              <p>選擇一種主要策略；完整結果只會在確認後更新。</p>
            </header>
            <fieldset className="strategy-fieldset">
              <legend>策略模式</legend>
              <div className="segmented quick-strategy-branches">
                <button
                  className={mode === 'intake' ? 'active' : ''}
                  type="button"
                  aria-pressed={mode === 'intake'}
                  onClick={() => {
                    setMode('intake')
                    setError(null)
                  }}
                >
                  設定每日攝取
                </button>
                <button
                  className={mode === 'deficit' ? 'active' : ''}
                  type="button"
                  aria-pressed={mode === 'deficit'}
                  onClick={() => {
                    setMode('deficit')
                    setError(null)
                  }}
                >
                  設定固定赤字
                </button>
              </div>

              {mode === 'intake' ? (
                <label className="strategy-input">
                  每日攝取熱量
                  <input
                    required
                    min="1"
                    max="10000"
                    step="1"
                    type="number"
                    value={values.intake}
                    onChange={(event) => update('intake', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      continueFromStrategy()
                    }}
                    placeholder="kcal／天"
                  />
                </label>
              ) : (
                <label className="strategy-input">
                  每日固定赤字
                  <input
                    required
                    min="1"
                    max="10000"
                    step="1"
                    type="number"
                    value={values.deficit}
                    onChange={(event) => update('deficit', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      continueFromStrategy()
                    }}
                    placeholder="kcal／天"
                  />
                </label>
              )}
            </fieldset>
            <div className="quick-step-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => goToStep(1)}
              >
                上一步
              </button>
              <button
                className="primary-btn"
                type="button"
                onClick={continueFromStrategy}
              >
                下一步：確認估算
              </button>
            </div>
          </section>
        ) : null}

        {activeStep === 3 ? (
          <section className="quick-step-panel quick-review">
            <header>
              <span className="layered-window-label">
                Review / Route confirmation
              </span>
              <h3>3. 確認估算</h3>
              <p>確認目前輸入後才會儲存 Quick 草稿並更新完整結果。</p>
            </header>
            <dl>
              <div>
                <dt>體重路徑</dt>
                <dd>
                  {values.weight || '—'} kg → {values.target || '—'} kg
                </dd>
              </div>
              <div>
                <dt>活動量</dt>
                <dd>
                  {activityOptions.find(
                    (option) => option.value === values.factor,
                  )?.label ?? '尚未選擇'}
                </dd>
              </div>
              <div>
                <dt>熱量策略</dt>
                <dd>
                  {mode === 'intake'
                    ? `每日攝取 ${values.intake || '—'} kcal`
                    : `每日固定赤字 ${values.deficit || '—'} kcal`}
                </dd>
              </div>
            </dl>
            <div className="quick-step-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => goToStep(2)}
              >
                上一步
              </button>
              <button
                className="primary-btn"
                type="submit"
                data-tour-anchor="quick-submit"
              >
                計算減重路程
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <LayeredStatus
        floating
        label="Quick 資料完成度"
        value={profileCompletion}
        max={6}
        detail={`STEP 0${activeStep}`}
      />
    </form>
  )
}
