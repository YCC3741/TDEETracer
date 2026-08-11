import { useMemo, useState, type FormEvent } from 'react'
import { SelectField } from '../../components/SelectField'
import { TimePicker } from '../../components/TimePicker'
import { estimateExerciseCalories } from '../../domain/calculations'
import { EXERCISE_PRESETS } from '../../domain/constants'
import { currentTimeString } from '../../domain/date'
import type { DiaryEntry, ExerciseEntry, FoodEntry } from '../../domain/types'
import { useTour } from '../tour/TourContext'

interface EntryFormsProps {
  weight: number | null
  actualWeightKg: number | null
  onAdd: (entry: DiaryEntry) => boolean
  onSetWeight: (weight: number) => boolean
  onError: (message: string) => void
}

const EXERCISE_SELECT_COPY: Record<
  string,
  { label: string; description: string }
> = {
  walk: { label: '走路', description: '一般步行 · MET 3.5' },
  brisk: { label: '快走', description: '較快步行 · MET 4.3' },
  jog: { label: '慢跑', description: '中高強度慢跑 · MET 7' },
  run: { label: '跑步', description: '高強度跑步 · MET 9.8' },
  bike_easy: { label: '休閒自行車', description: '低強度騎乘 · MET 4' },
  bike_mod: { label: '中等自行車', description: '中等強度騎乘 · MET 8' },
  swim: { label: '游泳', description: '一般強度游泳 · MET 7' },
  weights: { label: '重訓', description: '一般重量訓練 · MET 5' },
  custom: {
    label: '自訂',
    description: '自行輸入名稱與 MET 或每小時消耗熱量',
  },
}

function entryId(kind: string): string {
  return `${kind}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

interface FoodFormProps {
  initialEntry?: FoodEntry
  submitLabel?: string
  onSubmit: (entry: FoodEntry) => boolean
  onError: (message: string) => void
}

export function FoodForm({
  initialEntry,
  submitLabel = '＋ 新增飲食並計算',
  onSubmit,
  onError,
}: FoodFormProps) {
  const [time, setTime] = useState(initialEntry?.time ?? currentTimeString())
  const [calories, setCalories] = useState(
    initialEntry ? String(initialEntry.kcal) : '',
  )

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const kcal = Number(calories)
    if (
      calories === '' ||
      !Number.isFinite(kcal) ||
      kcal < 0 ||
      kcal > 10_000
    ) {
      onError('請填寫有效的飲食熱量。')
      return
    }
    const entry: FoodEntry = {
      id: initialEntry?.id ?? entryId('food'),
      type: 'food',
      time,
      label: initialEntry?.label ?? '飲食',
      kcal,
    }
    if (!onSubmit(entry)) return
    if (!initialEntry) {
      setCalories('')
      setTime(currentTimeString())
    }
  }

  return (
    <form className="entry-form" onSubmit={add}>
      <div className="entry-form-grid food-grid">
        <TimePicker label="時間（選填）" value={time} onValueChange={setTime} />
        <label>
          熱量（kcal）
          <input
            min="0"
            max="10000"
            step="10"
            type="number"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
            placeholder="kcal"
          />
        </label>
      </div>
      <button className="secondary-btn" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

interface ExerciseFormProps {
  weight: number | null
  initialEntry?: ExerciseEntry
  submitLabel?: string
  onSubmit: (entry: ExerciseEntry) => boolean
  onError: (message: string) => void
}

export function ExerciseForm({
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
  const treatAsCaloriesPerHour = presetId === 'custom' && metric > 20
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
    <form className="entry-form" onSubmit={add}>
      <div className="entry-form-grid exercise-grid">
        <SelectField
          label="類型"
          value={presetId}
          options={EXERCISE_PRESETS.map((item) => {
            const copy = EXERCISE_SELECT_COPY[item.id]
            return {
              value: item.id,
              label: copy?.label ?? item.name,
              ...(copy ? { description: copy.description } : {}),
            }
          })}
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
      <button className="secondary-btn" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

interface WeightFormProps {
  initialWeight: number | null
  submitLabel?: string
  onSubmit: (weight: number) => boolean
  onError: (message: string) => void
}

export function WeightForm({
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
    if (
      weight === '' ||
      !Number.isFinite(numericWeight) ||
      numericWeight < 25 ||
      numericWeight > 350
    ) {
      onError('請填寫 25–350 kg 之間的有效體重。')
      return
    }
    onSubmit(numericWeight)
  }

  return (
    <form className="entry-form" onSubmit={save}>
      <div className="entry-form-grid weight-grid">
        <label>
          實際體重（kg）
          <input
            required
            min="25"
            max="350"
            step="0.1"
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="kg"
          />
        </label>
      </div>
      <p className="hint">同一天只保留一筆，再次儲存會更新原紀錄。</p>
      <button className="secondary-btn" type="submit">
        {submitLabel ??
          (initialWeight === null ? '＋ 新增體重紀錄' : '更新體重紀錄')}
      </button>
    </form>
  )
}

export function EntryForms(props: EntryFormsProps) {
  const tour = useTour()
  const [tab, setTab] = useState<'food' | 'exercise' | 'weight'>('food')
  const guidedTab =
    tour.step?.id === 'food-form' || tour.step?.id === 'exercise-tab'
      ? 'food'
      : tour.step?.id === 'exercise-form' || tour.step?.id === 'weight-tab'
        ? 'exercise'
        : tour.step?.id === 'weight-form'
          ? 'weight'
          : null
  const activeTab = guidedTab ?? tab

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
    if (saved && tour.step?.id === 'weight-form') tour.complete()
    return saved
  }

  return (
    <section className="entry-composer">
      <div className="segmented entry-tabs">
        <button
          className={activeTab === 'food' ? 'active' : ''}
          type="button"
          onClick={() => setTab('food')}
        >
          新增飲食
        </button>
        <button
          className={activeTab === 'exercise' ? 'active' : ''}
          type="button"
          data-tour-anchor="exercise-tab"
          onClick={() => {
            setTab('exercise')
            if (tour.step?.id === 'exercise-tab') tour.goTo('exercise-form')
          }}
        >
          新增運動
        </button>
        <button
          className={activeTab === 'weight' ? 'active' : ''}
          type="button"
          data-tour-anchor="weight-tab"
          onClick={() => {
            setTab('weight')
            if (tour.step?.id === 'weight-tab') tour.goTo('weight-form')
          }}
        >
          記錄體重
        </button>
      </div>
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
      ) : (
        <div data-tour-anchor="weight-form">
          <WeightForm
            key={props.actualWeightKg ?? 'empty'}
            initialWeight={props.actualWeightKg}
            onSubmit={setWeight}
            onError={props.onError}
          />
        </div>
      )}
    </section>
  )
}
