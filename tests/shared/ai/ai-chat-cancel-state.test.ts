import { describe, expect, it } from 'vitest'
import { assertAiStoppingAcknowledgment } from '@/api/ai/chat'
import { useConversationSessions } from '@/views/Main/ai/chat/composables/useConversationSessions'

describe('AI chat cancel state handling', () => {
  it('freezes immediately and permanently ignores late delivery for the stopped request', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(6, 'req-6', 'question')
    sessions.appendDelta(6, 'req-6', 1, 'kept')

    expect(sessions.beginStopping(6, 'req-6')).toBe(1)
    expect(sessions.appendDelta(6, 'req-6', 2, ' discarded')).toBe('ignored')
    expect(sessions.get(6)).toMatchObject({
      pendingRequestId: '',
      stopCommitPendingRequestId: 'req-6',
      streamingContent: '',
      isStreaming: false,
    })
    expect(sessions.isCanceled(6, 'req-6')).toBe(true)
    expect(sessions.get(6)?.messages.at(-1)).toMatchObject({
      content: 'kept',
      delivery_state: 'stopped',
    })
  })

  it('does not let a late HTTP acknowledgment reopen durable settlement', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(8, 'req-8', 'question')
    sessions.beginStopping(8, 'req-8')
    const acknowledgment = {
      conversation_id: 8,
      request_id: 'req-8',
      status: 'stopped',
      assistant_message_id: 81,
      settlement_pending: true,
    } as const

    expect(assertAiStoppingAcknowledgment(acknowledgment, 8, 'req-8')).toEqual(acknowledgment)
    sessions.confirmStopped(8, 'req-8', 81, true)
    sessions.settleStopped(8, 'req-8', 81)
    sessions.confirmStopped(8, 'req-8', 81, true)

    expect(sessions.get(8)?.settlementPendingRequestIds).toEqual([])
    expect(sessions.get(8)?.messages.at(-1)).toMatchObject({
      id: 81,
      settlement_pending: false,
      delivery_state: 'stopped',
    })
  })

  it('accepts only the two strict authoritative stop acknowledgments', () => {
    expect(assertAiStoppingAcknowledgment({
      conversation_id: 8,
      request_id: 'req-8',
      status: 'already_terminal',
      assistant_message_id: null,
      settlement_pending: false,
    }, 8, 'req-8')).toMatchObject({ status: 'already_terminal' })

    expect(() => assertAiStoppingAcknowledgment({
      conversation_id: 8,
      request_id: 'other',
      status: 'stopped',
      assistant_message_id: 81,
      settlement_pending: true,
    }, 8, 'req-8')).toThrow(/stopping contract/i)
    expect(() => assertAiStoppingAcknowledgment({
      conversation_id: 8,
      request_id: 'req-8',
      status: 'stopped',
      assistant_message_id: null,
      settlement_pending: true,
    }, 8, 'req-8')).toThrow(/stopping contract/i)
    expect(() => assertAiStoppingAcknowledgment({
      conversation_id: 8,
      request_id: 'req-8',
      status: 'already_terminal',
      assistant_message_id: null,
      settlement_pending: true,
    }, 8, 'req-8')).toThrow(/stopping contract/i)
  })

  it('lets an authoritative terminal recovery win when stop was not committed', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(11, 'req-11', 'question')
    sessions.appendDelta(11, 'req-11', 1, 'possibly partial')
    sessions.beginStopping(11, 'req-11')

    expect(sessions.complete(11, 'req-11', 111)).toBe('recover')
    sessions.recoverMessages(11, [], 0, false, 'req-11')

    expect(sessions.get(11)).toMatchObject({
      messages: [],
      pendingRequestId: '',
      stopCommitPendingRequestId: '',
      isStreaming: false,
    })
    expect(sessions.isCanceled(11, 'req-11')).toBe(false)
    expect(sessions.appendDelta(11, 'req-11', 2, ' late')).toBe('ignored')
  })

  it('cannot stop a request after it already completed', () => {
    const sessions = useConversationSessions()
    sessions.beginSend(7, 'req-7', 'question')
    sessions.markUserMessage(7, 'req-7', 70)
    sessions.appendDelta(7, 'req-7', 1, 'answer')
    sessions.complete(7, 'req-7', 71)

    expect(sessions.beginStopping(7, 'req-7')).toBeNull()
    expect(sessions.isCanceled(7, 'req-7')).toBe(false)
    expect(sessions.get(7)?.messages[1]).toMatchObject({
      id: 71,
      content: 'answer',
      delivery_state: 'completed',
    })
  })
})
