import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function songStreaks(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Songs with Longest Day Streaks'],
    ['Rank', 'Song', 'Artist', 'Longest Streak (Days)'],
  ]

  // This requires finding consecutive days for each song
  // Using a more complex query with window functions
  const results = db
    .query(
      `
      WITH song_dates AS (
        SELECT DISTINCT
          s.name as song_name,
          a.name as artist_name,
          DATE(p.timestamp) as play_date
        FROM plays p
        JOIN songs s ON p.song_id = s.id
        JOIN artists a ON p.artist_id = a.id
      ),
      date_groups AS (
        SELECT
          song_name,
          artist_name,
          play_date,
          julianday(play_date) - ROW_NUMBER() OVER (
            PARTITION BY song_name, artist_name
            ORDER BY play_date
          ) as grp
        FROM song_dates
      ),
      streaks AS (
        SELECT
          song_name,
          artist_name,
          COUNT(*) as streak_length
        FROM date_groups
        GROUP BY song_name, artist_name, grp
      )
      SELECT
        song_name,
        artist_name,
        MAX(streak_length) as longest_streak
      FROM streaks
      GROUP BY song_name, artist_name
      ORDER BY longest_streak DESC
      LIMIT 20
    `
    )
    .all() as Array<{
    song_name: string
    artist_name: string
    longest_streak: number
  }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.song_name,
      row.artist_name,
      String(row.longest_streak),
    ])
  })

  return rows
}
