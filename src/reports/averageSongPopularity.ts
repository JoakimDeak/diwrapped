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

  rows.push(['Average Popularity', result.avg_popularity.toFixed(2)])
  rows.push(['Min Popularity', String(result.min_popularity)])
  rows.push(['Max Popularity', String(result.max_popularity)])

  return rows
}
