import { Database } from 'bun:sqlite'
import { type Report, type ReportRow } from './types'

export class ReportBuilder {
  private reports: Report[] = []
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  addReport(report: Report): this {
    this.reports.push(report)
    return this
  }

  addReports(reports: Report[]): this {
    this.reports.push(...reports)
    return this
  }

  build(): ReportRow[] {
    const allRows: ReportRow[] = []

    for (let i = 0; i < this.reports.length; i++) {
      const report = this.reports[i]
      if (!report) continue

      console.log(`Generating report: ${report.name}...`)

      const reportRows = report.fn(this.db)
      allRows.push(...reportRows)

      // Add spacing between reports (except after the last one)
      if (i < this.reports.length - 1) {
        allRows.push([]) // Empty row
        allRows.push([]) // Empty row
      }
    }

    return allRows
  }

  getReportCount(): number {
    return this.reports.length
  }
}
