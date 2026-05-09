import { describe, expect, it, vi } from 'vitest'
import type { WsMessage } from '../../../src/lib/realtime/message-bus'

const wsHandlers = new Map<string, Set<(message: WsMessage) => void>>()

vi.mock('@/lib/realtime/message-bus', () => ({
  onWsMessage: vi.fn((type: string, handler: (message: WsMessage) => void) => {
    if (!wsHandlers.has(type)) wsHandlers.set(type, new Set())
    wsHandlers.get(type)!.add(handler)
    return () => wsHandlers.get(type)?.delete(handler)
  }),
}))

function emitWs(type: string, data: Record<string, unknown>) {
  wsHandlers.get(type)?.forEach((handler) => handler({ type, data }))
}

describe('AI conversation websocket contract', () => {
  it('routes events by conversation_id and request_id without run_id', async () => {
    const start = vi.fn()
    const delta = vi.fn()
    const completed = vi.fn()
    const failed = vi.fn()
    const { useConversationSocket } = await import('../../../src/views/Main/ai/chat/composables/useConversationSocket')

    useConversationSocket({ onStart: start, onDelta: delta, onCompleted: completed, onFailed: failed })

    emitWs('ai.response.start.v1', { conversation_id: 1, request_id: 'req-1', user_message_id: 2, agent_id: 3 })
    emitWs('ai.response.delta.v1', { conversation_id: 1, request_id: 'req-1', delta: 'hello' })
    emitWs('ai.response.completed.v1', { conversation_id: 1, request_id: 'req-1', assistant_message_id: 4 })
    emitWs('ai.response.failed.v1', { conversation_id: 2, request_id: 'req-2', msg: 'bad' })

    expect(start).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', user_message_id: 2, agent_id: 3 })
    expect(delta).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', delta: 'hello' })
    expect(completed).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', assistant_message_id: 4 })
    expect(failed).toHaveBeenCalledWith({ conversation_id: 2, request_id: 'req-2', msg: 'bad' })
  })
})
