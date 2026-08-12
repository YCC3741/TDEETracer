import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { SimulationResult, WeightMeasurement } from '../domain/types'
import { buildWeightChartData } from '../domain/weightChart'
import { useCurrentTheme } from '../features/theme/ThemeContext'
import {
  createWeightChartData,
  createWeightChartOptions,
  readWeightChartPalette,
} from './weightChartPresentation'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

interface WeightChartProps {
  simulation: SimulationResult
  startDate: Date
  label?: string
  measurements?: WeightMeasurement[]
}

export function WeightChart({
  simulation,
  startDate,
  label = '預估體重',
  measurements = [],
}: WeightChartProps) {
  useCurrentTheme()
  const palette = readWeightChartPalette()
  const series = buildWeightChartData(
    simulation,
    startDate,
    label,
    measurements,
  )
  const data = createWeightChartData(series, palette)
  const options = createWeightChartOptions(palette)

  return (
    <div className="chart-box">
      <Line data={data} options={options} />
    </div>
  )
}
