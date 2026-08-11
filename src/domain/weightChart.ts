import {
  addDays,
  formatDisplayDate,
  parseLocalDate,
  toDateString,
} from './date'
import type { SimulationResult, WeightMeasurement } from './types'

export function buildWeightChartData(
  simulation: SimulationResult,
  startDate: Date,
  label: string,
  measurements: WeightMeasurement[],
) {
  const sortedMeasurements = [...measurements].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  const simulationEnd = addDays(startDate, simulation.daily.length - 1)
  const firstMeasurement = sortedMeasurements[0]
  const axisStart =
    firstMeasurement && parseLocalDate(firstMeasurement.date) < startDate
      ? parseLocalDate(firstMeasurement.date)
      : startDate
  const dateKeys: string[] = []
  for (let date = axisStart; date <= simulationEnd; date = addDays(date, 1)) {
    dateKeys.push(toDateString(date))
  }
  const forecastByDate = new Map(
    simulation.daily.map((weight, day) => [
      toDateString(addDays(startDate, day)),
      weight,
    ]),
  )
  const measurementByDate = new Map(
    sortedMeasurements.map((measurement) => [
      measurement.date,
      measurement.weight,
    ]),
  )
  const datasets = [
    {
      label,
      data: dateKeys.map((date) => forecastByDate.get(date) ?? null),
      borderColor: '#ffd28a',
      backgroundColor: 'rgba(255, 174, 96, .16)',
      pointRadius: simulation.daily.length > 60 ? 0 : 2,
      pointHoverRadius: 4,
      borderWidth: 2,
      fill: true,
      tension: 0.22,
      spanGaps: false,
    },
  ]
  if (sortedMeasurements.length) {
    datasets.push({
      label: '實際體重',
      data: dateKeys.map((date) => measurementByDate.get(date) ?? null),
      borderColor: '#78d7b5',
      backgroundColor: '#78d7b5',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: false,
      tension: 0.18,
      spanGaps: true,
    })
  }

  return {
    labels: dateKeys.map((date) => formatDisplayDate(parseLocalDate(date))),
    datasets,
  }
}
