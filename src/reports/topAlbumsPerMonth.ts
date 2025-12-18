import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topAlbumsPerMonth(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Top Albums per Month']]

  // Get list of months
  const months = db
    .query(
      `
      SELECT DISTINCT strftime('%Y-%m', timestamp) as month
      FROM plays
      ORDER BY month ASC
    `
    )
    .all() as Array<{ month: string }>

  months.forEach((monthRow) => {
    rows.push([]) // Empty row
    rows.push([`Month: ${monthRow.month}`])
    rows.push(['Rank', 'Album', 'Artist', 'Plays'])

    const results = db
      .query(
        `
        SELECT
          al.name as album_name,
          (
            SELECT GROUP_CONCAT(name, ', ')
            FROM (
              SELECT DISTINCT a2.name
              FROM plays p2
              JOIN artists a2 ON p2.artist_id = a2.id
              JOIN songs s2 ON p2.song_id = s2.id
              JOIN album_songs als2 ON s2.id = als2.song_id
              WHERE als2.album_id = al.id
                AND strftime('%Y-%m', p2.timestamp) = ?
            )
          ) as artist_name,
          COUNT(*) as play_count
        FROM plays p
        JOIN songs s ON p.song_id = s.id
        JOIN artists a ON p.artist_id = a.id
        JOIN album_songs als ON s.id = als.song_id
        JOIN albums al ON als.album_id = al.id
        WHERE strftime('%Y-%m', p.timestamp) = ?
        GROUP BY al.id
        ORDER BY play_count DESC
        LIMIT 10
      `
      )
      .all(monthRow.month, monthRow.month) as Array<{
      album_name: string
      artist_name: string
      play_count: number
    }>

    results.forEach((row, index) => {
      rows.push([
        String(index + 1),
        row.album_name,
        row.artist_name,
        String(row.play_count),
      ])
    })
  })

  return rows
}
