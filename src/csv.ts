import { type ReportRow } from './types'
import fs from 'fs'

export function rowsToCSV(rows: ReportRow[]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape cells that contain commas, quotes, or newlines
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        })
        .join(',')
    )
    .join('\n')
}

export function writeCSV(filepath: string, rows: ReportRow[]): void {
  const csv = rowsToCSV(rows)
  fs.writeFileSync(filepath, csv, 'utf-8')
  console.log(`\nCSV written to: ${filepath}`)
}
