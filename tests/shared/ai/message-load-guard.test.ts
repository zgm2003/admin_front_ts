import { describe, expect, it } from 'vitest'
import { AiRoleEnum } from '../../../src/enums'

describe('conversation session message load guard', () => {
  it('does not replace messages while a conversation is streaming', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(1, 'req-1', 'optimistic user message')
    sessions.replaceMessages(1, [{
      id: 10,
      role: AiRoleEnum.ASSISTANT,
      content_type: 'text',
      content: 'old persisted message',
      created_at: '2026-05-01 00:00:01',
      updated_at: '2026-05-01 00:00:01',
    }], 10, false)

    expect(sessions.get(1)?.messages).toHaveLength(2)
    expect(sessions.get(1)?.messages[0]?.content).toBe('optimistic user message')
  })
})
