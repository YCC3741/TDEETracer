import type { Achievement, ActivityLevel, ExercisePreset } from './types'

export const STORAGE_PROFILE = 'tdee_profile_v1'
export const STORAGE_DIARY = 'tdee_diary_v1'
export const STORAGE_ACHIEVEMENTS = 'tdee_ach_seen_v1'
export const STORAGE_PREFERRED_MODE = 'tdee_pref_mode_v1'
export const STORAGE_WORKSPACE = 'tdee_workspace_v3'

export const DATA_EXPORT_VERSION = 3 as const
export const KCAL_PER_KG = 7700
export const MAX_DAYS = 3650
export const PLATEAU_EPSILON = 5

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { factor: 1, name: '什麼都不做／睡覺', note: '≈ BMR 基礎代謝' },
  { factor: 1.2, name: '久坐：幾乎不運動', note: '' },
  { factor: 1.375, name: '輕度：每週運動 1–3 天', note: '' },
  { factor: 1.55, name: '中度：每週運動 3–5 天', note: '' },
  { factor: 1.725, name: '高度：每週運動 6–7 天', note: '' },
  { factor: 1.9, name: '超高強度：體力工作或每天高強度訓練', note: '' },
]

export const EXERCISE_PRESETS: ExercisePreset[] = [
  { id: 'walk', name: '走路（一般）', met: 3.5 },
  { id: 'brisk', name: '快走', met: 4.3 },
  { id: 'jog', name: '慢跑', met: 7 },
  { id: 'run', name: '跑步', met: 9.8 },
  { id: 'bike_easy', name: '自行車（休閒）', met: 4 },
  { id: 'bike_mod', name: '自行車（中等）', met: 8 },
  { id: 'swim', name: '游泳', met: 7 },
  { id: 'weights', name: '重訓', met: 5 },
  { id: 'custom', name: '自訂', met: null },
]

export const ACHIEVEMENTS: Achievement[] = [
  { days: 1, title: '初來乍到', kind: 'total' },
  { days: 2, title: '二度光臨', kind: 'total' },
  { days: 4, title: '小有堅持', kind: 'total' },
  { days: 8, title: '一週有餘', kind: 'total' },
  { days: 16, title: '雙週達人', kind: 'total' },
  { days: 32, title: '月積有成', kind: 'total' },
  { days: 64, title: '兩月之約', kind: 'total' },
  { days: 128, title: '四季過半', kind: 'total' },
  { days: 256, title: '長年旅人', kind: 'total' },
  { days: 512, title: '傳奇簽到', kind: 'total' },
]

export const STREAK_ACHIEVEMENTS: Achievement[] = [
  { days: 4, title: '連續起步', kind: 'streak' },
  { days: 8, title: '一週不斷', kind: 'streak' },
  { days: 16, title: '雙週堅持', kind: 'streak' },
  { days: 32, title: '月度連續', kind: 'streak' },
  { days: 64, title: '習慣成形', kind: 'streak' },
]
