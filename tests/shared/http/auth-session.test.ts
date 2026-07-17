import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  routerPush: vi.fn(),
  menuReset: vi.fn(),
  clearAllCookies: vi.fn(),
  setHeader: vi.fn(),
  getPlatform: vi.fn(() => 'admin'),
  getAdminClientVariant: vi.fn(() => 'browser'),
  getDeviceId: vi.fn(() => 'device-1'),
}))

vi.mock('axios', () => ({
  default: {
    post: mocks.axiosPost,
  },
}))

vi.mock('js-cookie', () => ({
  default: {
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  },
}))

vi.mock('@/router', () => ({
  default: {
    push: mocks.routerPush,
  },
}))

vi.mock('@/store/menu', () => ({
  useMenuStore: () => ({
    reset: mocks.menuReset,
  }),
}))

vi.mock('@/utils/storage', () => ({
  clearAllCookies: mocks.clearAllCookies,
}))

vi.mock('../../../src/lib/http/headers', () => ({
  setHeader: mocks.setHeader,
}))

vi.mock('../../../src/lib/http/platform', () => ({
  getPlatform: mocks.getPlatform,
  getAdminClientVariant: mocks.getAdminClientVariant,
}))

vi.mock('../../../src/lib/http/device', () => ({
  getDeviceId: mocks.getDeviceId,
}))

const { createAuthSessionManager } = await import('../../../src/lib/http/auth-session')

describe('auth session refresh handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.axiosPost.mockReset()
    mocks.getAdminClientVariant.mockReturnValue('browser')
    mocks.cookieGet.mockReturnValue('refresh-token')
  })

  it('refreshes browser sessions through the HttpOnly cookie transport', async () => {
    mocks.cookieGet.mockReturnValue(undefined)
    mocks.axiosPost.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'ok',
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
        },
      },
    })
    const service = vi.fn().mockResolvedValue('replayed')
    const manager = createAuthSessionManager({
      baseURL: 'http://127.0.0.1:8080',
      service,
      notify: vi.fn(),
    })

    await expect(manager.handle401({ url: '/api/admin/v1/users/me' })).resolves.toBe('replayed')

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/admin/v1/auth/refresh',
      undefined,
      {
        withCredentials: true,
        headers: {
          platform: 'admin',
          'device-id': 'device-1',
          'X-Admin-Client-Variant': 'browser',
        },
      }
    )
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.objectContaining({ expires: expect.any(Date) })
    )
    expect(mocks.cookieSet.mock.calls.some(([name]) => name === 'refresh_token')).toBe(false)
  })

  it('keeps desktop refresh credentials in the explicit desktop request', async () => {
    mocks.getAdminClientVariant.mockReturnValue('desktop')
    mocks.cookieGet.mockImplementation((key: string) => key === 'refresh_token' ? 'desktop-refresh' : undefined)
    mocks.axiosPost.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'ok',
        data: {
          access_token: 'new-access-token',
          refresh_token: 'rotated-desktop-refresh',
          expires_in: 3600,
          refresh_expires_in: 7200,
        },
      },
    })
    const manager = createAuthSessionManager({
      baseURL: 'http://127.0.0.1:8080',
      service: vi.fn().mockResolvedValue('replayed'),
      notify: vi.fn(),
    })

    await expect(manager.handle401({ url: '/api/admin/v1/users/me' })).resolves.toBe('replayed')

    expect(mocks.axiosPost).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/admin/v1/auth/refresh',
      { refresh_token: 'desktop-refresh' },
      {
        withCredentials: false,
        headers: {
          platform: 'admin',
          'device-id': 'device-1',
          'X-Admin-Client-Variant': 'desktop',
        },
      }
    )
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'refresh_token',
      'rotated-desktop-refresh',
      expect.objectContaining({ expires: expect.any(Date) })
    )
  })

  it('fails closed when a desktop refresh response omits its credential expiry', async () => {
    mocks.getAdminClientVariant.mockReturnValue('desktop')
    mocks.cookieGet.mockReturnValue('desktop-refresh')
    mocks.axiosPost.mockResolvedValueOnce({
      data: {
        code: 0,
        msg: 'ok',
        data: {
          access_token: 'new-access-token',
          refresh_token: 'rotated-desktop-refresh',
          expires_in: 3600,
        },
      },
    })
    const manager = createAuthSessionManager({
      baseURL: 'http://127.0.0.1:8080',
      service: vi.fn().mockResolvedValue('must-not-replay'),
      notify: vi.fn(),
    })

    await expect(manager.handle401({ url: '/api/admin/v1/users/me' })).rejects.toThrow('Unauthorized')
    expect(mocks.cookieSet.mock.calls.some(([name]) => name === 'refresh_token')).toBe(false)
  })

  it('fails closed when refresh returns a non-zero envelope without msg', async () => {
    mocks.axiosPost.mockResolvedValueOnce({
      data: { code: 100, msg: '', data: null },
    })

    const notify = vi.fn()
    const manager = createAuthSessionManager({
      baseURL: 'http://127.0.0.1:8080',
      service: vi.fn(),
      notify,
    })

    await expect(manager.handle401({ url: '/api/admin/v1/users/me' })).rejects.toThrow(
      'api envelope msg must be a non-empty string'
    )

    expect(notify).toHaveBeenCalledWith('api envelope msg must be a non-empty string')
    expect(notify).not.toHaveBeenCalledWith('网络错误，请重新登录')
  })

  it('does not replace an empty original 401 envelope message with a session fallback', async () => {
    const notify = vi.fn()
    const manager = createAuthSessionManager({
      baseURL: 'http://127.0.0.1:8080',
      service: vi.fn(),
      notify,
    })

    await expect(manager.handle401({
      url: '/api/admin/v1/auth/refresh',
    }, '')).rejects.toThrow('api envelope msg must be a non-empty string')

    expect(notify).toHaveBeenCalledWith('api envelope msg must be a non-empty string')
    expect(notify).not.toHaveBeenCalledWith('登录过期，请重新登录')
  })
})
