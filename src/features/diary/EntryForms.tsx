import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { LayeredBranchBar } from '../../components/layered/LayeredBranchBar'
import { SelectField } from '../../components/SelectField'
import { TimePicker } from '../../components/TimePicker'
import { estimateExerciseCalories } from '../../domain/calculations'
import {
  CUSTOM_METRIC_KCAL_THRESHOLD,
  EXERCISE_PRESETS,
  KCAL_INPUT_MAX,
  WEIGHT_RANGE_KG,
  WEIGHT_RANGE_MESSAGE,
} from '../../domain/constants'
import { currentTimeString } from '../../domain/date'
import type { DiaryEntry, ExerciseEntry, FoodEntry } from '../../domain/types'
import { isValidWeightKg } from '../../domain/validation'
import { useTour } from '../tour/TourContext'
import type { EntryCategory } from './EntryCategoryRail'
import { EXERCISE_OPTIONS } from './exerciseOptions'

interface EntryFormsProps {
  activeCategory: EntryCategory
  achievementPanel: ReactNode
  weight: number | null
  actualWeightKg: number | null
  showRibbon?: boolean
  onAdd: (entry: DiaryEntry) => boolean
  onSetWeight: (weight: number) => boolean
  onError: (message: string) => void
}

function entryId(kind: string): string {
  return `${kind}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

interface FoodFormProps {
  formId?: string
  hideSubmitButton?: boolean
  initialEntry?: FoodEntry
  submitLabel?: string
  onSubmit: (entry: FoodEntry) => boolean
  onError: (message: string) => void
}

export function FoodForm({
  formId,
  hideSubmitButton = false,
  initialEntry,
  submitLabel = '＋ 新增飲食並計算',
  onSubmit,
  onError,
}: FoodFormProps) {
  const [time, setTime] = useState(initialEntry?.time ?? currentTimeString())
  const [calories, setCalories] = useState(
    initialEntry ? String(initialEntry.kcal) : '',
  )
  const [protein, setProtein] = useState(
    initialEntry?.protein === null || initialEntry === undefined
      ? ''
      : String(initialEntry.protein),
  )

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const kcal = Number(calories)
    if (
      calories === '' ||
      !Number.isFinite(kcal) ||
      kcal < 0 ||
      kcal > KCAL_INPUT_MAX
    ) {
      onError('請填寫有效的飲食熱量。')
      return
    }
    const grams = Number(protein)
    if (
      protein !== '' &&
      (!Number.isFinite(grams) || grams < 0 || grams > 500)
    ) {
      onError('蛋白質請填 0 至 500 公克，或留白。')
      return
    }
    const entry: FoodEntry = {
      id: initialEntry?.id ?? entryId('food'),
      type: 'food',
      time,
      label: initialEntry?.label ?? '飲食',
      kcal,
      protein: protein === '' ? null : grams,
    }
    if (!onSubmit(entry)) return
    if (!initialEntry) {
      setCalories('')
      setProtein('')
      setTime(currentTimeString())
    }
  }

  return (
    <form id={formId} className="entry-form" onSubmit={add}>
      <div className="entry-form-grid food-grid">
        <TimePicker label="時間（選填）" value={time} onValueChange={setTime} />
        <label>
          熱量（kcal）
          <input
            min="0"
            max={KCAL_INPUT_MAX}
            step="1"
            type="number"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
            placeholder="kcal"
          />
        </label>
        <label>
          蛋白質（g，選填）
          <input
            min="0"
            max="500"
            step="1"
            type="number"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
            placeholder="g"
          />
        </label>
      </div>
      {!hideSubmitButton ? (
        <button className="secondary-btn" type="submit">
          {submitLabel}
        </button>
      ) : null}
    </form>
  )
}

interface ExerciseFormProps {
  formId?: string
  hideSubmitButton?: boolean
  weight: number | null
  initialEntry?: ExerciseEntry
  submitLabel?: string
  onSubmit: (entry: ExerciseEntry) => boolean
  onError: (message: string) => void
}

export function ExerciseForm({
  formId,
  hideSubmitButton = false,
  weight,
  initialEntry,
  submitLabel = '＋ 新增運動並計算',
  onSubmit,
  onError,
}: ExerciseFormProps) {
  const initialPresetId =
    initialEntry &&
    EXERCISE_PRESETS.some((preset) => preset.id === initialEntry.presetId)
      ? initialEntry.presetId
      : initialEntry
        ? 'custom'
        : 'walk'
  const [presetId, setPresetId] = useState(initialPresetId)
  const [minutes, setMinutes] = useState(
    initialEntry ? String(initialEntry.minutes) : '30',
  )
  const [time, setTime] = useState(initialEntry?.time ?? currentTimeString())
  const [customName, setCustomName] = useState(
    initialPresetId === 'custom' ? (initialEntry?.name ?? '') : '',
  )
  const [customMetric, setCustomMetric] = useState(
    initialPresetId === 'custom' && initialEntry && initialEntry.met !== null
      ? String(initialEntry.met)
      : '',
  )
  const [manualCalories, setManualCalories] = useState(
    initialEntry ? String(initialEntry.kcal) : '',
  )
  const [isManual, setIsManual] = useState(Boolean(initialEntry))

  const preset = EXERCISE_PRESETS.find((item) => item.id === presetId)!
  const metric = preset.met === null ? Number(customMetric) : preset.met
  const numericMinutes = Number(minutes)
  const treatAsCaloriesPerHour =
    presetId === 'custom' && metric > CUSTOM_METRIC_KCAL_THRESHOLD
  const estimated = useMemo(
    () =>
      weight && metric > 0 && numericMinutes > 0
        ? estimateExerciseCalories(
            metric,
            numericMinutes,
            weight,
            treatAsCaloriesPerHour,
          )
        : 0,
    [metric, numericMinutes, treatAsCaloriesPerHour, weight],
  )
  const shownCalories = isManual
    ? manualCalories
    : estimated > 0
      ? String(Math.round(estimated))
      : ''

  const resetEstimate = () => {
    setManualCalories('')
    setIsManual(false)
  }

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const kcal = Number(shownCalories)
    if (shownCalories === '' || !Number.isFinite(kcal) || kcal < 0) {
      onError('請確認運動消耗熱量。')
      return
    }
    if (!numericMinutes || numericMinutes <= 0 || numericMinutes > 600) {
      onError('請填寫運動時長。')
      return
    }
    const entry: ExerciseEntry = {
      id: initialEntry?.id ?? entryId('exercise'),
      type: 'exercise',
      time,
      presetId,
      name:
        presetId === 'custom' ? customName.trim() || '自訂運動' : preset.name,
      met: Number.isFinite(metric) && metric > 0 ? metric : null,
      minutes: numericMinutes,
      kcal,
    }
    if (!onSubmit(entry)) return
    if (!initialEntry) {
      resetEstimate()
      setTime(currentTimeString())
    }
  }

  return (
    <form id={formId} className="entry-form" onSubmit={add}>
      <div className="entry-form-grid exercise-grid">
        <SelectField
          label="類型"
          value={presetId}
          options={EXERCISE_OPTIONS}
          onValueChange={(value) => {
            setPresetId(value)
            resetEstimate()
          }}
        />
        <label>
          時長（分）
          <input
            min="1"
            max="600"
            type="number"
            value={minutes}
            onChange={(event) => {
              setMinutes(event.target.value)
              resetEstimate()
            }}
          />
        </label>
        <label>
          消耗（kcal）
          <input
            min="0"
            step="1"
            type="number"
            value={shownCalories}
            onChange={(event) => {
              setManualCalories(event.target.value)
              setIsManual(true)
            }}
            placeholder="自動"
          />
        </label>
        <TimePicker label="時間" value={time} onValueChange={setTime} />
      </div>

      {presetId === 'custom' ? (
        <div className="entry-form-grid custom-grid">
          <label>
            自訂名稱
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="例如 爬樓梯"
            />
          </label>
          <label>
            自訂 MET 或每小時 kcal
            <input
              min="0.5"
              step="0.1"
              type="number"
              value={customMetric}
              onChange={(event) => {
                setCustomMetric(event.target.value)
                resetEstimate()
              }}
              placeholder="MET 例如 6"
            />
          </label>
        </div>
      ) : null}

      <p className="hint">
        {!weight
          ? '尚未在快速計算儲存體重，請手動填消耗熱量。'
          : metric > 0 && numericMinutes > 0
            ? treatAsCaloriesPerHour
              ? `以每小時 ${metric} kcal 估算`
              : `MET ${metric} × ${weight} kg × ${numericMinutes} 分 ≈ ${Math.round(estimated)} kcal`
            : '依 MET × 體重 × 時長估算；也可手動改消耗 kcal。'}
      </p>
      {!hideSubmitButton ? (
        <button className="secondary-btn" type="submit">
          {submitLabel}
        </button>
      ) : null}
    </form>
  )
}

interface WeightFormProps {
  formId?: string
  hideSubmitButton?: boolean
  initialWeight: number | null
  submitLabel?: string
  onSubmit: (weight: number) => boolean
  onError: (message: string) => void
}

export function WeightForm({
  formId,
  hideSubmitButton = false,
  initialWeight,
  submitLabel,
  onSubmit,
  onError,
}: WeightFormProps) {
  const [weight, setWeight] = useState(
    initialWeight === null ? '' : String(initialWeight),
  )

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericWeight = Number(weight)
    if (weight === '' || !isValidWeightKg(numericWeight)) {
      onError(WEIGHT_RANGE_MESSAGE)
      return
    }
    onSubmit(numericWeight)
  }

  return (
    <form id={formId} className="entry-form" onSubmit={save}>
      <div className="entry-form-grid weight-grid">
        <label>
          實際體重（kg）
          <input
            required
            min={WEIGHT_RANGE_KG.min}
            max={WEIGHT_RANGE_KG.max}
            step="0.1"
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="kg"
          />
        </label>
      </div>
      <p className="hint">同一天只保留一筆，再次儲存會更新原紀錄。</p>
      {!hideSubmitButton ? (
        <button className="secondary-btn" type="submit">
          {submitLabel ??
            (initialWeight === null ? '＋ 新增體重紀錄' : '更新體重紀錄')}
        </button>
      ) : null}
    </form>
  )
}

export function EntryForms(props: EntryFormsProps) {
  const tour = useTour()
  const activeTab = props.activeCategory
  const showRibbon = props.showRibbon ?? true

  const addEntry = (entry: DiaryEntry): boolean => {
    const saved = props.onAdd(entry)
    if (!saved) return false
    if (entry.type === 'food' && tour.step?.id === 'food-form') {
      tour.goTo('exercise-tab')
    }
    if (entry.type === 'exercise' && tour.step?.id === 'exercise-form') {
      tour.goTo('weight-tab')
    }
    return true
  }

  const setWeight = (weight: number): boolean => {
    const saved = props.onSetWeight(weight)
    if (saved && tour.step?.id === 'weight-form') tour.goTo('records-tab')
    return saved
  }

  return (
    <section className="entry-composer" data-ribbon={showRibbon}>
      {showRibbon ? (
        <LayeredBranchBar
          className="entry-active-ribbon"
          connector="left"
          hiddenFromAssistiveTechnology
        >
          <span>
            {activeTab === 'food'
              ? '新增飲食'
              : activeTab === 'exercise'
                ? '新增運動'
                : activeTab === 'weight'
                  ? '記錄體重'
                  : '旅程成就'}
          </span>
          <small>{activeTab.toUpperCase()}</small>
        </LayeredBranchBar>
      ) : null}
      <div className="entry-form-window">
        {activeTab === 'food' ? (
          <div data-tour-anchor="food-form">
            <FoodForm onSubmit={addEntry} onError={props.onError} />
          </div>
        ) : activeTab === 'exercise' ? (
          <div data-tour-anchor="exercise-form">
            <ExerciseForm
              weight={props.weight}
              onSubmit={addEntry}
              onError={props.onError}
            />
          </div>
        ) : activeTab === 'weight' ? (
          <div data-tour-anchor="weight-form">
            <WeightForm
              key={props.actualWeightKg ?? 'empty'}
              initialWeight={props.actualWeightKg}
              onSubmit={setWeight}
              onError={props.onError}
            />
          </div>
        ) : (
          props.achievementPanel
        )}
      </div>
    </section>
  )
}
