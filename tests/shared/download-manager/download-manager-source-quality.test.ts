import { describe, expect, it } from 'vitest'

describe('DownloadManager error behavior', () => {
  it('rejects malformed download errors instead of inventing fallback messages', async () => {
    const { isDownloadUserCancelled, requireDownloadError } = await import('@/components/DownloadManager/src/errors')

    expect(isDownloadUserCancelled(new Error('cancelled'), 'cancelled')).toBe(true)
    expect(isDownloadUserCancelled(new Error('failed'), 'cancelled')).toBe(false)
    expect(() => requireDownloadError('download failed', 'download')).toThrow('download failed with non-Error reason')
    expect(() => requireDownloadError(new Error(''), 'download')).toThrow('download error message must be non-empty')
  })
})
