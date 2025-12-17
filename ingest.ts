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
// max 50
const songBatch: string[] = []

const artistIds = new Set<string>()
// max 50
const artistBatch: string[] = []

const albumIds = new Set<string>()
// max 20
const albumBatch: string[] = []

fs.createReadStream('./data/full-data.csv')
  .pipe(csv(['time', 'song', 'artist', 'song_id', 'link']))
  .on('data', (data) => {})
  .on('close', () => {
    console.log('done')
  })
