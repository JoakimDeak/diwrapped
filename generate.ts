import { Database } from 'bun:sqlite'
import { ReportBuilder } from './src/ReportBuilder'
import { reportRegistry } from './src/reports'
import { selectReports } from './src/cli'
import { writeCSV } from './src/csv'

async function main() {
  // Open database
  const db = new Database('db.sqlite', { readonly: true })

  // Show interactive selection
  const { selectedReports, cancelled } = await selectReports(reportRegistry)

  if (cancelled) {
    console.log('\n❌ Report generation cancelled')
    db.close()
    process.exit(0)
  }

  if (selectedReports.length === 0) {
    console.log('\n⚠️  No reports selected')
    db.close()
    process.exit(0)
  }

  console.log(
    `\n✓ Selected ${selectedReports.length} report${
      selectedReports.length > 1 ? 's' : ''
    }:`
  )
  selectedReports.forEach((report) => {
    console.log(`  - ${report.name}`)
  })

  // Build reports using builder pattern
  console.log('\n📊 Generating reports...\n')
  const builder = new ReportBuilder(db)
  builder.addReports(selectedReports)
  const rows = builder.build()

  // Write to CSV
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `spotify-wrapped-${timestamp}.csv`
  writeCSV(filename, rows)

  console.log(
    `\n✅ Generated ${builder.getReportCount()} reports successfully!`
  )

  db.close()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
