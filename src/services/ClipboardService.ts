/**
 * Thin wrapper around the Clipboard API.
 * Extracted to allow mocking in tests and future DI wiring.
 */
export class ClipboardService {
  /** Writes `text` to the system clipboard. Resolves on success, rejects on failure. */
  async writeText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
  }
}
