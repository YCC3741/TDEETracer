import { describe, expect, it } from 'vitest'
import {
  createWeightChartData,
  createWeightChartOptions,
  readWeightChartPalette,
  type WeightChartPalette,
} from '../../src/components/weightChartPresentation'
import type { WeightChartSeries } from '../../src/domain/weightChart'

const darkPalette: WeightChartPalette = {
  actual: '#69b38d',
  forecast: '#d2b06a',
  forecastFill: 'rgba(210, 176, 106, 0.18)',
  grid: 'rgba(187, 199, 209, 0.14)',
  legend: '#eef3f6',
  text: '#bbc7d1',
}

const paletteTokens: Record<keyof WeightChartPalette, string> = {
  actual: '--chart-actual',
  forecast: '--chart-forecast',
  forecastFill: '--chart-forecast-fill',
  grid: '--chart-grid',
  legend: '--chart-legend',
  text: '--chart-text',
}

describe('WeightChart theme presentation', () => {
  it('injects canvas colours outside the domain series', () => {
    const series: WeightChartSeries = {
      labels: ['2026/8/11'],
      datasets: [
        {
          kind: 'forecast',
          label: '更新後預估',
          data: [72],
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: true,
          tension: 0.22,
          spanGaps: false,
        },
        {
          kind: 'actual',
          label: '實際體重',
          data: [71.8],
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: false,
          tension: 0.18,
          spanGaps: true,
        },
      ],
    }

    const data = createWeightChartData(series, darkPalette)

    expect(data.datasets[0]).toMatchObject({
      borderColor: darkPalette.forecast,
      backgroundColor: darkPalette.forecastFill,
    })
    expect(data.datasets[1]).toMatchObject({
      borderColor: darkPalette.actual,
      backgroundColor: darkPalette.actual,
    })
  })

  it('uses the active palette for axes, legend and grid', () => {
    const options = createWeightChartOptions(darkPalette)

    expect(options.scales?.x?.ticks).toMatchObject({ color: darkPalette.text })
    expect(options.scales?.y?.grid).toMatchObject({ color: darkPalette.grid })
    expect(options.plugins?.legend?.labels).toMatchObject({
      color: darkPalette.legend,
    })
  })

  it('reads a fresh palette after theme tokens change', () => {
    const root = document.documentElement
    for (const [key, token] of Object.entries(paletteTokens)) {
      root.style.setProperty(
        token,
        darkPalette[key as keyof WeightChartPalette],
      )
    }

    expect(readWeightChartPalette(root)).toEqual(darkPalette)

    root.style.setProperty('--chart-forecast', 'updated-forecast')
    expect(readWeightChartPalette(root).forecast).toBe('updated-forecast')

    for (const token of Object.values(paletteTokens)) {
      root.style.removeProperty(token)
    }
  })
})
