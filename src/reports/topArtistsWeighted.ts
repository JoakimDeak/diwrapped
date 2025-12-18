import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topArtistsWeighted(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Artists (Weighted by Song Diversity)'],
    ['Rank', 'Artist', 'Plays', 'Unique Songs', 'Score'],
  ]

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(*) as play_count,
        COUNT(DISTINCT s.name) as unique_songs,
        COUNT(*) * COUNT(DISTINCT s.name) as score
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN songs s ON p.song_id = s.id
      GROUP BY a.name
      ORDER BY score DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    artist_name: string
    play_count: number
    unique_songs: number
    score: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.artist_name,
      String(row.play_count),
      String(row.unique_songs),
      String(row.score),
    ])
  })

  return rows
}
