import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function decadeBreakdown(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Decade Breakdown'],
    ['Decade', 'Plays', '% of Total'],
  ]

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const results = db
    .query(
      `
      SELECT
        (CAST(substr(
          CASE
            WHEN length(al.release_date) = 4 THEN al.release_date
            WHEN length(al.release_date) = 7 THEN substr(al.release_date, 1, 4)
            ELSE substr(al.release_date, 1, 4)
          END
        , 1, 4) AS INTEGER) / 10) * 10 as decade,
        COUNT(*) as play_count
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN album_songs als ON s.id = als.song_id
      JOIN albums al ON als.album_id = al.id
      WHERE al.release_date IS NOT NULL AND al.release_date != ''
      GROUP BY decade
      ORDER BY decade ASC
    `
    )
    .all() as Array<{ decade: number; play_count: number }>

  results.forEach((row) => {
    const percentage = ((row.play_count / totalPlays) * 100).toFixed(1)
    rows.push([`${row.decade}s`, String(row.play_count), `${percentage}%`])
  })

  return rows
}
