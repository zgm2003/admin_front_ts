import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiClient, type HttpTransport } from '@/modules/http/client'
import { defineOperation } from '@/modules/http/operations'

const operation = defineOperation<void, { id: number }>({
  id: 'test.closed-envelope',
  method: 'GET',
  path: '/api/admin/v1/users/me',
  auth: 'required',
  timeout: 'interactive',
  replay: 'never',
  telemetryName: 'test.closed_envelope',
  responseSchema: z.object({ id: z.number().int().positive() }).strict(),
})

function clientFor(data: unknown, status = 200) {
  const transport: HttpTransport = {
    send: vi.fn(async () => ({ status, headers: {}, data })),
  }
  const auth = {
    withAccessToken: <T>(run: (token: string, signal: AbortSignal) => Promise<T> | T, signal?: AbortSignal) =>
      Promise.resolve(run('memory-only-token', signal ?? new AbortController().signal)),
    refresh: vi.fn(async () => undefined),
  }
  return { client: new ApiClient({ transport, auth }), auth, transport }
}

describe('HTTP client error contract', () => {
  it('fails closed when a success envelope omits a required envelope field', async () => {
    const { client } = clientFor({ code: 0, data: { id: 7 } })

    await expect(client.execute(operation, undefined)).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.envelope_invalid',
    })
  })

  it('does not replace a malformed HTTP error envelope with a transport fallback', async () => {
    const { client } = clientFor({ code: 500, msg: '', data: {} }, 500)

    await expect(client.execute(operation, undefined)).rejects.toMatchObject({
      kind: 'contract',
      code: 'http.envelope_invalid',
      status: 500,
    })
  })

  it('does not refresh from a malformed 401 envelope', async () => {
    const { client, auth } = clientFor({ code: 401, msg: '', data: {} }, 401)

    await expect(client.execute(operation, undefined)).rejects.toMatchObject({
      kind: 'contract',
    })
    expect(auth.refresh).not.toHaveBeenCalled()
  })

  it('preserves the classified backend message without notifying from transport', async () => {
    const { client } = clientFor({
      code: 100,
      data: {},
      msg: '验证码错误或已过期',
      error: {
        category: 'validation',
        code: 'request.invalid',
        retryable: false,
      },
    }, 400)

    await expect(client.execute(operation, undefined)).rejects.toMatchObject({
      kind: 'validation',
      code: 'request.invalid',
      message: '验证码错误或已过期',
    })
  })
})
