import { describe, it, expect, vi, afterEach } from 'vitest'
import { FileDownloadService } from '../FileDownloadService'

const svc = new FileDownloadService()

describe('FileDownloadService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates blob and triggers download', () => {
    const clickMock = vi.fn()
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/data')
    const revokeObjectURLMock = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement)
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    })

    svc.downloadJson('{"a":1}', 'test.json')

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(clickMock).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalled()
  })

  it('uses default filename data.json', () => {
    const clickMock = vi.fn()
    const anchor = { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:'),
      revokeObjectURL: vi.fn(),
    })

    svc.downloadJson('[]')

    expect(anchor.download).toBe('data.json')
  })
})
