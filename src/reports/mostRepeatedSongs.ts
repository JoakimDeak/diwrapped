import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function mostRepeatedSongs(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Most Repeated Songs in a Single Day'],
    ['Rank', 'Song', 'Artist', 'Date', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        s.name as song_name,
        a.name as artist_name,
        DATE(p.timestamp) as play_date,
        COUNT(*) as plays_that_day
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN artists a ON p.artist_id = a.id
      GROUP BY s.name, a.name, play_date
      ORDER BY plays_that_day DESC
      LIMIT 50
    `
    )
    .all() as Array<{
    song_name: string
    artist_name: string
    play_date: string
    plays_that_day: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.song_name,
      row.artist_name,
      row.play_date,
      String(row.plays_that_day),
    ])
  })

  return rows
}
