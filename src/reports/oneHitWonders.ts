import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function oneHitWonders(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['One-Hit Wonders'],
    ['Rank', 'Artist', 'Song', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(DISTINCT s.name) as unique_songs,
        (
          SELECT s2.name
          FROM plays p2
          JOIN songs s2 ON p2.song_id = s2.id
          WHERE p2.artist_id = a.id
          GROUP BY s2.name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as top_song,
        COUNT(*) as total_plays
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN songs s ON p.song_id = s.id
      GROUP BY a.name
      HAVING unique_songs <= 2 AND total_plays >= 5
      ORDER BY total_plays DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    artist_name: string
    unique_songs: number
    top_song: string
    total_plays: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.artist_name,
      row.top_song,
      String(row.total_plays),
    ])
  })

  return rows
}
