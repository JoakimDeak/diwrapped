import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function musicDiscoveryRate(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Music Discovery Rate'],
    ['Month', 'New Artists', 'New Songs'],
  ]

  const results = db
    .query(
      `
      WITH first_plays AS (
        SELECT
          a.name as artist_name,
          s.name as song_name,
          MIN(p.timestamp) as first_play
        FROM plays p
        JOIN artists a ON p.artist_id = a.id
        JOIN songs s ON p.song_id = s.id
        GROUP BY a.name, s.name
      )
      SELECT
        strftime('%Y-%m', first_play) as month,
        COUNT(DISTINCT artist_name) as new_artists,
        COUNT(DISTINCT song_name) as new_songs
      FROM first_plays
      GROUP BY month
      ORDER BY month DESC
    `
    )
    .all() as Array<{
    month: string
    new_artists: number
    new_songs: number
  }>

  results.forEach((row) => {
    rows.push([row.month, String(row.new_artists), String(row.new_songs)])
  })

  return rows
}
