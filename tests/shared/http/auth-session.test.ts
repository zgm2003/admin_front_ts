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
}))

vi.mock('../../../src/lib/http/device', () => ({
  getDeviceId: mocks.getDeviceId,
}))

const { createAuthSessionManager } = await import('../../../src/lib/http/auth-session')

describe('auth session refresh handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.cookieGet.mockReturnValue('refresh-token')
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
