import { beforeEach, describe, expect, it, vi } from 'vitest'

type ResponseFulfilled = (response: {
  data: unknown
  config: { url?: string }
}) => unknown

type ResponseRejected = (error: {
  response?: {
    status?: number
    data?: unknown
  }
  config?: { url?: string }
  message?: string
}) => unknown

const mocks = vi.hoisted(() => {
  const responseHandlers: {
    fulfilled?: ResponseFulfilled
    rejected?: ResponseRejected
  } = {}

  const service = {
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn((fulfilled: ResponseFulfilled, rejected: ResponseRejected) => {
          responseHandlers.fulfilled = fulfilled
          responseHandlers.rejected = rejected
        }),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }

  return {
    responseHandlers,
    service,
    axiosCreate: vi.fn(() => service),
    handle401: vi.fn(),
    notificationError: vi.fn(),
    t: vi.fn((key: string) => {
      if (key === 'http.unauthorized') return 'Unauthorized'
      if (key === 'http.requestFailed') return 'Request failed'
      return key
    }),
  }
})

vi.mock('axios', () => ({
  default: {
    create: mocks.axiosCreate,
  },
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    error: mocks.notificationError,
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: mocks.t,
    },
  },
}))

vi.mock('../../../src/lib/http/notifier', () => ({
  createDebouncedNotifier: (params: { notify: (message: string) => void }) => params.notify,
}))

vi.mock('../../../src/lib/http/auth-session', () => ({
  createAuthSessionManager: () => ({
    handle401: mocks.handle401,
  }),
}))

async function importClient(apiBaseURL = 'http://127.0.0.1:8080') {
  vi.stubEnv('VITE_GO_API_BASE_URL', apiBaseURL)
  await import('../../../src/lib/http/client')
  expect(mocks.responseHandlers.fulfilled).toBeTypeOf('function')
  expect(mocks.responseHandlers.rejected).toBeTypeOf('function')
}

describe('http client error contract', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mocks.responseHandlers.fulfilled = undefined
    mocks.responseHandlers.rejected = undefined
    mocks.axiosCreate.mockReturnValue(mocks.service)
    mocks.handle401.mockResolvedValue('retry-result')
  })

  it('normalizes a configured loopback API host to the current browser host', async () => {
    vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } })

    await importClient('http://localhost:5173')

    expect(mocks.axiosCreate).toHaveBeenCalledWith({
      baseURL: 'http://127.0.0.1:5173',
      timeout: 60000,
    })
  })

  it('fails closed when a 401 envelope has an empty msg before refreshing', async () => {
    await importClient()

    await expect(Promise.resolve().then(() => mocks.responseHandlers.fulfilled?.({
      data: { code: 401, msg: '', data: null },
      config: { url: '/api/admin/v1/users/me' },
    }))).rejects.toThrow('api envelope msg must be a non-empty string')

    expect(mocks.handle401).not.toHaveBeenCalled()
  })

  it('does not replace malformed http error envelopes with axios fallback messages', async () => {
    await importClient()

    await expect(Promise.resolve().then(() => mocks.responseHandlers.rejected?.({
      response: {
        status: 500,
        data: { code: 500, msg: '', data: null },
      },
      message: 'Network Error',
    }))).rejects.toThrow('api envelope msg must be a non-empty string')

    expect(mocks.notificationError).not.toHaveBeenCalledWith({ message: 'Network Error' })
  })

  it('does not refresh from malformed 401 http error envelopes', async () => {
    await importClient()

    await expect(Promise.resolve().then(() => mocks.responseHandlers.rejected?.({
      response: {
        status: 401,
        data: { code: 401, msg: '', data: null },
      },
      config: { url: '/api/admin/v1/users/me' },
      message: 'Request failed with status code 401',
    }))).rejects.toThrow('api envelope msg must be a non-empty string')

    expect(mocks.handle401).not.toHaveBeenCalled()
  })
})
