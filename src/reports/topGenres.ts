import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topGenres(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Top Genres'], ['Rank', 'Genre', 'Plays']]

  const results = db
    .query(
      `
      SELECT
        g.name as genre_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN artist_genres ag ON a.id = ag.artist_id
      JOIN genres g ON ag.genre_id = g.id
      GROUP BY g.id
      ORDER BY play_count DESC
      LIMIT 20
    `
    )
    .all() as Array<{ genre_name: string; play_count: number }>

  results.forEach((row, index) => {
    rows.push([String(index + 1), row.genre_name, String(row.play_count)])
  })

  return rows
}
