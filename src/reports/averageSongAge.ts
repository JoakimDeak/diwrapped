import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function averageSongAge(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Average Song Age'], ['Metric', 'Value (Years)']]

  // Get all ages for percentile calculations
  const ages = db
    .query(
      `
      WITH song_ages AS (
        SELECT DISTINCT
          s.id,
          (julianday('now') - julianday(
            CASE
              WHEN length(al.release_date) = 4 THEN al.release_date || '-01-01'
              WHEN length(al.release_date) = 7 THEN al.release_date || '-01'
              ELSE al.release_date
            END
          )) / 365.25 as age_years
        FROM plays p
        JOIN songs s ON p.song_id = s.id
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
          s.id,
          (julianday('now') - julianday(
            CASE
              WHEN length(al.release_date) = 4 THEN al.release_date || '-01-01'
              WHEN length(al.release_date) = 7 THEN al.release_date || '-01'
              ELSE al.release_date
            END
          )) / 365.25 as age_years
        FROM plays p
        JOIN songs s ON p.song_id = s.id
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
        (SELECT age_years FROM ordered_ages WHERE row_num >= CAST(total_count * 0.25 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p25,
        (SELECT age_years FROM ordered_ages WHERE row_num >= CAST(total_count * 0.50 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p50,
        (SELECT age_years FROM ordered_ages WHERE row_num >= CAST(total_count * 0.75 AS INTEGER) AND row_num > 0 ORDER BY row_num LIMIT 1) as p75
      FROM ordered_ages
      LIMIT 1
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
