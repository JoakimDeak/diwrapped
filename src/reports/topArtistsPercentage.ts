import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topArtistsPercentage(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Artists (% of Total Plays)'],
    ['Rank', 'Artist', 'Plays', '% of Total'],
  ]

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      GROUP BY a.id
      ORDER BY play_count DESC
      LIMIT 50
    `
    )
    .all() as Array<{ artist_name: string; play_count: number }>

  results.forEach((row, index) => {
    const percentage = ((row.play_count / totalPlays) * 100).toFixed(2)
    rows.push([
      String(index + 1),
      row.artist_name,
      String(row.play_count),
      `${percentage}%`,
    ])
  })

  return rows
}
