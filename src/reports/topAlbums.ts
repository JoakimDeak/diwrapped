import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topAlbums(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Albums'],
    ['Rank', 'Album', 'Artist', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        al.name as album_name,
        COALESCE((
          SELECT GROUP_CONCAT(a2.name, ', ')
          FROM album_artists aa
          JOIN artists a2 ON aa.artist_id = a2.id
          WHERE aa.album_id = al.id
        ), 'Unknown') as artist_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN album_songs als ON s.id = als.song_id
      JOIN albums al ON als.album_id = al.id
      GROUP BY al.id
      ORDER BY play_count DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    album_name: string
    artist_name: string
    play_count: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.album_name,
      row.artist_name,
      String(row.play_count),
    ])
  })

  return rows
}
