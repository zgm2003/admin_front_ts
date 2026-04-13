import { beforeEach, describe, expect, it, vi } from 'vitest'

const streamPost = vi.fn()

vi.mock('@/lib/http', () => ({
  default: {
    post: vi.fn(),
  },
  streamPost,
}))

describe('AI stream contracts', () => {
  beforeEach(() => {
    streamPost.mockReset()
  })

  it('AiChatApi treats missing terminal events as an error instead of faking done', async () => {
    const onDone = vi.fn()
    const onError = vi.fn()

    streamPost.mockImplementationOnce(async (_url, _params, callbacks) => {
      callbacks.onComplete?.()
    })

    const { AiChatApi } = await import('../../../src/api/ai/chat')

    await AiChatApi.stream({ content: 'hello' }, {
      onDone,
      onError,
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('SSE stream ended without a terminal event')
  })

  it('GenAiApi treats missing terminal events as an error instead of completing silently', async () => {
    const onDone = vi.fn()
    const onError = vi.fn()

    streamPost.mockImplementationOnce(async (_url, _params, callbacks) => {
      callbacks.onComplete?.()
    })

    const { GenAiApi } = await import('../../../src/api/ai/genAi')

    await GenAiApi.stream({ content: 'build me a page' }, {
      onDone,
      onError,
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('SSE stream ended without a terminal event')
  })
})
