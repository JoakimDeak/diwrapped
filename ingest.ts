import csv from 'csv-parser'
import fs from 'fs'
import { Database } from 'bun:sqlite'

const res = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
})
const resJson = await res.json()
if (
  !resJson ||
  typeof resJson !== 'object' ||
  !('access_token' in resJson) ||
  typeof resJson.access_token !== 'string'
) {
  throw new Error("Couldn't get access token")
}
const accessToken = resJson.access_token

const db = new Database('db.sqlite', { create: true })
db.run(`PRAGMA foreign_keys = ON;`)
db.run(
  `
    CREATE TABLE IF NOT EXISTS genres (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS artists (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE NOT NULL,
      name       TEXT NOT NULL,
      followers  INTEGER,
      popularity INTEGER
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS albums (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id   TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      release_date TEXT,
      total_tracks INTEGER,
      popularity   INTEGER
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS songs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE NOT NULL,
      name       TEXT NOT NULL,
      duration   INTEGER,
      explicit   INTEGER,
      popularity INTEGER
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS artist_genres (
      artist_id INTEGER NOT NULL,
      genre_id  INTEGER NOT NULL,
      PRIMARY KEY (artist_id, genre_id),
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS album_artists (
      album_id  INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      PRIMARY KEY (album_id, artist_id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS album_songs (
      album_id INTEGER NOT NULL,
      song_id  INTEGER NOT NULL,
      track_number INTEGER,
      PRIMARY KEY (album_id, song_id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS song_artists (
      song_id   INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      PRIMARY KEY (song_id, artist_id),
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );
  `
)

db.run(
  `
    CREATE TABLE IF NOT EXISTS plays (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      song_id   INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );
  `
)

db.run(
  `CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);`
)
db.run(
  `CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id);`
)
db.run(`CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);`)
db.run(`CREATE INDEX IF NOT EXISTS idx_plays_song_id ON plays(song_id);`)
db.run(`CREATE INDEX IF NOT EXISTS idx_plays_timestamp ON plays(timestamp);`)

const songIds = new Set<string>()
const songBatch: string[] = []

const artistIds = new Set<string>()
const artistBatch: string[] = []

const albumIds = new Set<string>()
const albumBatch: string[] = []

// Helper function to fetch tracks from Spotify
async function fetchTracks(ids: string[]) {
  const url = `https://api.spotify.com/v1/tracks?ids=${ids.join(',')}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch tracks: ${res.status} ${res.statusText}`)
  }
  return await res.json()
}

// Helper function to fetch albums from Spotify
async function fetchAlbums(ids: string[]) {
  const url = `https://api.spotify.com/v1/albums?ids=${ids.join(',')}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch albums: ${res.status} ${res.statusText}`)
  }
  return await res.json()
}

// Helper function to fetch artists from Spotify
async function fetchArtists(ids: string[]) {
  const url = `https://api.spotify.com/v1/artists?ids=${ids.join(',')}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch artists: ${res.status} ${res.statusText}`)
  }
  return await res.json()
}

// Helper function to insert or get genre ID
function getOrCreateGenre(name: string): number {
  const existing = db
    .query('SELECT id FROM genres WHERE name = ?')
    .get(name) as { id: number } | null
  if (existing) return existing.id

  const result = db.query('INSERT INTO genres (name) VALUES (?)').run(name)
  return result.lastInsertRowid as number
}

// Helper function to get artist ID
function getArtist(spotifyId: string): number | null {
  const existing = db
    .query('SELECT id FROM artists WHERE spotify_id = ?')
    .get(spotifyId) as { id: number } | null
  return existing ? existing.id : null
}

// Helper function to get song ID
function getSong(spotifyId: string): number | null {
  const existing = db
    .query('SELECT id FROM songs WHERE spotify_id = ?')
    .get(spotifyId) as { id: number } | null
  return existing ? existing.id : null
}

// Helper function to get album ID
function getAlbum(spotifyId: string): number | null {
  const existing = db
    .query('SELECT id FROM albums WHERE spotify_id = ?')
    .get(spotifyId) as { id: number } | null
  return existing ? existing.id : null
}

// Process a batch of tracks
async function processSongBatch(batch: string[]) {
  if (batch.length === 0) return

  console.log(`Fetching ${batch.length} tracks...`)
  const data = (await fetchTracks(batch)) as any

  for (const track of data.tracks) {
    if (!track) continue // Handle null tracks (deleted/unavailable)

    // Insert song
    let songDbId = getSong(track.id)
    if (!songDbId) {
      songDbId = db
        .query(
          'INSERT INTO songs (spotify_id, name, duration, explicit, popularity) VALUES (?, ?, ?, ?, ?)'
        )
        .run(
          track.id,
          track.name,
          track.duration_ms,
          track.explicit ? 1 : 0,
          track.popularity
        ).lastInsertRowid as number
    }

    // Link song to artists
    for (const artist of track.artists || []) {
      if (artist?.id) {
        // Collect artist IDs for later fetching
        if (!artistIds.has(artist.id)) {
          artistIds.add(artist.id)
          artistBatch.push(artist.id)
        }

        // Create song-artist relationship (artist might not exist yet, will be created later)
        // We'll create this relationship after artists are fetched
      }
    }

    // Collect album IDs
    if (track.album?.id && !albumIds.has(track.album.id)) {
      albumIds.add(track.album.id)
      albumBatch.push(track.album.id)
    }
  }
}

// Process a batch of albums
async function processAlbumBatch(batch: string[]) {
  if (batch.length === 0) return

  console.log(`Fetching ${batch.length} albums...`)
  const data = (await fetchAlbums(batch)) as any

  for (const album of data.albums) {
    if (!album) continue

    // Insert album
    const albumExists = getAlbum(album.id)
    if (!albumExists) {
      const albumId = db
        .query(
          'INSERT INTO albums (spotify_id, name, release_date, total_tracks, popularity) VALUES (?, ?, ?, ?, ?)'
        )
        .run(
          album.id,
          album.name,
          album.release_date,
          album.total_tracks,
          album.popularity
        ).lastInsertRowid as number

      // Link album to songs
      for (const track of album.tracks?.items || []) {
        if (track?.id) {
          const songDbId = getSong(track.id)
          if (songDbId) {
            db.query(
              'INSERT OR IGNORE INTO album_songs (album_id, song_id, track_number) VALUES (?, ?, ?)'
            ).run(albumId, songDbId, track.track_number)
          }
        }
      }
    }
  }
}

// Process a batch of artists
async function processArtistBatch(batch: string[]) {
  if (batch.length === 0) return

  console.log(`Fetching ${batch.length} artists...`)
  const data = (await fetchArtists(batch)) as any

  for (const artist of data.artists) {
    if (!artist) continue

    // Insert artist
    const artistExists = getArtist(artist.id)
    if (!artistExists) {
      const artistId = db
        .query(
          'INSERT INTO artists (spotify_id, name, followers, popularity) VALUES (?, ?, ?, ?)'
        )
        .run(
          artist.id,
          artist.name,
          artist.followers?.total || 0,
          artist.popularity
        ).lastInsertRowid as number

      // Link artist to genres
      for (const genreName of artist.genres || []) {
        const genreId = getOrCreateGenre(genreName)
        db.query(
          'INSERT OR IGNORE INTO artist_genres (artist_id, genre_id) VALUES (?, ?)'
        ).run(artistId, genreId)
      }
    }
  }
}

const stream = fs
  .createReadStream('./data/full-data.csv')
  .pipe(csv(['time', 'song', 'artist', 'song_id', 'link']))
  .on('data', async (data) => {
    const songId = data.song_id
    if (!songId) return

    // Add to set and batch if not seen before
    if (!songIds.has(songId)) {
      songIds.add(songId)
      songBatch.push(songId)
    }

    // Process batch when it reaches 50
    if (songBatch.length >= 50) {
      stream.pause()
      await processSongBatch(songBatch)
      songBatch.length = 0
      stream.resume()
    }
  })
  .on('close', async () => {
    console.log('CSV processing complete')

    // Process remaining song batch
    await processSongBatch(songBatch)

    // Process album batches (max 20 per request)
    console.log(`\nProcessing ${albumIds.size} unique albums...`)
    while (albumBatch.length > 0) {
      const batch = albumBatch.splice(0, 20)
      await processAlbumBatch(batch)
    }

    // Process artist batches (max 50 per request)
    console.log(`\nProcessing ${artistIds.size} unique artists...`)
    while (artistBatch.length > 0) {
      const batch = artistBatch.splice(0, 50)
      await processArtistBatch(batch)
    }

    // Link albums to artists
    console.log('\nLinking albums to artists...')
    const albumIdArray = Array.from(albumIds)
    for (let i = 0; i < albumIdArray.length; i += 20) {
      const batch = albumIdArray.slice(i, i + 20)
      const data = (await fetchAlbums(batch)) as any

      for (const album of data.albums) {
        if (!album) continue

        const albumDbId = getAlbum(album.id)
        if (albumDbId) {
          for (const artist of album.artists || []) {
            if (artist?.id) {
              const artistDbId = getArtist(artist.id)
              if (artistDbId) {
                db.query(
                  'INSERT OR IGNORE INTO album_artists (album_id, artist_id) VALUES (?, ?)'
                ).run(albumDbId, artistDbId)
              }
            }
          }
        }
      }
    }

    // Link songs to artists
    console.log('\nLinking songs to artists...')
    const songIdArray = Array.from(songIds)
    for (let i = 0; i < songIdArray.length; i += 50) {
      const batch = songIdArray.slice(i, i + 50)
      const data = (await fetchTracks(batch)) as any

      for (const track of data.tracks) {
        if (!track) continue

        const songDbId = getSong(track.id)
        if (songDbId) {
          for (const artist of track.artists || []) {
            if (artist?.id) {
              const artistDbId = getArtist(artist.id)
              if (artistDbId) {
                db.query(
                  'INSERT OR IGNORE INTO song_artists (song_id, artist_id) VALUES (?, ?)'
                ).run(songDbId, artistDbId)
              }
            }
          }
        }
      }
    }

    // Now insert plays data
    console.log('\nInserting play history...')
    fs.createReadStream('./data/full-data.csv')
      .pipe(csv(['time', 'song', 'artist', 'song_id', 'link']))
      .on('data', (data) => {
        const songDbId = getSong(data.song_id)
        if (!songDbId) {
          return
        }

        // Match artist by name from CSV to get the correct artist for this play
        let songArtist = db
          .query(
            `SELECT sa.artist_id
             FROM song_artists sa
             JOIN artists a ON sa.artist_id = a.id
             WHERE sa.song_id = ? AND a.name = ?
             LIMIT 1`
          )
          .get(songDbId, data.artist) as { artist_id: number } | null

        // Fallback to first artist if name doesn't match
        if (!songArtist) {
          songArtist = db
            .query(
              `SELECT artist_id FROM song_artists WHERE song_id = ? LIMIT 1`
            )
            .get(songDbId) as { artist_id: number } | null
        }

        if (!songArtist) {
          return
        }

        const formattedDate = new Date(
          data.time.replaceAll('at', '').slice(0, -2) +
            ' ' +
            data.time.slice(-2)
        )
          .toISOString()
          .replaceAll(/T|Z/g, ' ')
          .trim()

        db.query(
          'INSERT INTO plays (timestamp, song_id, artist_id) VALUES (?, ?, ?)'
        ).run(formattedDate, songDbId, songArtist.artist_id)
      })
      .on('close', () => {
        console.log('\nAll done!')
        console.log(`Processed ${songIds.size} unique songs`)
        console.log(`Processed ${albumIds.size} unique albums`)
        console.log(`Processed ${artistIds.size} unique artists`)
      })
  })
