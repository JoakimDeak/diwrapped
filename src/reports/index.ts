import { type ReportRegistry } from '../types'
import {
  topSongsReport,
  topArtistsReport,
  topGenresReport,
  listeningByHourReport,
  listeningByDayOfWeekReport,
} from './examples'

export const reportRegistry: ReportRegistry = {
  'top-songs': {
    id: 'top-songs',
    name: 'Top Songs',
    description: 'Your most played songs',
    fn: topSongsReport,
  },
  'top-artists': {
    id: 'top-artists',
    name: 'Top Artists',
    description: 'Your most played artists',
    fn: topArtistsReport,
  },
  'top-genres': {
    id: 'top-genres',
    name: 'Top Genres',
    description: 'Your most listened to genres',
    fn: topGenresReport,
  },
  'listening-by-hour': {
    id: 'listening-by-hour',
    name: 'Listening by Hour',
    description: 'Your listening patterns by hour of day',
    fn: listeningByHourReport,
  },
  'listening-by-day': {
    id: 'listening-by-day',
    name: 'Listening by Day of Week',
    description: 'Your listening patterns by day of week',
    fn: listeningByDayOfWeekReport,
  },
}
