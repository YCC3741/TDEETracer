import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../src/domain/types'
import { buildWeightChartData } from '../../src/domain/weightChart'

describe('WeightChart data', () => {
  it('aligns sparse actual measurements with an anchored forecast', () => {
    const simulation: SimulationResult = {
      daily: [72, 71.9, 71.8],
      dayMeta: [],
      days: 2,
      reached: false,
      plateaued: false,
      finalWeight: 71.8,
    }

    const data = buildWeightChartData(
      simulation,
      new Date('2026-08-11T00:00:00'),
      '更新後預估',
      [
        { date: '2026-08-09', weight: 75 },
        { date: '2026-08-11', weight: 72 },
      ],
    )

    expect(data.labels).toEqual([
      '2026/8/9',
      '2026/8/10',
      '2026/8/11',
      '2026/8/12',
      '2026/8/13',
    ])
    expect(data.datasets[0]?.data).toEqual([null, null, 72, 71.9, 71.8])
    expect(data.datasets[1]?.label).toBe('實際體重')
    expect(data.datasets[1]?.data).toEqual([75, null, 72, null, null])
    expect(data.datasets[1]?.spanGaps).toBe(true)
    expect(data.datasets[0]).not.toHaveProperty('borderColor')
    expect(data.datasets[1]).not.toHaveProperty('backgroundColor')
  })
})
