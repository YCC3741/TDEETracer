import { EXERCISE_PRESETS } from '../../domain/constants'

const EXERCISE_SELECT_COPY: Record<
  string,
  { label: string; intensity: string }
> = {
  walk: { label: '走路', intensity: '一般步行' },
  brisk: { label: '快走', intensity: '較快步行' },
  jog: { label: '慢跑', intensity: '中高強度慢跑' },
  run: { label: '跑步', intensity: '高強度跑步' },
  bike_easy: { label: '休閒自行車', intensity: '低強度騎乘' },
  bike_mod: { label: '中等自行車', intensity: '中等強度騎乘' },
  swim: { label: '游泳', intensity: '一般強度游泳' },
  weights: { label: '重訓', intensity: '一般重量訓練' },
  custom: { label: '自訂', intensity: '自行輸入名稱與 MET 或每小時消耗熱量' },
}

/** The MET figure comes from the preset itself, so the copy cannot drift. */
export const EXERCISE_OPTIONS = EXERCISE_PRESETS.map((preset) => {
  const copy = EXERCISE_SELECT_COPY[preset.id]
  const intensity = copy?.intensity ?? preset.name
  return {
    value: preset.id,
    label: copy?.label ?? preset.name,
    description:
      preset.met === null ? intensity : `${intensity} · MET ${preset.met}`,
  }
})
