import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deriveDownloadFilename,
  downloadFile,
  formatFileSize,
} from '@/lib/browser/download'

describe('browser download policy', () => {
  const fetch = vi.fn()
  const appendChild = vi.fn()
  const createElement = vi.fn(() => anchor)
  const click = vi.fn()
  const remove = vi.fn()
  const createObjectURL = vi.fn(() => 'blob:download-1')
  const revokeObjectURL = vi.fn()
  const anchor = { href: '', download: '', click, remove }

  beforeEach(() => {
    fetch.mockReset()
    appendChild.mockReset()
    createElement.mockReset()
    createElement.mockReturnValue(anchor)
    click.mockReset()
    remove.mockReset()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    anchor.href = ''
    anchor.download = ''
    vi.stubGlobal('location', {
      href: 'https://www.zgm2003.cn/home',
      origin: 'https://www.zgm2003.cn',
    })
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('document', {
      createElement,
      body: { appendChild },
    })
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('derives deterministic filenames and formats file sizes', () => {
    expect(deriveDownloadFilename('https://cos.zgm2003.cn/exports/report.csv')).toBe('report.csv')
    expect(deriveDownloadFilename('https://cos.zgm2003.cn/exports/', ' audit.csv ')).toBe('audit.csv')
    expect(deriveDownloadFilename('https://cos.zgm2003.cn/exports/')).toBe('download')
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1536)).toBe('1.50 KB')
  })

  it('downloads same-origin and allowlisted HTTPS files and always cleans resources', async () => {
    fetch.mockResolvedValue(new Response(new Blob(['report']), { status: 200 }))

    await downloadFile('/api/admin/v1/exports/7/file', 'report.csv')

    expect(fetch).toHaveBeenCalledWith(
      'https://www.zgm2003.cn/api/admin/v1/exports/7/file',
      { credentials: 'same-origin' },
    )
    expect(appendChild).toHaveBeenCalledWith(anchor)
    expect(anchor).toMatchObject({ href: 'blob:download-1', download: 'report.csv' })
    expect(click).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download-1')

    fetch.mockResolvedValue(new Response(new Blob(['cos']), { status: 200 }))
    await expect(downloadFile('https://cos.zgm2003.cn/exports/cos.csv')).resolves.toBeUndefined()
  })

  it('rejects untrusted URLs and HTTP failures without a mock fallback', async () => {
    for (const input of [
      'http://cos.zgm2003.cn/report.csv',
      'https://evil.example/report.csv',
      'https://user:secret@cos.zgm2003.cn/report.csv',
      'javascript:alert(1)',
    ]) {
      await expect(downloadFile(input)).rejects.toBeInstanceOf(Error)
    }
    expect(fetch).not.toHaveBeenCalled()

    fetch.mockResolvedValue(new Response('missing', { status: 404 }))
    await expect(downloadFile('/missing.csv')).rejects.toThrow('404')
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('removes the anchor and revokes the Blob URL when clicking fails', async () => {
    fetch.mockResolvedValue(new Response(new Blob(['report']), { status: 200 }))
    click.mockImplementationOnce(() => { throw new Error('click failed') })

    await expect(downloadFile('/report.csv')).rejects.toThrow('click failed')
    expect(remove).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download-1')
  })

  it('revokes the Blob URL when the temporary anchor cannot be created', async () => {
    fetch.mockResolvedValue(new Response(new Blob(['report']), { status: 200 }))
    createElement.mockImplementationOnce(() => { throw new Error('anchor unavailable') })

    await expect(downloadFile('/report.csv')).rejects.toThrow('anchor unavailable')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download-1')
  })
})
