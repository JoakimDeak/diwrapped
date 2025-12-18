import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function listeningTimeByArtist(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Listening Time by Artist'],
    ['Rank', 'Artist', 'Minutes', 'Hours'],
  ]

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        SUM(s.duration) / 60000.0 as total_minutes
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN songs s ON p.song_id = s.id
      GROUP BY a.id
      ORDER BY total_minutes DESC
      LIMIT 50
    `
    )
    .all() as Array<{ artist_name: string; total_minutes: number }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.artist_name,
      row.total_minutes.toFixed(0),
      (row.total_minutes / 60).toFixed(1),
    ])
  })

  return rows
}
