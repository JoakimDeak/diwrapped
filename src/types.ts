import { Database } from 'bun:sqlite'

export type ReportRow = string[]

export type ReportFunction = (db: Database) => ReportRow[]

export interface Report {
  id: string
  name: string
  description: string
  fn: ReportFunction
}

export interface ReportRegistry {
  [key: string]: Report
}
