import { describe, expect, it, vi } from 'vitest'
import type {
  AiConversationItem,
  AiConversationListResponse,
} from '@/api/ai/conversations'
import type {
  AiMessageItem,
  AiMessageListResponse,
} from '@/api/ai/messages'
import {
  createAIChatWorkflow,
  type AIChatConversationApi,
  type AIChatMessageApi,
} from '@/features/ai-chat/workflow'
import { eventBase, FakeFeatureRealtime } from './support'

const conversation = (id: number): AiConversationItem => ({
  id,
  agent_id: 2,
  agent_name: 'Agent',
  title: `conversation-${id}`,
  last_message_at: '2026-07-19 00:00:00',
  updated_at: '2026-07-19 00:00:00',
})

const message = (id: number): AiMessageItem => ({
  id,
  role: 2,
  content_type: 'text',
  content: `message-${id}`,
  created_at: '2026-07-19 00:00:00',
  updated_at: '2026-07-19 00:00:00',
})

describe('AI chat workflow', () => {
  it('keeps the exact two-part conversation cursor and merges the next page', async () => {
    const responses: AiConversationListResponse[] = [
      { list: [conversation(2)], next_time: '2026-07-19 00:00:00', next_id: 2, has_more: true },
      { list: [conversation(1)], next_time: '', next_id: 0, has_more: false },
    ]
    const conversationApi = createConversationApi(vi.fn(async () => responses.shift()!))
    const workflow = createAIChatWorkflow({
      conversationApi,
      messageApi: createMessageApi(),
      realtime: new FakeFeatureRealtime(),
    })

    await workflow.loadConversations(2)
    await workflow.loadMoreConversations()

    expect(conversationApi.list).toHaveBeenLastCalledWith({
      agent_id: 2,
      before_time: '2026-07-19 00:00:00',
      before_id: 2,
      limit: 30,
    }, { signal: expect.any(AbortSignal) })
    expect(workflow.conversations.state.value.data.map(({ id }) => id)).toEqual([2, 1])
    workflow.dispose()
  })

  it('authoritatively reloads messages after terminal events and realtime recovery', async () => {
    const realtime = new FakeFeatureRealtime()
    const messageResponses: AiMessageListResponse[] = [
      { list: [message(1)], next_id: 0, has_more: false },
      { list: [message(2)], next_id: 0, has_more: false },
      { list: [message(3)], next_id: 0, has_more: false },
    ]
    const messageApi = createMessageApi(vi.fn(async () => messageResponses.shift()!))
    const onCompleted = vi.fn()
    const workflow = createAIChatWorkflow({
      conversationApi: createConversationApi(),
      messageApi,
      realtime,
      handlers: { onCompleted },
    })
    await workflow.loadMessages(7)

    await realtime.emit({
      ...eventBase,
      event_id: '01J00000000000000000000002',
      type: 'ai.response.completed.v1',
      sequence: 2,
      durability: 'durable',
      data: { conversation_id: 7, request_id: 'request-7', assistant_message_id: 2 },
    })
    expect(onCompleted).toHaveBeenCalledOnce()
    expect(workflow.messages.state.value.data).toEqual([message(2)])

    await realtime.recover(8)
    expect(workflow.messages.state.value.data).toEqual([message(3)])
    expect(messageApi.list).toHaveBeenCalledTimes(3)
    workflow.dispose()
  })
})

function createConversationApi(
  list = vi.fn(async (): Promise<AiConversationListResponse> => ({
    list: [], next_time: '', next_id: 0, has_more: false,
  })),
): AIChatConversationApi {
  return {
    list,
    create: vi.fn(async () => ({ id: 1 })),
    update: vi.fn(async () => undefined),
    deleteOne: vi.fn(async () => undefined),
  }
}

function createMessageApi(
  list = vi.fn(async (): Promise<AiMessageListResponse> => ({
    list: [], next_id: 0, has_more: false,
  })),
): AIChatMessageApi {
  return {
    list,
    send: vi.fn(async () => ({
      conversation_id: 1,
      user_message_id: 1,
      command_id: 1,
      request_id: 'request-1',
      state: 'pending',
    })),
    cancel: vi.fn(async () => ({
      conversation_id: 1,
      request_id: 'request-1',
      status: 'canceled',
    })),
  }
}
