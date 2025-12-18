import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function popularityBreakdown(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Popularity Breakdown'],
    ['Range', 'Plays', '% of Total'],
  ]

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const results = db
    .query(
      `
      SELECT
        CASE
          WHEN s.popularity < 10 THEN '0-9'
          WHEN s.popularity < 20 THEN '10-19'
          WHEN s.popularity < 30 THEN '20-29'
          WHEN s.popularity < 40 THEN '30-39'
          WHEN s.popularity < 50 THEN '40-49'
          WHEN s.popularity < 60 THEN '50-59'
          WHEN s.popularity < 70 THEN '60-69'
          WHEN s.popularity < 80 THEN '70-79'
          WHEN s.popularity < 90 THEN '80-89'
          ELSE '90-100'
        END as range,
        COUNT(*) as play_count
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      GROUP BY range
      ORDER BY
        CASE range
          WHEN '0-9' THEN 1
          WHEN '10-19' THEN 2
          WHEN '20-29' THEN 3
          WHEN '30-39' THEN 4
          WHEN '40-49' THEN 5
          WHEN '50-59' THEN 6
          WHEN '60-69' THEN 7
          WHEN '70-79' THEN 8
          WHEN '80-89' THEN 9
          ELSE 10
        END
    `
    )
    .all() as Array<{ range: string; play_count: number }>

  results.forEach((row) => {
    const percentage = ((row.play_count / totalPlays) * 100).toFixed(1)
    rows.push([row.range, String(row.play_count), `${percentage}%`])
  })

  return rows
}
