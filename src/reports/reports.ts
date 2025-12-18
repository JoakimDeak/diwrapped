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
      GROUP BY s.name, a.name
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
        COUNT(DISTINCT s.name) as unique_songs
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      JOIN songs s ON p.song_id = s.id
      GROUP BY a.name
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

export function topSongsWeightedReport(db: Database): ReportRow[] {
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

export function topArtistsWeightedReport(db: Database): ReportRow[] {
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

export function topArtistsPercentageReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Top Artists (% of Total Plays)'],
    ['Rank', 'Artist', 'Plays', '% of Total'],
  ]

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const results = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(*) as play_count
      FROM plays p
      JOIN artists a ON p.artist_id = a.id
      GROUP BY a.name
      ORDER BY play_count DESC
      LIMIT 50
    `
    )
    .all() as Array<{ artist_name: string; play_count: number }>

  results.forEach((row, index) => {
    const percentage = ((row.play_count / totalPlays) * 100).toFixed(2)
    rows.push([
      String(index + 1),
      row.artist_name,
      String(row.play_count),
      `${percentage}%`,
    ])
  })

  return rows
}

export function listeningMinutesReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Listening Minutes'],
    ['Period', 'Minutes', 'Hours'],
  ]

  // Total
  const total = db
    .query(
      `
      SELECT SUM(s.duration) / 60000.0 as total_minutes
      FROM plays p
      JOIN songs s ON p.song_id = s.id
    `
    )
    .get() as { total_minutes: number }

  rows.push([
    'Total',
    total.total_minutes.toFixed(0),
    (total.total_minutes / 60).toFixed(1),
  ])

  // By month
  const byMonth = db
    .query(
      `
      SELECT
        strftime('%Y-%m', timestamp) as month,
        SUM(s.duration) / 60000.0 as minutes
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `
    )
    .all() as Array<{ month: string; minutes: number }>

  rows.push([]) // Empty row
  rows.push(['By Month'])
  rows.push(['Month', 'Minutes', 'Hours'])
  byMonth.forEach((row) => {
    rows.push([row.month, row.minutes.toFixed(0), (row.minutes / 60).toFixed(1)])
  })

  return rows
}

export function averageSongPopularityReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Average Song Popularity'],
    ['Metric', 'Value'],
  ]

  const result = db
    .query(
      `
      SELECT
        AVG(s.popularity) as avg_popularity,
        MIN(s.popularity) as min_popularity,
        MAX(s.popularity) as max_popularity
      FROM plays p
      JOIN songs s ON p.song_id = s.id
    `
    )
    .get() as {
      avg_popularity: number
      min_popularity: number
      max_popularity: number
    }

  rows.push(['Average Popularity', result.avg_popularity.toFixed(2)])
  rows.push(['Min Popularity', String(result.min_popularity)])
  rows.push(['Max Popularity', String(result.max_popularity)])

  return rows
}

export function averageSongAgeReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Average Song Age'],
    ['Metric', 'Value (Years)'],
  ]

  // Get all ages for percentile calculations
  const ages = db
    .query(
      `
      WITH song_ages AS (
        SELECT DISTINCT
          s.name,
          a.name as artist_name,
          (julianday('now') - julianday(
            CASE
              WHEN length(al.release_date) = 4 THEN al.release_date || '-01-01'
              WHEN length(al.release_date) = 7 THEN al.release_date || '-01'
              ELSE al.release_date
            END
          )) / 365.25 as age_years
        FROM plays p
        JOIN songs s ON p.song_id = s.id
        JOIN artists a ON p.artist_id = a.id
        JOIN album_songs als ON s.id = als.song_id
        JOIN albums al ON als.album_id = al.id
        WHERE al.release_date IS NOT NULL AND al.release_date != ''
      )
      SELECT
        AVG(age_years) as avg_age,
        MIN(age_years) as min_age,
        MAX(age_years) as max_age
      FROM song_ages
    `
    )
    .get() as { avg_age: number; min_age: number; max_age: number }

  // Calculate percentiles
  const percentiles = db
    .query(
      `
      WITH song_ages AS (
        SELECT DISTINCT
          s.name,
          a.name as artist_name,
          (julianday('now') - julianday(
            CASE
              WHEN length(al.release_date) = 4 THEN al.release_date || '-01-01'
              WHEN length(al.release_date) = 7 THEN al.release_date || '-01'
              ELSE al.release_date
            END
          )) / 365.25 as age_years
        FROM plays p
        JOIN songs s ON p.song_id = s.id
        JOIN artists a ON p.artist_id = a.id
        JOIN album_songs als ON s.id = als.song_id
        JOIN albums al ON als.album_id = al.id
        WHERE al.release_date IS NOT NULL AND al.release_date != ''
      ),
      ordered_ages AS (
        SELECT
          age_years,
          ROW_NUMBER() OVER (ORDER BY age_years) as row_num,
          COUNT(*) OVER () as total_count
        FROM song_ages
      )
      SELECT
        MAX(CASE WHEN row_num = CAST(total_count * 0.25 AS INTEGER) THEN age_years END) as p25,
        MAX(CASE WHEN row_num = CAST(total_count * 0.50 AS INTEGER) THEN age_years END) as p50,
        MAX(CASE WHEN row_num = CAST(total_count * 0.75 AS INTEGER) THEN age_years END) as p75
      FROM ordered_ages
    `
    )
    .get() as { p25: number | null; p50: number | null; p75: number | null }

  rows.push(['Average', ages.avg_age.toFixed(1)])
  rows.push(['Median (50th percentile)', (percentiles.p50 || 0).toFixed(1)])
  rows.push(['25th percentile', (percentiles.p25 || 0).toFixed(1)])
  rows.push(['75th percentile', (percentiles.p75 || 0).toFixed(1)])
  rows.push(['Minimum', ages.min_age.toFixed(1)])
  rows.push(['Maximum', ages.max_age.toFixed(1)])

  return rows
}

export function songStreaksReport(db: Database): ReportRow[] {
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

export function artistStreaksReport(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Artists with Longest Day Streaks'],
    ['Rank', 'Artist', 'Longest Streak (Days)'],
  ]

  const results = db
    .query(
      `
      WITH artist_dates AS (
        SELECT DISTINCT
          a.name as artist_name,
          DATE(p.timestamp) as play_date
        FROM plays p
        JOIN artists a ON p.artist_id = a.id
      ),
      date_groups AS (
        SELECT
          artist_name,
          play_date,
          julianday(play_date) - ROW_NUMBER() OVER (
            PARTITION BY artist_name
            ORDER BY play_date
          ) as grp
        FROM artist_dates
      ),
      streaks AS (
        SELECT
          artist_name,
          COUNT(*) as streak_length
        FROM date_groups
        GROUP BY artist_name, grp
      )
      SELECT
        artist_name,
        MAX(streak_length) as longest_streak
      FROM streaks
      GROUP BY artist_name
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

export function mostRepeatedSongsReport(db: Database): ReportRow[] {
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

export function listeningTimeByArtistReport(db: Database): ReportRow[] {
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
      GROUP BY a.name
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
