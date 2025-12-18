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
        SELECT DISTINCT
          s.popularity,
          ROW_NUMBER() OVER (ORDER BY s.popularity) as row_num,
          COUNT(*) OVER () as total_count
        FROM plays p
        JOIN songs s ON p.song_id = s.id
      )
      SELECT
        MAX(CASE WHEN row_num = CAST(total_count * 0.25 AS INTEGER) THEN popularity END) as p25,
        MAX(CASE WHEN row_num = CAST(total_count * 0.50 AS INTEGER) THEN popularity END) as p50,
        MAX(CASE WHEN row_num = CAST(total_count * 0.75 AS INTEGER) THEN popularity END) as p75
      FROM popularity_values
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
