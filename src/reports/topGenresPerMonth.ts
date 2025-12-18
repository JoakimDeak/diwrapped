import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topGenresPerMonth(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Top Genres per Month']]

  // Get list of months
  const months = db
    .query(
      `
      SELECT DISTINCT strftime('%Y-%m', timestamp) as month
      FROM plays
      ORDER BY month ASC
    `
    )
    .all() as Array<{ month: string }>

  months.forEach((monthRow) => {
    rows.push([]) // Empty row
    rows.push([`Month: ${monthRow.month}`])
    rows.push(['Rank', 'Genre', 'Plays'])

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
        WHERE strftime('%Y-%m', p.timestamp) = ?
        GROUP BY g.id
        ORDER BY play_count DESC
        LIMIT 10
      `
      )
      .all(monthRow.month) as Array<{
      genre_name: string
      play_count: number
    }>

    results.forEach((row, index) => {
      rows.push([String(index + 1), row.genre_name, String(row.play_count)])
    })
  })

  return rows
}
