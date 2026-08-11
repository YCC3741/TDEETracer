import { useAppData } from '../../app/AppDataContext'
import { DiaryPage } from './DiaryPage'

export function DetailedPlanPage() {
  const { selectedPlan } = useAppData()
  if (!selectedPlan) return null
  return (
    <DiaryPage
      key={selectedPlan.id}
      readOnly={selectedPlan.status === 'archived'}
    />
  )
}
