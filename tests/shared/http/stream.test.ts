import { describe, expect, it, vi } from 'vitest'

function createReader(chunks: string[]) {
  let index = 0

  return {
    read: vi.fn(async () => {
      if (index >= chunks.length) {
        return {
          done: true,
          value: undefined,
        }
      }

      const value = new TextEncoder().encode(chunks[index]!)
      index += 1

      return {
        done: false,
        value,
      }
    }),
    releaseLock: vi.fn(),
  }
}

vi.mock('@/lib/http/device', () => ({
  getDeviceId: () => 'test-device-id',
}))

describe('streamPost', () => {
  it('reports malformed SSE payloads instead of silently swallowing them', async () => {
    const onError = vi.fn()
    const onComplete = vi.fn()
    const reader = createReader([
      'event: content\ndata: {"delta":"ok"}\n\n',
      'event: content\ndata: {bad json}\n\n',
    ])

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => reader,
      },
    }))

    const { streamPost } = await import('../../../src/lib/http/stream')

    await streamPost('/api/admin/AiChat/stream', {}, {
      onError,
      onComplete,
    })

    expect(onError).toHaveBeenCalledWith('Malformed SSE payload')
    expect(onComplete).not.toHaveBeenCalled()
  })
})
