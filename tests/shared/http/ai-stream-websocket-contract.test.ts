import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WsMessage } from '../../../src/lib/realtime/message-bus'

const post = vi.fn()
const get = vi.fn()
const wsHandlers = new Map<string, Set<(message: WsMessage) => void>>()

vi.mock('@/lib/http', () => ({
  default: {
    get,
    post,
  },
}))

vi.mock('@/lib/realtime/message-bus', () => ({
  onWsMessage: vi.fn((type: string, handler: (message: WsMessage) => void) => {
    if (!wsHandlers.has(type)) {
      wsHandlers.set(type, new Set())
    }
    wsHandlers.get(type)!.add(handler)

    return () => {
      wsHandlers.get(type)?.delete(handler)
    }
  }),
}))

function emitWs(type: string, data: Record<string, unknown>) {
  wsHandlers.get(type)?.forEach((handler) => handler({ type, data }))
}

function startResponse(runId = 22) {
  return {
    conversation_id: 11,
    run_id: runId,
    request_id: `req-${runId}`,
    user_message_id: 33,
    app_id: 44,
    is_new: true,
  }
}

describe('AI stream websocket acceleration contract', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    wsHandlers.clear()
    vi.resetModules()
  })

  it('dispatches websocket run events immediately and ignores duplicated polling events', async () => {
    const onContent = vi.fn()
    const onDone = vi.fn()

    post.mockResolvedValueOnce(startResponse())
    get.mockImplementationOnce(async () => {
      emitWs('ai.response.delta.v1', {
        run_id: 22,
        delta: 'hello',
      })

        return {
          events: [
            { id: 'ai.response.delta.v1', event: 'ai.response.delta.v1', data: { run_id: 22, delta: 'hello' } },
          {
            id: '2-0',
            event: 'ai.response.completed.v1',
            data: {
              conversation_id: 11,
              run_id: 22,
              user_message_id: 33,
              assistant_message_id: 55,
            },
          },
        ],
        last_id: '2-0',
        run_status: 2,
        terminal: true,
        error_msg: '',
      }
    })

    const { AiChatApi } = await import('../../../src/api/ai/chat')

    await AiChatApi.stream({ content: 'hello' }, { onContent, onDone })

    expect(onContent).toHaveBeenCalledTimes(1)
    expect(onContent).toHaveBeenCalledWith('hello')
    expect(onDone).toHaveBeenCalledWith({
      conversation_id: 11,
      run_id: 22,
      user_message_id: 33,
      assistant_message_id: 55,
    })
  })

  it('filters websocket events by run id and unsubscribes after terminal event', async () => {
    const onContent = vi.fn()
    const onDone = vi.fn()

    post.mockResolvedValueOnce(startResponse(22))
    get.mockImplementationOnce(async () => {
      emitWs('ai.response.delta.v1', {
        run_id: 99,
        delta: 'wrong run',
      })
      emitWs('ai.response.completed.v1', {
        run_id: 22,
        conversation_id: 11,
        user_message_id: 33,
        assistant_message_id: 55,
      })

      return {
        events: [],
        last_id: '0-0',
        run_status: 2,
        terminal: true,
        error_msg: '',
      }
    })

    const { AiChatApi } = await import('../../../src/api/ai/chat')

    await AiChatApi.stream({ content: 'hello' }, { onContent, onDone })
    emitWs('ai.response.delta.v1', {
      run_id: 22,
      delta: 'late',
    })

    expect(onContent).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(wsHandlers.get('ai.response.delta.v1')?.size ?? 0).toBe(0)
    expect(wsHandlers.get('ai.response.completed.v1')?.size ?? 0).toBe(0)
  })
})
