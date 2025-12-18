import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function listeningByHour(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Listening by Hour'], ['Hour', 'Plays']]

  const results = db
    .query(
      `
      SELECT
        strftime('%H', timestamp) as hour,
        COUNT(*) as play_count
      FROM plays
      GROUP BY hour
      ORDER BY hour
    `
    )
    .all() as Array<{ hour: string; play_count: number }>

  results.forEach((row) => {
    rows.push([`${row.hour}:00`, String(row.play_count)])
  })

  return rows
}
