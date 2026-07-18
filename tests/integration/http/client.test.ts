import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { z } from 'zod'
import { AuthSession } from '@/modules/auth/session'
import type { AccessCredential, CredentialAdapter } from '@/modules/auth/types'
import {
  ApiClient,
  type ApiClientAuth,
  type HttpTransport,
  type TransportRequest,
} from '@/modules/http/client'
import { createAxiosTransport } from '@/modules/http/axios-adapter'
import { defineOperation } from '@/modules/http/operations'

const origin = 'http://127.0.0.1:41991'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})
afterAll(() => server.close())

const responseSchema = z.object({ value: z.string() }).strict()

const safeGet = defineOperation<void, { value: string }>({
  id: 'test.safe-get',
  method: 'GET',
  path: '/api/admin/v1/users/me',
  auth: 'required',
  timeout: 'interactive',
  replay: 'safe',
  responseSchema,
  telemetryName: 'test.safe_get',
})

const keyedMutation = defineOperation<{ value: string }, { value: string }>({
  id: 'test.keyed-mutation',
  method: 'POST',
  path: '/api/admin/v1/auth/queue-monitor-grants',
  auth: 'required',
  timeout: 'interactive',
  replay: 'idempotency-key',
  responseSchema,
  telemetryName: 'test.keyed_mutation',
  encode: (input) => ({ body: input }),
})

const publicGet = defineOperation<void, { value: string }>({
  id: 'test.public-get',
  method: 'GET',
  path: '/api/admin/v1/auth/login-config',
  auth: 'public',
  timeout: 'interactive',
  replay: 'safe',
  responseSchema,
  telemetryName: 'test.public_get',
})

function success(data: unknown) {
  return HttpResponse.json({ code: 0, data, msg: 'ok' })
}

function unauthorized(requestId = 'server-request') {
  return HttpResponse.json({
    code: 401,
    data: {},
    msg: 'Unauthorized',
    error: {
      category: 'authentication',
      code: 'auth.unauthenticated',
      retryable: false,
      request_id: requestId,
      trace_id: 'trace-1',
    },
  }, { status: 401 })
}

function credential(accessToken: string): AccessCredential {
  return { accessToken, expiresAt: Date.now() + 60_000 }
}

async function authenticatedClient(overrides: Partial<CredentialAdapter> = {}) {
  const adapter: CredentialAdapter = {
    variant: 'browser',
    restore: vi.fn(async () => credential('old-token')),
    login: vi.fn(async () => credential('old-token')),
    refresh: vi.fn(async () => credential('new-token')),
    revoke: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined),
    ...overrides,
  }
  const auth = new AuthSession({ adapter })
  await auth.restore()
  const client = new ApiClient({
    auth,
    transport: createAxiosTransport({ baseURL: origin }),
    requestId: () => 'client-request-1',
  })
  return { adapter, auth, client }
}

describe('ApiClient authentication replay policy', () => {
  it('replays one safe GET after refresh while preserving its request id', async () => {
    const seen: Array<{ authorization: string | null; requestId: string | null }> = []
    server.use(http.get(`${origin}/api/admin/v1/users/me`, ({ request }) => {
      seen.push({
        authorization: request.headers.get('Authorization'),
        requestId: request.headers.get('X-Request-Id'),
      })
      return seen.length === 1 ? unauthorized() : success({ value: 'fresh' })
    }))
    const { adapter, client } = await authenticatedClient()

    await expect(client.execute(safeGet, undefined)).resolves.toEqual({ value: 'fresh' })

    expect(adapter.refresh).toHaveBeenCalledTimes(1)
    expect(seen).toEqual([
      { authorization: 'Bearer old-token', requestId: 'client-request-1' },
      { authorization: 'Bearer new-token', requestId: 'client-request-1' },
    ])
  })

  it('does not refresh or replay an idempotent mutation without a key', async () => {
    let requests = 0
    server.use(http.post(`${origin}/api/admin/v1/auth/queue-monitor-grants`, () => {
      requests += 1
      return unauthorized()
    }))
    const { adapter, client } = await authenticatedClient()

    await expect(client.execute(keyedMutation, { value: 'one' })).rejects.toMatchObject({
      kind: 'authentication',
      code: 'auth.unauthenticated',
    })
    expect(adapter.refresh).not.toHaveBeenCalled()
    expect(requests).toBe(1)
  })

  it('never rotates an authenticated session for a public operation', async () => {
    server.use(http.get(`${origin}/api/admin/v1/auth/login-config`, () => unauthorized()))
    const { auth } = await authenticatedClient()
    const transport = createAxiosTransport({ baseURL: origin })
    const refresh = vi.fn(async () => undefined)
    const client = new ApiClient({
      transport,
      auth: {
        withAccessToken: auth.withAccessToken.bind(auth),
        refresh,
      },
    })

    await expect(client.execute(publicGet, undefined)).rejects.toMatchObject({
      kind: 'authentication',
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('replays an idempotent mutation once only when the exact key is present', async () => {
    const keys: Array<string | null> = []
    server.use(http.post(`${origin}/api/admin/v1/auth/queue-monitor-grants`, async ({ request }) => {
      keys.push(request.headers.get('Idempotency-Key'))
      expect(await request.json()).toEqual({ value: 'one' })
      return keys.length === 1 ? unauthorized() : success({ value: 'created' })
    }))
    const { adapter, client } = await authenticatedClient()

    await expect(client.execute(keyedMutation, { value: 'one' }, {
      idempotencyKey: 'mutation-7',
    })).resolves.toEqual({ value: 'created' })
    expect(adapter.refresh).toHaveBeenCalledTimes(1)
    expect(keys).toEqual(['mutation-7', 'mutation-7'])
  })

  it('coalesces twenty rejected calls into one refresh and deterministically replays all', async () => {
    server.use(http.get(`${origin}/api/admin/v1/users/me`, ({ request }) => {
      return request.headers.get('Authorization') === 'Bearer old-token'
        ? unauthorized()
        : success({ value: 'fresh' })
    }))
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      return credential('new-token')
    })
    const { client } = await authenticatedClient({ refresh })

    await expect(Promise.all(
      Array.from({ length: 20 }, () => client.execute(safeGet, undefined)),
    )).resolves.toEqual(Array.from({ length: 20 }, () => ({ value: 'fresh' })))
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

describe('ApiClient cancellation, timeout, and contract boundaries', () => {
  it('propagates caller cancellation to the adapter as a closed canceled error', async () => {
    server.use(http.get(`${origin}/api/admin/v1/users/me`, async () => {
      await delay(1_000)
      return success({ value: 'late' })
    }))
    const { client } = await authenticatedClient()
    const controller = new AbortController()
    const pending = client.execute(safeGet, undefined, { signal: controller.signal })

    controller.abort(new DOMException('superseded', 'AbortError'))

    await expect(pending).rejects.toMatchObject({ kind: 'canceled', retryable: false })
  })

  it('preserves the same signal/request id and only the remaining timeout budget on replay', async () => {
    vi.useFakeTimers()
    const calls: TransportRequest[] = []
    let attempt = 0
    const transport: HttpTransport = {
      async send(request) {
        calls.push(request)
        attempt += 1
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          return {
            status: 401,
            headers: {},
            data: {
              code: 401,
              data: {},
              msg: 'Unauthorized',
              error: {
                category: 'authentication',
                code: 'auth.unauthenticated',
                retryable: false,
              },
            },
          }
        }
        return { status: 200, headers: {}, data: { code: 0, data: { value: 'ok' }, msg: 'ok' } }
      },
    }
    const auth: ApiClientAuth = {
      withAccessToken: (operation, signal) => operation('token', signal),
      async refresh() {
        await new Promise((resolve) => setTimeout(resolve, 200))
      },
    }
    const client = new ApiClient({
      auth,
      transport,
      timeoutMs: { interactive: 1_000, upload: 2_000, long: 3_000 },
      requestId: () => 'stable-request',
      now: Date.now,
    })
    const pending = client.execute(safeGet, undefined)

    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(200)

    await expect(pending).resolves.toEqual({ value: 'ok' })
    expect(calls).toHaveLength(2)
    expect(calls[0]?.headers['X-Request-Id']).toBe('stable-request')
    expect(calls[1]?.headers['X-Request-Id']).toBe('stable-request')
    expect(calls[0]?.signal).toBe(calls[1]?.signal)
    expect(calls.map((call) => call.timeoutMs)).toEqual([1_000, 500])
  })

  it('rejects as timeout when refresh consumes the complete logical request budget', async () => {
    let now = 0
    const transport: HttpTransport = {
      async send() {
        return {
          status: 401,
          headers: {},
          data: {
            code: 401,
            data: {},
            msg: 'Unauthorized',
            error: {
              category: 'authentication',
              code: 'auth.unauthenticated',
              retryable: false,
            },
          },
        }
      },
    }
    const auth: ApiClientAuth = {
      withAccessToken: (operation, signal) => operation('token', signal),
      async refresh() {
        now = 1_001
      },
    }
    const client = new ApiClient({
      auth,
      transport,
      timeoutMs: { interactive: 1_000, upload: 2_000, long: 3_000 },
      now: () => now,
    })

    await expect(client.execute(safeGet, undefined)).rejects.toMatchObject({
      kind: 'timeout',
      code: 'http.timeout',
    })
  })

  it('fails closed on a malformed success envelope and never emits a UI notification', async () => {
    server.use(http.get(`${origin}/api/admin/v1/users/me`, () => HttpResponse.json({
      code: 0,
      data: { value: 'looks-valid' },
    })))
    const telemetry = { record: vi.fn() }
    const { auth } = await authenticatedClient()
    const client = new ApiClient({
      auth,
      transport: createAxiosTransport({ baseURL: origin }),
      telemetry,
      requestId: () => 'contract-request',
    })

    await expect(client.execute(safeGet, undefined)).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.envelope_invalid',
    })
    expect(telemetry.record).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'test.safe_get',
      outcome: 'error',
    }))
    expect(JSON.stringify(telemetry.record.mock.calls)).not.toContain('looks-valid')
  })
})
