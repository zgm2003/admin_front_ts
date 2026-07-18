import { describe, expect, it, vi } from 'vitest'
import type { KernelRealtime } from '@/app/kernel'
import type {
  RealtimeEventType,
  ServerEnvelope,
} from '@/modules/realtime/protocol'
import type { RealtimeHandler } from '@/modules/realtime/subscriptions'

function fakeRealtime() {
  const handlers = new Map<RealtimeEventType, Set<(envelope: ServerEnvelope) => void | Promise<void>>>()
  const realtime: KernelRealtime = {
    connect() {},
    async disconnect() {},
    async dispose() {},
    subscribe<K extends RealtimeEventType>(type: K, handler: RealtimeHandler<K>) {
      const current = handlers.get(type) ?? new Set()
      current.add(handler as (envelope: ServerEnvelope) => void | Promise<void>)
      handlers.set(type, current)
      return () => current.delete(handler as (envelope: ServerEnvelope) => void | Promise<void>)
    },
    retainTopic: () => () => undefined,
    registerRecovery: () => () => undefined,
  }
  return {
    realtime,
    async emit(envelope: ServerEnvelope) {
      await Promise.all([...(handlers.get(envelope.type) ?? [])].map((handler) => handler(envelope)))
    },
  }
}

const baseEnvelope = {
  occurred_at: '2026-07-18T08:00:00Z',
} as const

describe('AI conversation websocket contract', () => {
  it('routes validated events by conversation_id and request_id without run_id', async () => {
    const start = vi.fn()
    const delta = vi.fn()
    const completed = vi.fn()
    const failed = vi.fn()
    const canceled = vi.fn()
    const realtime = fakeRealtime()
    const { useConversationSocket } = await import('../../../src/views/Main/ai/chat/composables/useConversationSocket')

    useConversationSocket({
      onStart: start,
      onDelta: delta,
      onCompleted: completed,
      onFailed: failed,
      onCanceled: canceled,
    }, realtime.realtime)

    await realtime.emit({
      ...baseEnvelope,
      event_id: '01J00000000000000000000001',
      type: 'ai.response.start.v1',
      sequence: 0,
      durability: 'ephemeral',
      data: { conversation_id: 1, request_id: 'req-1', user_message_id: 2, agent_id: 3 },
    })
    await realtime.emit({
      ...baseEnvelope,
      event_id: '01J00000000000000000000002',
      type: 'ai.response.delta.v1',
      sequence: 0,
      durability: 'ephemeral',
      data: { conversation_id: 1, request_id: 'req-1', delta: 'hello' },
    })
    await realtime.emit({
      ...baseEnvelope,
      event_id: '01J00000000000000000000003',
      type: 'ai.response.completed.v1',
      sequence: 3,
      durability: 'durable',
      data: { conversation_id: 1, request_id: 'req-1', assistant_message_id: 4 },
    })
    await realtime.emit({
      ...baseEnvelope,
      event_id: '01J00000000000000000000004',
      type: 'ai.response.failed.v1',
      sequence: 4,
      durability: 'durable',
      data: { conversation_id: 2, request_id: 'req-2', msg: 'bad' },
    })
    await realtime.emit({
      ...baseEnvelope,
      event_id: '01J00000000000000000000005',
      type: 'ai.response.canceled.v1',
      sequence: 5,
      durability: 'durable',
      data: { conversation_id: 3, request_id: 'req-3' },
    })

    expect(start).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', user_message_id: 2, agent_id: 3 })
    expect(delta).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', delta: 'hello' })
    expect(completed).toHaveBeenCalledWith({ conversation_id: 1, request_id: 'req-1', assistant_message_id: 4 })
    expect(failed).toHaveBeenCalledWith({ conversation_id: 2, request_id: 'req-2', msg: 'bad' })
    expect(canceled).toHaveBeenCalledWith({ conversation_id: 3, request_id: 'req-3' })
  })
})
