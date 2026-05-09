import { describe, expect, it } from 'vitest'

describe('useConversationSessions conversation-scoped cache', () => {
  it('keeps streaming conversations alive when LRU cache exceeds the limit', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(1, 'req-1', 'hello')
    for (let id = 2; id <= 10; id++) {
      sessions.getOrCreate(id)
    }

    expect(sessions.get(1)?.isStreaming).toBe(true)
    expect(sessions.get(1)?.pendingRequestId).toBe('req-1')
  })

  it('applies websocket deltas to the matching conversation session', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(7, 'req-7', 'question')
    sessions.markUserMessage(7, 'req-7', 70)
    sessions.appendDelta(7, 'req-7', 'answer')
    sessions.complete(7, 'req-7', 71)

    const session = sessions.get(7)
    expect(session?.messages[0]?.id).toBe(70)
    expect(session?.messages[1]?.id).toBe(71)
    expect(session?.messages[1]?.content).toBe('answer')
    expect(session?.isStreaming).toBe(false)
  })
})
