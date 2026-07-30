import { describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import { useConversationSessions } from '@/views/Main/ai/chat/composables/useConversationSessions'
import { executeStopRequest } from '@/views/Main/ai/chat/stop-delivery'
import type { Message } from '@/views/Main/ai/chat/composables/types'

function persistedStoppedMessages(): Message[] {
  return [
    {
      id: 10,
      role: 1,
      content_type: 'text',
      content: 'question a',
      created_at: '2026-07-30T08:00:00Z',
      updated_at: '2026-07-30T08:00:00Z',
      meta_json: undefined,
      paired_message_id: 11,
      run_id: null,
      liked: false,
      delivery_state: null,
      settlement_pending: false,
    },
    {
      id: 11,
      role: 2,
      content_type: 'text',
      content: '1234',
      created_at: '2026-07-30T08:00:01Z',
      updated_at: '2026-07-30T08:00:01Z',
      meta_json: undefined,
      paired_message_id: 10,
      run_id: 20,
      liked: false,
      delivery_state: 'stopped',
      settlement_pending: true,
    },
  ]
}

describe('AI chat stopped delivery state', () => {
  it('freezes the continuous delivered prefix immediately and does not let A settle B', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(3, 'request-a', 'count')

    for (const [seq, delta] of [[1, '1'], [2, '2'], [3, '3'], [4, '4']] as const) {
      expect(sessions.appendDelta(3, 'request-a', seq, delta)).toBe('applied')
    }
    expect(sessions.appendDelta(3, 'request-a', 4, 'duplicate')).toBe('duplicate')
    expect(sessions.appendDelta(3, 'request-a', 6, 'gap')).toBe('gap')

    expect(sessions.beginStopping(3, 'request-a')).toBe(4)
    expect(sessions.get(3)).toMatchObject({
      isStreaming: false,
      sending: false,
      pendingRequestId: '',
      stopCommitPendingRequestId: 'request-a',
      lastContinuousDeliverySeq: 4,
    })
    expect(sessions.get(3)?.messages.at(-1)).toMatchObject({
      content: '1234',
      delivery_state: 'stopped',
      settlement_pending: true,
      isStreaming: false,
    })
    expect(sessions.appendDelta(3, 'request-a', 5, '5')).toBe('ignored')

    sessions.confirmStopped(3, 'request-a', 97, true)
    sessions.beginSend(3, 'request-b', 'next')
    expect(sessions.appendDelta(3, 'request-b', 1, 'B')).toBe('applied')
    sessions.settleStopped(3, 'request-a', 97)

    expect(sessions.get(3)).toMatchObject({
      pendingRequestId: 'request-b',
      isStreaming: true,
      stopCommitPendingRequestId: '',
      settlementPendingRequestIds: [],
    })
    expect(sessions.get(3)?.messages.find((message) => (
      message.request_id === 'request-a' && message.role === 2
    ))).toMatchObject({
      id: 97,
      content: '1234',
      delivery_state: 'stopped',
      settlement_pending: false,
    })
    expect(sessions.get(3)?.messages.at(-1)?.content).toBe('B')
  })

  it('recovers one stopped request without clearing a newer stream', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(3, 'request-a', 'question a')
    sessions.appendDelta(3, 'request-a', 1, '1234')
    sessions.beginStopping(3, 'request-a')
    sessions.confirmStopped(3, 'request-a', 11, true)

    sessions.beginSend(3, 'request-b', 'question b')
    sessions.appendDelta(3, 'request-b', 1, 'B1')
    sessions.recoverMessages(3, persistedStoppedMessages(), 0, false, 'request-a')

    expect(sessions.get(3)).toMatchObject({
      pendingRequestId: 'request-b',
      isStreaming: true,
      lastContinuousDeliverySeq: 1,
    })
    expect(sessions.get(3)?.messages.at(-1)?.content).toBe('B1')
    expect(sessions.appendDelta(3, 'request-b', 2, 'B2')).toBe('applied')
    expect(sessions.get(3)?.messages.at(-1)?.content).toBe('B1B2')
  })

  it('keeps the continuous prefix active when gap recovery has no terminal reply', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(3, 'request-a', 'question a')
    sessions.markUserMessage(3, 'request-a', 10)
    sessions.appendDelta(3, 'request-a', 1, '1')

    expect(sessions.appendDelta(3, 'request-a', 3, '3')).toBe('gap')
    sessions.recoverAcceptedMessages(3, [{
      id: 10,
      role: 1,
      content_type: 'text',
      content: 'question a',
      created_at: '2026-07-30T08:00:00Z',
      updated_at: '2026-07-30T08:00:00Z',
      meta_json: undefined,
      paired_message_id: null,
      run_id: null,
      liked: false,
      delivery_state: null,
      settlement_pending: false,
    }], 0, false, 'request-a')

    expect(sessions.get(3)).toMatchObject({
      pendingRequestId: 'request-a',
      isStreaming: true,
      streamingContent: '1',
      lastContinuousDeliverySeq: 1,
    })
    expect(sessions.get(3)?.messages.at(-1)).toMatchObject({
      role: 2,
      request_id: 'request-a',
      content: '1',
      isStreaming: true,
    })
  })

  it('does not clear a newer stream during request-agnostic realtime recovery', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(3, 'request-a', 'question a')
    sessions.markUserMessage(3, 'request-a', 10)
    sessions.appendDelta(3, 'request-a', 1, '1234')
    sessions.beginStopping(3, 'request-a')
    sessions.confirmStopped(3, 'request-a', 11, true)

    sessions.beginSend(3, 'request-b', 'question b')
    sessions.markUserMessage(3, 'request-b', 12)
    sessions.appendDelta(3, 'request-b', 1, 'B1')
    sessions.recoverMessages(3, [...persistedStoppedMessages(), {
      id: 12,
      role: 1,
      content_type: 'text',
      content: 'question b',
      created_at: '2026-07-30T08:00:02Z',
      updated_at: '2026-07-30T08:00:02Z',
      meta_json: undefined,
      paired_message_id: null,
      run_id: null,
      liked: false,
      delivery_state: null,
      settlement_pending: false,
    }], 0, false)

    expect(sessions.get(3)).toMatchObject({
      pendingRequestId: 'request-b',
      isStreaming: true,
      streamingContent: 'B1',
      lastContinuousDeliverySeq: 1,
    })
    expect(sessions.get(3)?.messages.at(-1)).toMatchObject({
      role: 2,
      request_id: 'request-b',
      content: 'B1',
      isStreaming: true,
    })
  })

  it('backfills a late stopped user identity without changing the newer request state', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(3, 'request-a', 'question a')
    sessions.beginStopping(3, 'request-a')
    sessions.confirmStopped(3, 'request-a', 97, true)

    sessions.beginSend(3, 'request-b', 'question b')
    sessions.markUserMessage(3, 'request-a', 96)

    expect(sessions.get(3)).toMatchObject({
      pendingRequestId: 'request-b',
      sending: true,
      isStreaming: true,
    })
    expect(sessions.get(3)?.messages.find((message) => (
      message.request_id === 'request-a' && message.role === 1
    ))).toMatchObject({ id: 96, paired_message_id: 97 })
    expect(sessions.get(3)?.messages.find((message) => (
      message.request_id === 'request-a' && message.role === 2
    ))).toMatchObject({ id: 97, paired_message_id: 96 })
  })

  it('retries an unknown stop outcome once with the exact same request snapshot', async () => {
    const input = Object.freeze({
      conversation_id: 3,
      request_id: 'request-a',
      delivered_seq: 4,
    })
    const mutate = vi.fn()
      .mockRejectedValueOnce(createApiError({
        kind: 'network',
        retryable: true,
        messageKey: 'http.network',
      }))
      .mockResolvedValueOnce({ kind: 'success', data: { status: 'stopped' } })

    await expect(executeStopRequest(input, mutate)).resolves.toMatchObject({ kind: 'success' })
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(mutate.mock.calls[0]?.[0]).toBe(input)
    expect(mutate.mock.calls[1]?.[0]).toBe(input)
  })
})
