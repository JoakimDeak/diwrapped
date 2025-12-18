import { type ReportRegistry } from '../types'
import { topSongs } from './topSongs'
import { topArtists } from './topArtists'
import { topGenres } from './topGenres'
import { listeningByHour } from './listeningByHour'
import { listeningByDayOfWeek } from './listeningByDayOfWeek'
import { topSongsWeighted } from './topSongsWeighted'
import { topArtistsWeighted } from './topArtistsWeighted'
import { topArtistsPercentage } from './topArtistsPercentage'
import { listeningMinutes } from './listeningMinutes'
import { averageSongPopularity } from './averageSongPopularity'
import { averageSongAge } from './averageSongAge'
import { songStreaks } from './songStreaks'
import { artistStreaks } from './artistStreaks'
import { mostRepeatedSongs } from './mostRepeatedSongs'
import { listeningTimeByArtist } from './listeningTimeByArtist'
import { topSongsPerMonth } from './topSongsPerMonth'
import { topArtistsPerMonth } from './topArtistsPerMonth'
import { topGenresPerMonth } from './topGenresPerMonth'
import { oneHitWonders } from './oneHitWonders'
import { decadeBreakdown } from './decadeBreakdown'
import { explicitContent } from './explicitContent'
import { songLengthPreference } from './songLengthPreference'
import { popularityBreakdown } from './popularityBreakdown'

export const reportRegistry: ReportRegistry = [
  {
    id: 'top-songs',
    name: 'Top Songs',
    description: 'Your most played songs',
    fn: topSongs,
  },
  {
    id: 'top-songs-weighted',
    name: 'Top Songs (Weighted)',
    description: 'Songs ranked by play count × unique days',
    fn: topSongsWeighted,
  },
  {
    id: 'top-artists',
    name: 'Top Artists',
    description: 'Your most played artists',
    fn: topArtists,
  },
  {
    id: 'top-artists-weighted',
    name: 'Top Artists (Weighted)',
    description: 'Artists ranked by diversity of songs played',
    fn: topArtistsWeighted,
  },
  {
    id: 'top-artists-percentage',
    name: 'Top Artists (%)',
    description: 'Artists as percentage of total plays',
    fn: topArtistsPercentage,
  },
  {
    id: 'top-genres',
    name: 'Top Genres',
    description: 'Your most listened to genres',
    fn: topGenres,
  },
  {
    id: 'listening-by-hour',
    name: 'Listening by Hour',
    description: 'Your listening patterns by hour of day',
    fn: listeningByHour,
  },
  {
    id: 'listening-by-day',
    name: 'Listening by Day of Week',
    description: 'Your listening patterns by day of week',
    fn: listeningByDayOfWeek,
  },
  {
    id: 'listening-minutes',
    name: 'Listening Minutes',
    description: 'Total listening time by period',
    fn: listeningMinutes,
  },
  {
    id: 'song-popularity',
    name: 'Average Song Popularity',
    description: 'Average Spotify popularity of your songs',
    fn: averageSongPopularity,
  },
  {
    id: 'popularity-breakdown',
    name: 'Popularity Breakdown',
    description: 'Play distribution by popularity range',
    fn: popularityBreakdown,
  },
  {
    id: 'song-age',
    name: 'Average Song Age',
    description: 'How old are the songs you listen to',
    fn: averageSongAge,
  },
  {
    id: 'song-streaks',
    name: 'Song Streaks',
    description: 'Songs with longest consecutive day streaks',
    fn: songStreaks,
  },
  {
    id: 'artist-streaks',
    name: 'Artist Streaks',
    description: 'Artists with longest consecutive day streaks',
    fn: artistStreaks,
  },
  {
    id: 'most-repeated',
    name: 'Most Repeated in One Day',
    description: 'Songs you played most in a single day',
    fn: mostRepeatedSongs,
  },
  {
    id: 'listening-time-by-artist',
    name: 'Listening Time by Artist',
    description: 'Total time spent listening to each artist',
    fn: listeningTimeByArtist,
  },
  {
    id: 'top-songs-per-month',
    name: 'Top Songs per Month',
    description: 'Top 10 songs for each month',
    fn: topSongsPerMonth,
  },
  {
    id: 'top-artists-per-month',
    name: 'Top Artists per Month',
    description: 'Top 10 artists for each month',
    fn: topArtistsPerMonth,
  },
  {
    id: 'top-genres-per-month',
    name: 'Top Genres per Month',
    description: 'Top 10 genres for each month',
    fn: topGenresPerMonth,
  },
  {
    id: 'one-hit-wonders',
    name: 'One-Hit Wonders',
    description: 'Artists you only listened to 1-2 songs from',
    fn: oneHitWonders,
  },
  {
    id: 'decade-breakdown',
    name: 'Decade Breakdown',
    description: 'Music distribution by decade',
    fn: decadeBreakdown,
  },
  {
    id: 'explicit-content',
    name: 'Explicit Content',
    description: 'Analysis of explicit vs clean music',
    fn: explicitContent,
  },
  {
    id: 'song-length-preference',
    name: 'Song Length Preference',
    description: 'Your preference for song duration',
    fn: songLengthPreference,
  },
]
