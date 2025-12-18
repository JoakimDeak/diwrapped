import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function explicitContent(db: Database): ReportRow[] {
  const rows: ReportRow[] = [['Explicit Content Analysis'], ['Metric', 'Value']]

  const totalPlays = (
    db.query('SELECT COUNT(*) as total FROM plays').get() as { total: number }
  ).total

  const explicitPlays = (
    db
      .query(
        `
      SELECT COUNT(*) as total
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      WHERE s.explicit = 1
    `
      )
      .get() as { total: number }
  ).total

  const explicitPct = ((explicitPlays / totalPlays) * 100).toFixed(1)
  const cleanPct = (((totalPlays - explicitPlays) / totalPlays) * 100).toFixed(
    1
  )

  rows.push(['Total Plays', String(totalPlays)])
  rows.push(['Explicit Plays', String(explicitPlays)])
  rows.push(['Clean Plays', String(totalPlays - explicitPlays)])
  rows.push(['Explicit %', `${explicitPct}%`])
  rows.push(['Clean %', `${cleanPct}%`])

  // Top explicit artists
  rows.push([])
  rows.push(['Top Explicit Artists'])
  rows.push(['Rank', 'Artist', 'Explicit Plays'])

  const topExplicitArtists = db
    .query(
      `
      SELECT
        a.name as artist_name,
        COUNT(*) as explicit_plays
      FROM plays p
      JOIN songs s ON p.song_id = s.id
      JOIN artists a ON p.artist_id = a.id
      WHERE s.explicit = 1
      GROUP BY a.id
      ORDER BY explicit_plays DESC
      LIMIT 10
    `
    )
    .all() as Array<{ artist_name: string; explicit_plays: number }>

  topExplicitArtists.forEach((row, index) => {
    rows.push([String(index + 1), row.artist_name, String(row.explicit_plays)])
  })

  return rows
}
