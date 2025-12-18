import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function artistStreaks(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Artists with Longest Day Streaks'],
    ['Rank', 'Artist', 'Longest Streak (Days)'],
  ]

  const results = db
    .query(
      `
      WITH artist_dates AS (
        SELECT DISTINCT
          a.id as artist_id,
          a.name as artist_name,
          DATE(p.timestamp) as play_date
        FROM plays p
        JOIN artists a ON p.artist_id = a.id
      ),
      date_groups AS (
        SELECT
          artist_id,
          artist_name,
          play_date,
          julianday(play_date) - ROW_NUMBER() OVER (
            PARTITION BY artist_id
            ORDER BY play_date
          ) as grp
        FROM artist_dates
      ),
      streaks AS (
        SELECT
          artist_id,
          artist_name,
          COUNT(*) as streak_length
        FROM date_groups
        GROUP BY artist_id, grp
      )
      SELECT
        artist_name,
        MAX(streak_length) as longest_streak
      FROM streaks
      GROUP BY artist_id
      ORDER BY longest_streak DESC
      LIMIT 20
    `
    )
    .all() as Array<{ artist_name: string; longest_streak: number }>

  results.forEach((row, index) => {
    rows.push([String(index + 1), row.artist_name, String(row.longest_streak)])
  })

  return rows
}
