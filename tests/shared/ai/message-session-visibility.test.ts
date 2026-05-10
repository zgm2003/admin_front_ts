import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { AiRoleEnum } from '../../../src/enums'

describe('conversation session persisted message visibility', () => {
  it('turns off loading when persisted messages are replaced', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.setLoading(1, true)
    sessions.replaceMessages(1, [{
      id: 1,
      role: AiRoleEnum.USER,
      content_type: 'text',
      content: 'loaded',
      created_at: '2026-05-09 22:00:00',
      updated_at: '2026-05-09 22:00:00',
    }], 0, false)

    expect(sessions.get(1)?.loadingMessages).toBe(false)
    expect(sessions.get(1)?.messages[0]?.content).toBe('loaded')
  })

  it('shows all persisted messages in chronological order after loading', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.replaceMessages(1, [
      {
        id: 1,
        role: AiRoleEnum.USER,
        content_type: 'text',
        content: 'first',
        created_at: '2026-05-09 22:00:00',
        updated_at: '2026-05-09 22:00:00',
      },
      {
        id: 2,
        role: AiRoleEnum.USER,
        content_type: 'text',
        content: 'second',
        created_at: '2026-05-09 22:01:00',
        updated_at: '2026-05-09 22:01:00',
      },
    ], 0, false)

    expect(sessions.get(1)?.messages.map((message) => message.content)).toEqual(['first', 'second'])
  })

  it('invalidates computed message views after replacing persisted messages', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()
    const currentSession = computed(() => sessions.get(1))
    const messages = computed(() => currentSession.value?.messages ?? [])
    const loading = computed(() => currentSession.value?.loadingMessages ?? false)

    sessions.setLoading(1, true)
    expect(loading.value).toBe(true)

    sessions.replaceMessages(1, [{
      id: 1,
      role: AiRoleEnum.USER,
      content_type: 'text',
      content: 'visible after api load',
      created_at: '2026-05-09 22:00:00',
      updated_at: '2026-05-09 22:00:00',
    }], 0, false)

    expect(loading.value).toBe(false)
    expect(messages.value.map((message) => message.content)).toEqual(['visible after api load'])
  })
})
