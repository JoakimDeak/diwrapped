import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topSongsWeighted(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Songs (Weighted by Consistency)'],
    ['Rank', 'Song', 'Artist', 'Plays', 'Days', 'Score'],
  ]

  const results = db
    .query(
      `
      SELECT
        s.name as song_name,
        a.name as artist_name,
        COUNT(*) as play_count,
        COUNT(DISTINCT DATE(p.timestamp)) as unique_days,
        COUNT(*) * COUNT(DISTINCT DATE(p.timestamp)) as score
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN artists a ON p.artist_id = a.id
      GROUP BY s.name, a.name
      ORDER BY score DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    song_name: string
    artist_name: string
    play_count: number
    unique_days: number
    score: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.song_name,
      row.artist_name,
      String(row.play_count),
      String(row.unique_days),
      String(row.score),
    ])
  })

  return rows
}
