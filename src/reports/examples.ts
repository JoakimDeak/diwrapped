import { Database } from 'bun:sqlite'
import { type ReportRow } from '../types'

export function topSongsReport(db: Database): ReportRow[] {
  // Placeholder implementation
  return [
    ['Top Songs'],
    ['Rank', 'Song', 'Artist', 'Plays'],
    ['1', 'Example Song 1', 'Example Artist 1', '100'],
    ['2', 'Example Song 2', 'Example Artist 2', '90'],
    ['3', 'Example Song 3', 'Example Artist 3', '85'],
  ]
}

export function topArtistsReport(db: Database): ReportRow[] {
  // Placeholder implementation
  return [
    ['Top Artists'],
    ['Rank', 'Artist', 'Total Plays', 'Unique Songs'],
    ['1', 'Example Artist 1', '250', '15'],
    ['2', 'Example Artist 2', '200', '12'],
    ['3', 'Example Artist 3', '180', '10'],
  ]
}

export function topGenresReport(db: Database): ReportRow[] {
  // Placeholder implementation
  return [
    ['Top Genres'],
    ['Rank', 'Genre', 'Plays'],
    ['1', 'Pop', '500'],
    ['2', 'Rock', '400'],
    ['3', 'Hip Hop', '350'],
  ]
}

export function listeningByHourReport(db: Database): ReportRow[] {
  // Placeholder implementation
  return [
    ['Listening by Hour'],
    ['Hour', 'Plays'],
    ['00:00', '10'],
    ['01:00', '5'],
    ['02:00', '2'],
    // ... more hours
  ]
}

export function listeningByDayOfWeekReport(db: Database): ReportRow[] {
  // Placeholder implementation
  return [
    ['Listening by Day of Week'],
    ['Day', 'Plays'],
    ['Monday', '150'],
    ['Tuesday', '140'],
    ['Wednesday', '160'],
    ['Thursday', '155'],
    ['Friday', '180'],
    ['Saturday', '200'],
    ['Sunday', '190'],
  ]
}
