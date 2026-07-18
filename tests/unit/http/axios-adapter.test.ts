import axios, {
  AxiosError,
  CanceledError,
  type AxiosInstance,
} from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAxiosTransport } from '@/modules/http/axios-adapter'
import type { TransportRequest } from '@/modules/http/client'

function request(signal: AbortSignal = new AbortController().signal): TransportRequest {
  return {
    method: 'GET',
    path: '/api/admin/v1/test',
    headers: { Accept: 'application/json' },
    signal,
    timeoutMs: 1_000,
  }
}

function mockAxiosRequest() {
  const send = vi.fn()
  vi.spyOn(axios, 'create').mockReturnValue({ request: send } as unknown as AxiosInstance)
  return send
}

afterEach(() => vi.restoreAllMocks())

describe('Axios transport adapter', () => {
  it('supports a dynamic base URL, explicit credentials mode, and raw response headers', async () => {
    const send = mockAxiosRequest()
    send.mockResolvedValue({
      status: 200,
      headers: { present: 7, absent: undefined, empty: null },
      data: { ok: true },
    })
    const baseURL = vi.fn(() => 'https://admin.example.test')
    const transport = createAxiosTransport({ baseURL, withCredentials: false })

    await expect(transport.send(request())).resolves.toEqual({
      status: 200,
      headers: { present: '7' },
      data: { ok: true },
    })
    expect(baseURL).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://admin.example.test',
      withCredentials: false,
    }))
  })

  it.each([
    ['ECONNABORTED', new AxiosError('deadline', 'ECONNABORTED'), 'timeout'],
    ['ETIMEDOUT', new AxiosError('deadline', 'ETIMEDOUT'), 'timeout'],
    ['axios cancellation', new CanceledError('stopped'), 'canceled'],
    ['network failure', new Error('connection refused'), 'network'],
  ] as const)('maps %s to a closed transport error', async (_name, error, kind) => {
    const send = mockAxiosRequest()
    send.mockRejectedValue(error)
    const transport = createAxiosTransport({ baseURL: 'https://admin.example.test' })

    await expect(transport.send(request())).rejects.toMatchObject({ kind })
  })

  it.each([
    ['TimeoutError', 'timeout'],
    ['AbortError', 'canceled'],
  ] as const)('uses an aborted request reason named %s', async (name, kind) => {
    const send = mockAxiosRequest()
    send.mockRejectedValue(new Error('adapter rejected'))
    const controller = new AbortController()
    controller.abort(new DOMException('stopped', name))
    const transport = createAxiosTransport({ baseURL: 'https://admin.example.test' })

    await expect(transport.send(request(controller.signal))).rejects.toMatchObject({ kind })
  })
})
