import { describe, expect, it, vi } from 'vitest'

const cookieGet = vi.hoisted(() => vi.fn<(key: string) => string | undefined>())

vi.mock('js-cookie', () => ({
  default: {
    get: cookieGet,
  },
}))

vi.mock('../../src/lib/http/device', () => ({
  getDeviceId: () => 'test-device-id',
}))

vi.stubGlobal('navigator', {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
})

describe('HTTP common language header', () => {
  it('sends Accept-Language from lang cookie', async () => {
    cookieGet.mockImplementation((key: string) => key === 'lang' ? 'en-US' : undefined)

    const { buildCommonHeaders } = await import('../../src/lib/http/platform')
    const headers = buildCommonHeaders('token')
    expect(headers['Accept-Language']).toBe('en-US')
  })

  it('defaults unsupported language to zh-CN', async () => {
    cookieGet.mockImplementation((key: string) => key === 'lang' ? 'fr-FR' : undefined)

    const { buildCommonHeaders } = await import('../../src/lib/http/platform')
    const headers = buildCommonHeaders()
    expect(headers['Accept-Language']).toBe('zh-CN')
  })
})
