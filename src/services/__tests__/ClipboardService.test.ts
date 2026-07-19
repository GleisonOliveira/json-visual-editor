import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClipboardService } from '../ClipboardService'

const svc = new ClipboardService()

describe('ClipboardService', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes text to clipboard', async () => {
    await svc.writeText('hello')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
  })

  it('propagates errors on failure', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('denied'))
    await expect(svc.writeText('secret')).rejects.toThrow('denied')
  })
})
