import { describe, expect, it, vi } from 'vitest'
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

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
  it('identifies browser and packaged desktop clients explicitly', async () => {
    const { getAdminClientVariant } = await import('../../src/lib/http/platform')

    expect(getAdminClientVariant({})).toBe('browser')
    expect(getAdminClientVariant({ __TAURI__: {} })).toBe('desktop')
  })

  it('sends the required Admin client variant header', async () => {
    const { buildCommonHeaders } = await import('../../src/lib/http/platform')
    const headers = buildCommonHeaders()

    expect(headers['X-Admin-Client-Variant']).toBe('browser')
  })

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

  it('does not force JSON content type for FormData uploads', async () => {
    cookieGet.mockImplementation((key: string) => key === 'access_token' ? 'token' : undefined)

    const { applyCommonHeaders } = await import('../../src/lib/http/headers')
    const config = {
      data: new FormData(),
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig<FormData>

    applyCommonHeaders(config)

    const headers = config.headers as AxiosHeaders
    expect(headers.get('Content-Type')).toBeUndefined()
    expect(headers.get('Authorization')).toBe('Bearer token')
    expect(config.withCredentials).toBe(true)
  })
})
