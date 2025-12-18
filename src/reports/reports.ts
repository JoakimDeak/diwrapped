import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topSongsReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Songs'],
    ['Rank', 'Song', 'Artist', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        s.name as song_name,
        a.name as artist_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN artists a ON p.artist_id = a.id
      GROUP BY p.song_id, p.artist_id
      ORDER BY play_count DESC
      LIMIT 50
    `
    )
    .all() as Array<{ song_name: string; artist_name: string; play_count: number }>

  results.forEach((row, index) => {
    rows.push([
      String(index + 1),
      row.song_name,
      row.artist_name,
      String(row.play_count),
    ])
  })

  return rows
}

export function topArtistsReport(db: Database): ReportRow[] {
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
        COUNT(DISTINCT p.song_id) as unique_songs
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      GROUP BY p.artist_id
      ORDER BY total_plays DESC
      LIMIT 50
    `
    )
    .all() as Array<{ artist_name: string; total_plays: number; unique_songs: number }>

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

export function topGenresReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Genres'],
    ['Rank', 'Genre', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        g.name as genre_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN artist_genres ag ON a.id = ag.artist_id
      JOIN genres g ON ag.genre_id = g.id
      GROUP BY g.id
      ORDER BY play_count DESC
      LIMIT 20
    `
    )
    .all() as Array<{ genre_name: string; play_count: number }>

  results.forEach((row, index) => {
    rows.push([String(index + 1), row.genre_name, String(row.play_count)])
  })

  return rows
}

export function listeningByHourReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Listening by Hour'],
    ['Hour', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        strftime('%H', timestamp) as hour,
        COUNT(*) as play_count
      FROM plays
      GROUP BY hour
      ORDER BY hour
    `
    )
    .all() as Array<{ hour: string; play_count: number }>

  results.forEach((row) => {
    rows.push([`${row.hour}:00`, String(row.play_count)])
  })

  return rows
}

export function listeningByDayOfWeekReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Listening by Day of Week'],
    ['Day', 'Plays'],
  ]

  const results = db
    .query(
      `
      SELECT
        CASE CAST(strftime('%w', timestamp) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as day_name,
        COUNT(*) as play_count
      FROM plays
      GROUP BY strftime('%w', timestamp)
      ORDER BY (CAST(strftime('%w', timestamp) AS INTEGER) + 6) % 7
    `
    )
    .all() as Array<{ day_name: string; play_count: number }>

  results.forEach((row) => {
    rows.push([row.day_name, String(row.play_count)])
  })

  return rows
}
