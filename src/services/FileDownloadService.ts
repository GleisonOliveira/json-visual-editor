/**
 * Triggers a browser file download for JSON data.
 * Extracted to allow mocking in tests and future DI wiring.
 */
export class FileDownloadService {
  /** Downloads `jsonString` as a file named `filename` (default "data.json"). */
  downloadJson(jsonString: string, filename: string = 'data.json'): void {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
