import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function listeningMinutes(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Listening Minutes'],
    ['Period', 'Minutes', 'Hours'],
  ]

  // Total
  const total = db
    .query(
      `
      SELECT SUM(s.duration) / 60000.0 as total_minutes
      FROM plays p
      JOIN songs s ON p.song_id = s.id
    `
    )
    .get() as { total_minutes: number }

  rows.push([
    'Total',
    total.total_minutes.toFixed(0),
    (total.total_minutes / 60).toFixed(1),
  ])

  // By month
  const byMonth = db
    .query(
      `
      SELECT
        strftime('%Y-%m', timestamp) as month,
        SUM(s.duration) / 60000.0 as minutes
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `
    )
    .all() as Array<{ month: string; minutes: number }>

  rows.push([]) // Empty row
  rows.push(['By Month'])
  rows.push(['Month', 'Minutes', 'Hours'])
  byMonth.forEach((row) => {
    rows.push([
      row.month,
      row.minutes.toFixed(0),
      (row.minutes / 60).toFixed(1),
    ])
  })

  return rows
}
