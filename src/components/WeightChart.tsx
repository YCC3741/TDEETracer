import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { SimulationResult, WeightMeasurement } from '../domain/types'
import { buildWeightChartData } from '../domain/weightChart'

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

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      ticks: {
        color: '#c9d3dc',
        maxTicksLimit: 10,
      },
      grid: { color: 'rgba(255,255,255,.08)' },
    },
    y: {
      ticks: { color: '#c9d3dc' },
      grid: { color: 'rgba(255,255,255,.08)' },
      title: {
        display: true,
        text: '體重（kg）',
        color: '#c9d3dc',
      },
    },
  },
  plugins: {
    legend: {
      labels: { color: '#f7f7f2' },
    },
    tooltip: {
      callbacks: {
        label: (context) => ` ${Number(context.parsed.y).toFixed(2)} kg`,
      },
    },
  },
}

export function WeightChart({
  simulation,
  startDate,
  label = '預估體重',
  measurements = [],
}: WeightChartProps) {
  const data = buildWeightChartData(simulation, startDate, label, measurements)

  return (
    <div className="chart-box">
      <Line data={data} options={options} />
    </div>
  )
}
