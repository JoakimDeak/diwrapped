import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function averageSongPopularity(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Average Song Popularity'], ['Metric', 'Value']]

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

  // Calculate percentiles
  const percentiles = db
    .query(
      `
      WITH popularity_values AS (
        SELECT
          s.popularity,
          ROW_NUMBER() OVER (ORDER BY s.popularity) as row_num,
          COUNT(*) OVER () as total_count
        FROM plays p
        JOIN songs s ON p.song_id = s.id
      )
      SELECT
        (SELECT popularity FROM popularity_values WHERE row_num >= CAST(total_count * 0.25 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p25,
        (SELECT popularity FROM popularity_values WHERE row_num >= CAST(total_count * 0.50 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p50,
        (SELECT popularity FROM popularity_values WHERE row_num >= CAST(total_count * 0.75 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p75
      FROM popularity_values
      LIMIT 1
    `
    )
    .get() as { p25: number | null; p50: number | null; p75: number | null }

  rows.push(['Average', result.avg_popularity.toFixed(2)])
  rows.push(['Median (50th percentile)', String(percentiles.p50 || 0)])
  rows.push(['25th percentile', String(percentiles.p25 || 0)])
  rows.push(['75th percentile', String(percentiles.p75 || 0)])
  rows.push(['Minimum', String(result.min_popularity)])
  rows.push(['Maximum', String(result.max_popularity)])

  return rows
}
