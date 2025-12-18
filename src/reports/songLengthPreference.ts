import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function songLengthPreference(db: Database): ReportRow[] {
  const rows: ReportRow[] = [
    ['Song Length Preference'],
    ['Metric', 'Value (Minutes)'],
  ]

  const result = db
    .query(
      `
      SELECT
        AVG(s.duration) / 60000.0 as avg_duration,
        MIN(s.duration) / 60000.0 as min_duration,
        MAX(s.duration) / 60000.0 as max_duration
      FROM plays p
      JOIN songs s ON p.song_id = s.id
    `
    )
    .get() as {
    avg_duration: number
    min_duration: number
    max_duration: number
  }

  // Calculate median
  const median = db
    .query(
      `
      WITH ordered_durations AS (
        SELECT
          s.duration / 60000.0 as duration_mins,
          ROW_NUMBER() OVER (ORDER BY s.duration) as row_num,
          COUNT(*) OVER () as total_count
        FROM plays p
        JOIN songs s ON p.song_id = s.id
      )
      SELECT AVG(duration_mins) as median_duration
      FROM ordered_durations
      WHERE row_num IN (
        CAST((total_count + 1) / 2 AS INTEGER),
        CAST((total_count + 2) / 2 AS INTEGER)
      )
    `
    )
    .get() as { median_duration: number } | null

  rows.push(['Average', result.avg_duration.toFixed(2)])
  rows.push(['Median', (median?.median_duration || 0).toFixed(2)])
  rows.push(['Shortest', result.min_duration.toFixed(2)])
  rows.push(['Longest', result.max_duration.toFixed(2)])

  // Distribution by length category
  rows.push([])
  rows.push(['Distribution by Length'])
  rows.push(['Category', 'Plays', '% of Total'])

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const distribution = db
    .query(
      `
      SELECT
        CASE
          WHEN s.duration < 120000 THEN 'Very Short (< 2 min)'
          WHEN s.duration < 180000 THEN 'Short (2-3 min)'
          WHEN s.duration < 240000 THEN 'Medium (3-4 min)'
          WHEN s.duration < 300000 THEN 'Long (4-5 min)'
          ELSE 'Very Long (5+ min)'
        END as category,
        COUNT(*) as play_count
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      GROUP BY category
      ORDER BY
        CASE category
          WHEN 'Very Short (< 2 min)' THEN 1
          WHEN 'Short (2-3 min)' THEN 2
          WHEN 'Medium (3-4 min)' THEN 3
          WHEN 'Long (4-5 min)' THEN 4
          ELSE 5
        END
    `
    )
    .all() as Array<{ category: string; play_count: number }>

  distribution.forEach((row) => {
    const pct = ((row.play_count / totalPlays) * 100).toFixed(1)
    rows.push([row.category, String(row.play_count), `${pct}%`])
  })

  return rows
}
