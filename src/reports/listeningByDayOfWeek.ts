import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function listeningByDayOfWeek(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Listening by Day of Week'], ['Day', 'Plays']]

  const results = db
    .query(
      `
      SELECT
        CASE CAST(strftime('%w', timestamp) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as day_name,
        COUNT(*) as play_count
      FROM plays
      GROUP BY strftime('%w', timestamp)
      ORDER BY (CAST(strftime('%w', timestamp) AS INTEGER) + 6) % 7
    `
    )
    .all() as Array<{ day_name: string; play_count: number }>

  results.forEach((row) => {
    rows.push([row.day_name, String(row.play_count)])
  })

  return rows
}
