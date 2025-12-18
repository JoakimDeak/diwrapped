import { type Report } from './types'

export interface SelectionResult {
  selectedReports: Report[]
  cancelled: boolean
}

export async function selectReports(
  availableReports: Report[]
): Promise<SelectionResult> {
  console.log('\n🎵 Spotify Wrapped Report Generator\n')
  console.log('Select the reports you want to generate:\n')

  const selected = new Set<number>()
  let currentIndex = 0

  // Display instructions
  console.log(
    'Use ↑/↓ to navigate, SPACE to toggle, ENTER to confirm, Q to quit\n'
  )

  const renderOptions = () => {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H')

    console.log('\n🎵 Spotify Wrapped Report Generator\n')
    console.log(
      'Use ↑/↓ to navigate, SPACE to toggle, ENTER to confirm, Q to quit\n'
    )

    availableReports.forEach((report, index) => {
      const isSelected = selected.has(index)
      const isCurrent = index === currentIndex
      const checkbox = isSelected ? '✓' : ' '
      const cursor = isCurrent ? '→' : ' '

      console.log(
        `${cursor} [${checkbox}] ${report.name} - ${report.description}`
      )
    })

    console.log(
      `\nSelected: ${selected.size}/${availableReports.length} reports`
    )
  }

  return new Promise((resolve) => {
    // Enable raw mode to capture key presses
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    renderOptions()

    const onData = (key: string) => {
      // Ctrl+C or Q to quit
      if (key === '\u0003' || key === 'q' || key === 'Q') {
        cleanup()
        resolve({ selectedReports: [], cancelled: true })
        return
      }

      // Up arrow
      if (key === '\u001b[A') {
        currentIndex = Math.max(0, currentIndex - 1)
        renderOptions()
      }

      // Down arrow
      if (key === '\u001b[B') {
        currentIndex = Math.min(availableReports.length - 1, currentIndex + 1)
        renderOptions()
      }

      // Space to toggle
      if (key === ' ') {
        if (selected.has(currentIndex)) {
          selected.delete(currentIndex)
        } else {
          selected.add(currentIndex)
        }
        renderOptions()
      }

      // Enter to confirm
      if (key === '\r' || key === '\n') {
        cleanup()
        const selectedReports = Array.from(selected)
          .sort((a, b) => a - b)
          .map((index) => availableReports[index])
          .filter((report): report is Report => report !== undefined)
        resolve({ selectedReports, cancelled: false })
      }
    }

    const cleanup = () => {
      process.stdin.removeListener('data', onData)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
    }

    process.stdin.on('data', onData)
  })
}
