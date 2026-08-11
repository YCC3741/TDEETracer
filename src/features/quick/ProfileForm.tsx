import { useState, type FormEvent } from 'react'
import { SelectField } from '../../components/SelectField'
import { ACTIVITY_LEVELS } from '../../domain/constants'
import { todayString } from '../../domain/date'
import type { PlanMode, Profile, Sex } from '../../domain/types'

interface ProfileFormProps {
  profile: Profile | null
  onSubmit: (profile: Profile) => void
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

export function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const [mode, setMode] = useState<PlanMode>(profile?.mode ?? 'intake')
  const [values, setValues] = useState<FormValues>(() =>
    valuesFromProfile(profile),
  )

  const update = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
    <form onSubmit={submit}>
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
          options={ACTIVITY_LEVELS.filter((level) => level.factor !== 1).map(
            (level) => {
              const [label, description] = level.name.split('：', 2)
              return {
                value: String(level.factor),
                label: label || level.name,
                ...(description ? { description } : {}),
              }
            },
          )}
          onValueChange={(value) => update('factor', value)}
        />
      </div>

      <fieldset className="strategy-fieldset">
        <legend>熱量策略</legend>
        <div className="segmented">
          <button
            className={mode === 'intake' ? 'active' : ''}
            type="button"
            onClick={() => setMode('intake')}
          >
            設定每日攝取
          </button>
          <button
            className={mode === 'deficit' ? 'active' : ''}
            type="button"
            onClick={() => setMode('deficit')}
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
              step="1"
              type="number"
              value={values.intake}
              onChange={(event) => update('intake', event.target.value)}
              placeholder="kcal／天"
            />
          </label>
        ) : (
          <label className="strategy-input">
            每日固定赤字
            <input
              required
              min="1"
              step="1"
              type="number"
              value={values.deficit}
              onChange={(event) => update('deficit', event.target.value)}
              placeholder="kcal／天"
            />
          </label>
        )}
      </fieldset>

      <button className="primary-btn full" type="submit">
        計算減重路程
      </button>
    </form>
  )
}
