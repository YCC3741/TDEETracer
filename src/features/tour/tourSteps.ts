export type TourStepId =
  | 'quick-profile'
  | 'quick-fields'
  | 'quick-strategy'
  | 'quick-submit'
  | 'quick-results'
  | 'mode-switch'
  | 'plan-create'
  | 'diary-editor'
  | 'food-form'
  | 'exercise-tab'
  | 'exercise-form'
  | 'weight-tab'
  | 'weight-form'

export interface TourStep {
  id: TourStepId
  anchor: string
  title: string
  description: string
  requiresAction?: boolean
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'quick-profile',
    anchor: 'quick-profile-card',
    title: '從 Quick 開始',
    description: '先建立一份可隨時調整的試算，再決定是否開始正式計畫。',
  },
  {
    id: 'quick-fields',
    anchor: 'quick-profile-fields',
    title: '填寫身體資料',
    description:
      '請輸入自己的性別、年齡、身高、起始體重、目標體重與平均活動量。',
  },
  {
    id: 'quick-strategy',
    anchor: 'quick-strategy',
    title: '選擇熱量策略',
    description: '可以設定每日攝取量，或改用固定熱量赤字。',
  },
  {
    id: 'quick-submit',
    anchor: 'quick-submit',
    title: '儲存 Quick 試算',
    description: '完成必填資料後按下計算；成功儲存才會繼續導覽。',
    requiresAction: true,
  },
  {
    id: 'quick-results',
    anchor: 'quick-results',
    title: '查看動態預估',
    description: '這裡會顯示路程、TDEE、體重曲線與每月預估。',
  },
  {
    id: 'mode-switch',
    anchor: 'mode-switch',
    title: '進入精細計算',
    description: '切換到精細模式，將 Quick 試算轉成可持續記錄的正式計畫。',
    requiresAction: true,
  },
  {
    id: 'plan-create',
    anchor: 'plan-dialog-form',
    title: '命名正式計畫',
    description: '輸入計畫名稱並建立；正式計畫會保留自己的設定與日記。',
    requiresAction: true,
  },
  {
    id: 'diary-editor',
    anchor: 'diary-editor',
    title: '認識每日紀錄',
    description: '精細計算會把每天的飲食、運動和實際體重帶回預測。',
  },
  {
    id: 'food-form',
    anchor: 'food-form',
    title: '新增一筆飲食',
    description: '輸入今天的攝取熱量並儲存，合計與預測會立即更新。',
    requiresAction: true,
  },
  {
    id: 'exercise-tab',
    anchor: 'exercise-tab',
    title: '切換到運動',
    description: '點選新增運動，記錄活動類型、時間與消耗。',
    requiresAction: true,
  },
  {
    id: 'exercise-form',
    anchor: 'exercise-form',
    title: '新增一筆運動',
    description: '可使用 MET 自動估算，也可以手動調整消耗熱量。',
    requiresAction: true,
  },
  {
    id: 'weight-tab',
    anchor: 'weight-tab',
    title: '切換到體重',
    description: '點選記錄體重，將實際數值加入體重曲線。',
    requiresAction: true,
  },
  {
    id: 'weight-form',
    anchor: 'weight-form',
    title: '記錄實際體重',
    description: '儲存今天的體重後就完成教學，之後可在工作區選單重新開始。',
    requiresAction: true,
  },
]

export function createTourSteps(skipPlanCreation: boolean): TourStep[] {
  return skipPlanCreation
    ? TOUR_STEPS.filter((step) => step.id !== 'plan-create')
    : TOUR_STEPS
}
