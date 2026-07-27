import { describe, expect, it } from 'vitest'
import { assertAiStoppingAcknowledgment } from '@/api/ai/chat'

describe('AI chat cancel state handling', () => {
  it('keeps the request pending while stopping and suppresses late deltas', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(6, 'req-6', 'question')
    sessions.appendDelta(6, 'req-6', 'kept')
    sessions.beginStopping(6, 'req-6')
    sessions.appendDelta(6, 'req-6', ' discarded')

    expect(sessions.get(6)).toMatchObject({
      pendingRequestId: 'req-6',
      stoppingRequestId: 'req-6',
      streamingContent: 'kept',
    })
    expect(sessions.isCanceled(6, 'req-6')).toBe(false)
    expect(sessions.get(6)?.messages.at(-1)?.content).toBe('kept')
  })

  it('lets only the durable canceled event finalize stopping and remains terminal after a late ack', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(8, 'req-8', 'question')
    sessions.beginStopping(8, 'req-8')
    const acknowledgment = { conversation_id: 8, request_id: 'req-8', status: 'stopping' } as const
    assertAiStoppingAcknowledgment(acknowledgment, 8, 'req-8')
    assertAiStoppingAcknowledgment(acknowledgment, 8, 'req-8')
    expect(sessions.get(8)).toMatchObject({
      pendingRequestId: 'req-8',
      stoppingRequestId: 'req-8',
    })
    sessions.cancel(8, 'req-8', 'canceled')
    assertAiStoppingAcknowledgment(acknowledgment, 8, 'req-8')

    // HTTP status='stopping' acknowledgment is deliberately a no-op, including duplicates.
    expect(sessions.get(8)).toMatchObject({
      pendingRequestId: '',
      stoppingRequestId: '',
      isStreaming: false,
    })
    expect(sessions.isCanceled(8, 'req-8')).toBe(true)
  })

  it('rejects an acknowledgment for any other operation', () => {
    expect(() => assertAiStoppingAcknowledgment(
      { conversation_id: 8, request_id: 'other', status: 'stopping' },
      8,
      'req-8',
    )).toThrow(/stopping contract/i)
  })

  it('authoritatively replaces a stream after ambiguous cancel failure instead of resuming it', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(11, 'req-11', 'question')
    sessions.appendDelta(11, 'req-11', 'possibly gapped')
    sessions.beginStopping(11, 'req-11')
    sessions.recoverMessages(11, [], 0, false)
    sessions.appendDelta(11, 'req-11', ' late')

    expect(sessions.get(11)).toMatchObject({
      messages: [],
      pendingRequestId: '',
      stoppingRequestId: '',
      isStreaming: false,
    })
  })

  it('does not mark a request canceled after it already reached a terminal state', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(7, 'req-7', 'question')
    sessions.markUserMessage(7, 'req-7', 70)
    sessions.appendDelta(7, 'req-7', 'answer')
    sessions.complete(7, 'req-7', 71)

    sessions.cancel(7, 'req-7')

    expect(sessions.isCanceled(7, 'req-7')).toBe(false)
    expect(sessions.get(7)?.messages[1]?.content).toBe('answer')
    expect(sessions.get(7)?.messages[1]?.id).toBe(71)
  })

  it('ignores late content and terminal events from an older canceled request after a newer request completes', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(9, 'req-a', 'question a')
    sessions.cancel(9, 'req-a', 'canceled')

    sessions.beginSend(9, 'req-b', 'question b')
    sessions.markUserMessage(9, 'req-b', 200)
    sessions.appendDelta(9, 'req-b', 'answer b')
    sessions.complete(9, 'req-b', 201)

    sessions.appendDelta(9, 'req-a', ' late a')
    sessions.complete(9, 'req-a', 101)
    sessions.fail(9, 'req-a', 'failed a')

    const assistantMessage = sessions.get(9)?.messages.at(-1)
    expect(assistantMessage?.request_id).toBe('req-b')
    expect(assistantMessage?.id).toBe(201)
    expect(assistantMessage?.content).toBe('answer b')
    expect(assistantMessage?.isStreaming).toBe(false)
  })

  it('ignores late user message acknowledgement from an older canceled request while a newer request is sending', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(10, 'req-a', 'question a')
    sessions.cancel(10, 'req-a', 'canceled')

    sessions.beginSend(10, 'req-b', 'question b')
    sessions.markUserMessage(10, 'req-b', 200)
    sessions.appendDelta(10, 'req-b', 'answer b')
    sessions.complete(10, 'req-b', 201)

    sessions.beginSend(10, 'req-c', 'question c')
    expect(sessions.get(10)?.sending).toBe(true)
    expect(sessions.get(10)?.pendingRequestId).toBe('req-c')

    sessions.markUserMessage(10, 'req-a', 100)

    expect(sessions.get(10)?.sending).toBe(true)
    expect(sessions.get(10)?.pendingRequestId).toBe('req-c')
  })
})
