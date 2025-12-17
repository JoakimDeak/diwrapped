import csv from 'csv-parser'
import fs from 'fs'
import { Database } from 'bun:sqlite'

const ids = new Set<string>()
const batch: string[] = []

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

console.log(accessToken)

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
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT,
      followers INTEGER,
      name TEXT,
      popularity INTEGER
    );
  `
)
db.run(
  `
    CREATE TABLE IF NOT EXISTS artist_genres (
      artist_id INTEGER,
      genre_id INTEGER,
      PRIMARY KEY (artist_id, genre_id),
      FOREIGN KEY (artist_id) REFERENCES artists(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    );
  `
)
db.run(
  `
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT,
      total_tracks INTEGER,
      name TEXT,
      release_date TEXT,
      
    );
  `
)
db.run(
  `
    CREATE TABLE IF NOT EXISTS plays (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      song_id INTEGER NOT NULL,
      album_id INTEGER NOT NULL,
      artist_id INTEGER NOT NULL,
      FOREIGN KEY (song_id) REFERENCES songs(id),
      FOREIGN KEY (album_id) REFERENCES albums(id),
      FOREIGN KEY (artist_id) REFERENCES artists(id)
    );
  `
)

// fs.createReadStream('./data/full-data.csv')
//   .pipe(csv(['time', 'song', 'artist', 'song_id', 'link']))
//   .on('data', (data) => {
//     // push to db
//     if (!ids.has(data.song_id)) {
//       ids.add(data.song_id)
//       batch.push(data.song_id)
//     }
//     if (batch.length > 0 && batch.length % 50 === 0) {
//       // fetch and push to db
//       batch.length = 0
//     }
//   })
//   .on('close', () => {
//     console.log('done')
//     console.log(ids.size)
//   })
