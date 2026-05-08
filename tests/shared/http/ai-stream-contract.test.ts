import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
const get = vi.fn()

vi.mock('@/lib/http', () => ({
  default: {
    get,
    post,
  },
}))

describe('AI stream contracts', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    vi.resetModules()
  })

  it('AiChatApi uses Go REST streamable start and event polling instead of legacy PHP or SSE', async () => {
    const onDone = vi.fn()
    const onError = vi.fn()
    const onContent = vi.fn()
    const onConversation = vi.fn()
    const onRun = vi.fn()

    post.mockResolvedValueOnce({
      conversation_id: 11,
      run_id: 22,
      request_id: 'req-22',
      user_message_id: 33,
      app_id: 44,
      is_new: true,
    })
    get.mockResolvedValueOnce({
      events: [
        { id: '1-0', event: 'ai.response.delta.v1', data: { run_id: 22, delta: 'hello' } },
        {
          id: '2-0',
          event: 'ai.response.completed.v1',
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

    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenNthCalledWith(1, '/api/admin/v1/ai-chat/runs', { content: 'hello' })
    expect(get).toHaveBeenNthCalledWith(1, '/api/admin/v1/ai-chat/runs/22/events', {
      params: { last_id: '0-0', timeout_ms: 3000 },
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

  it('does not keep old PHP AiChat route strings or ai_run_event in active source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/ai/chat.ts'), 'utf8')
    expect(source).toContain('ai.response.start.v1')
    expect(source).toContain('ai.response.delta.v1')
    expect(source).toContain('ai.response.completed.v1')
    expect(source).toContain('ai.response.failed.v1')
    expect(source).toContain('ai.response.cancel.v1')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiChat')
    expect(source).not.toContain('ai_run_event')
    expect(source).not.toContain('Event' + 'Source')
    expect(source).not.toContain('text/event' + '-stream')
  })

  it('does not use tiny 50ms events polling timeout', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/ai/chat.ts'), 'utf8')

    expect(source).toContain('const STREAM_EVENTS_TIMEOUT_MS = 3000')
    expect(source).toContain('timeout_ms: STREAM_EVENTS_TIMEOUT_MS')
    expect(source).not.toContain('timeout_ms: 50')
    expect(source).not.toContain('const STREAM_POLL_INTERVAL = 80\n')
  })
})
