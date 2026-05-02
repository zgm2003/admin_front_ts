import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/lib/http', () => ({
  default: {
    post,
  },
}))

describe('AI stream contracts', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('AiChatApi uses streamable start and event polling instead of holding one SSE request', async () => {
    const onDone = vi.fn()
    const onError = vi.fn()
    const onContent = vi.fn()
    const onConversation = vi.fn()
    const onRun = vi.fn()

    post
      .mockResolvedValueOnce({
        conversation_id: 11,
        run_id: 22,
        request_id: 'req-22',
        user_message_id: 33,
        agent_id: 44,
        is_new: true,
      })
      .mockResolvedValueOnce({
        events: [
          { id: '1-0', event: 'content', data: { delta: 'hello' } },
          {
            id: '2-0',
            event: 'done',
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
      })

    const { AiChatApi } = await import('../../../src/api/ai/chat')

    await AiChatApi.stream({ content: 'hello' }, {
      onDone,
      onError,
      onContent,
      onConversation,
      onRun,
    })

    expect(post).toHaveBeenNthCalledWith(1, '/api/admin/AiChat/start', { content: 'hello' })
    expect(post).toHaveBeenNthCalledWith(2, '/api/admin/AiChat/events', {
      run_id: 22,
      last_id: '0-0',
      timeout_ms: 50,
    })
    expect(onConversation).toHaveBeenCalledWith(11)
    expect(onRun).toHaveBeenCalledWith(22, 'req-22')
    expect(onContent).toHaveBeenCalledWith('hello')
    expect(onDone).toHaveBeenCalledWith({
      conversation_id: 11,
      run_id: 22,
      user_message_id: 33,
      assistant_message_id: 55,
    })
    expect(onError).not.toHaveBeenCalled()
  })

})
