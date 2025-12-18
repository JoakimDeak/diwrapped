import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topSongsPerMonth(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Top Songs per Month']]

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
    rows.push(['Rank', 'Song', 'Artist', 'Plays'])

    const results = db
      .query(
        `
        SELECT
          s.name as song_name,
          a.name as artist_name,
          COUNT(*) as play_count
        FROM plays p
        JOIN songs s ON p.song_id = s.id
        JOIN artists a ON p.artist_id = a.id
        WHERE strftime('%Y-%m', p.timestamp) = ?
        GROUP BY s.name, a.name
        ORDER BY play_count DESC
        LIMIT 10
      `
      )
      .all(monthRow.month) as Array<{
      song_name: string
      artist_name: string
      play_count: number
    }>

    results.forEach((row, index) => {
      rows.push([
        String(index + 1),
        row.song_name,
        row.artist_name,
        String(row.play_count),
      ])
    })
  })

  return rows
}
