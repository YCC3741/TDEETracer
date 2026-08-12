import type { ChartData, ChartOptions } from 'chart.js'
import type { WeightChartSeries } from '../domain/weightChart'

export interface WeightChartPalette {
  actual: string
  forecast: string
  forecastFill: string
  grid: string
  legend: string
  text: string
}

const paletteTokens: Record<keyof WeightChartPalette, string> = {
  actual: '--chart-actual',
  forecast: '--chart-forecast',
  forecastFill: '--chart-forecast-fill',
  grid: '--chart-grid',
  legend: '--chart-legend',
  text: '--chart-text',
}

export function readWeightChartPalette(
  element: Element = document.documentElement,
): WeightChartPalette {
  const styles = getComputedStyle(element)
  return Object.fromEntries(
    Object.entries(paletteTokens).map(([key, token]) => [
      key,
      styles.getPropertyValue(token).trim(),
    ]),
  ) as unknown as WeightChartPalette
}

export function createWeightChartData(
  series: WeightChartSeries,
  palette: WeightChartPalette,
): ChartData<'line', Array<number | null>, string> {
  return {
    labels: series.labels,
    datasets: series.datasets.map(({ kind, ...dataset }) => ({
      ...dataset,
      borderColor: kind === 'forecast' ? palette.forecast : palette.actual,
      backgroundColor:
        kind === 'forecast' ? palette.forecastFill : palette.actual,
    })),
  }
}

export function createWeightChartOptions(
  palette: WeightChartPalette,
): ChartOptions<'line'> {
  return {
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
          color: palette.text,
          maxTicksLimit: 10,
        },
        grid: { color: palette.grid },
      },
      y: {
        ticks: { color: palette.text },
        grid: { color: palette.grid },
        title: {
          display: true,
          text: '體重（kg）',
          color: palette.text,
        },
      },
    },
    plugins: {
      legend: {
        labels: { color: palette.legend },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${Number(context.parsed.y).toFixed(2)} kg`,
        },
      },
    },
  }
}
