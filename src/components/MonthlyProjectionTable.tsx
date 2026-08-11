import { buildProjectionRows } from '../domain/projection'
import type { Profile, SimulationResult } from '../domain/types'

interface MonthlyProjectionTableProps {
  simulation: SimulationResult
  profile: Profile
  startDate: Date
  showSource?: boolean
}

export function MonthlyProjectionTable({
  simulation,
  profile,
  startDate,
  showSource = false,
}: MonthlyProjectionTableProps) {
  const rows = buildProjectionRows(simulation, profile, startDate)
  return (
    <div className="table-box">
      <table>
        <thead>
          <tr>
            <th>時間</th>
            <th>日期</th>
            <th>體重</th>
            <th>本期變化</th>
            <th>TDEE</th>
            <th>每日赤字</th>
            {showSource ? <th>來源</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.label}-${row.date}`}>
              <td>{row.label}</td>
              <td>{row.date}</td>
              <td>{row.weight.toFixed(2)} kg</td>
              <td>{row.lost === null ? '—' : `${row.lost.toFixed(2)} kg`}</td>
              <td>{Math.round(row.tdee)} kcal</td>
              <td>{Math.round(row.deficit)} kcal</td>
              {showSource ? (
                <td>
                  {row.source === 'actual'
                    ? '日記'
                    : row.source === 'plan'
                      ? '計畫'
                      : '—'}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
