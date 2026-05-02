import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  notifySuccess: vi.fn(),
  confirm: vi.fn(),
  copy: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    success: mocks.notifySuccess,
  },
  ElMessageBox: {
    confirm: mocks.confirm,
  },
}))

vi.mock('@/hooks/useCopy', () => ({
  useCopy: () => ({ copy: mocks.copy }),
}))

vi.mock('@/api/ai/messages', () => ({
  AiMessageApi: {
    list: mocks.list,
    del: vi.fn(),
    feedback: vi.fn(),
  },
}))

describe('useMessages guarded loading', () => {
  it('does not overwrite optimistic streaming messages when a stale load finishes', async () => {
    const { useMessages } = await import('../../../src/views/Main/ai/chat/composables/useMessages')
    const chat = useMessages()

    chat.messages.value = [{
      id: -1,
      role: 1,
      content: 'optimistic user message',
      created_at: '2026-05-01 00:00:00',
    }]

    mocks.list.mockResolvedValueOnce({
      list: [{
        id: 10,
        conversation_id: 1,
        role: 2,
        content: 'old persisted message',
        created_at: '2026-05-01 00:00:01',
      }],
      page: { total: 1 },
    })

    const result = await chat.loadMessages(1, { shouldApply: () => false })

    expect(result.applied).toBe(false)
    expect(chat.messages.value).toHaveLength(1)
    expect(chat.messages.value[0]?.content).toBe('optimistic user message')
  })
})
