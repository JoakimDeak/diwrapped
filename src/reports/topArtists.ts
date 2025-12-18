import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topArtists(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Artists'],
    ['Rank', 'Artist', 'Total Plays', 'Unique Songs'],
  ]

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(*) as total_plays,
        COUNT(DISTINCT s.name) as unique_songs
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN songs s ON p.song_id = s.id
      GROUP BY a.id
      ORDER BY total_plays DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    artist_name: string
    total_plays: number
    unique_songs: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.artist_name,
      String(row.total_plays),
      String(row.unique_songs),
    ])
  })

  return rows
}
