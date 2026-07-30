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
  unread_count: 0,
  updated_at: '2026-07-19 00:00:00',
})

const message = (id: number): AiMessageItem => ({
  id,
  role: 2,
  content_type: 'text',
  content: `message-${id}`,
  liked: false,
  paired_message_id: null,
  run_id: null,
  delivery_state: 'completed',
  settlement_pending: false,
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

  it('returns the exact read state without refreshing the conversation list', async () => {
    const conversationApi = createConversationApi()
    const workflow = createAIChatWorkflow({
      conversationApi,
      messageApi: createMessageApi(),
      realtime: new FakeFeatureRealtime(),
    })
    await workflow.loadConversations(2)
    vi.mocked(conversationApi.list).mockClear()

    const result = await workflow.advanceReadCursor.mutate({
      conversation_id: 17,
      message_id: 307,
    })

    expect(result).toEqual({
      kind: 'success',
      data: { conversation_id: 17, last_read_message_id: 307, unread_count: 0 },
    })
    expect(conversationApi.list).not.toHaveBeenCalled()
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

  it('uses the same request identity for authoritative recovery after an ambiguous cancel wait', async () => {
    const messageApi = createMessageApi(vi.fn(async () => ({
      list: [message(9)], next_id: 0, has_more: false,
    })))
    const onMessagesRecovered = vi.fn()
    const workflow = createAIChatWorkflow({
      conversationApi: createConversationApi(),
      messageApi,
      realtime: new FakeFeatureRealtime(),
      handlers: { onMessagesRecovered },
    })

    await workflow.recoverRequest(9, 'request-9')

    expect(messageApi.list).toHaveBeenCalledWith(
      { conversation_id: 9, limit: 50 },
      { signal: expect.any(AbortSignal) },
    )
    expect(onMessagesRecovered).toHaveBeenCalledWith(9, {
      list: [message(9)], next_id: 0, has_more: false,
    }, 'request-9')
    workflow.dispose()
  })

  it('uses accepted-message recovery for an in-flight delivery gap', async () => {
    const response = { list: [message(9)], next_id: 0, has_more: false }
    const messageApi = createMessageApi(vi.fn(async () => response))
    const onMessagesRecovered = vi.fn()
    const onAcceptedMessagesRecovered = vi.fn()
    const workflow = createAIChatWorkflow({
      conversationApi: createConversationApi(),
      messageApi,
      realtime: new FakeFeatureRealtime(),
      handlers: { onMessagesRecovered, onAcceptedMessagesRecovered },
    })

    await workflow.recoverActiveRequest(9, 'request-9')

    expect(messageApi.list).toHaveBeenCalledWith(
      { conversation_id: 9, limit: 50 },
      { signal: expect.any(AbortSignal) },
    )
    expect(onAcceptedMessagesRecovered).toHaveBeenCalledWith(9, response, 'request-9')
    expect(onMessagesRecovered).not.toHaveBeenCalled()
    workflow.dispose()
  })

  it('handles durable stopped settlement without replacing visible messages', async () => {
    const realtime = new FakeFeatureRealtime()
    const conversationApi = createConversationApi()
    const messageApi = createMessageApi()
    const onCanceled = vi.fn()
    const workflow = createAIChatWorkflow({
      conversationApi,
      messageApi,
      realtime,
      handlers: { onCanceled },
    })
    workflow.setActiveConversation(7)
    await workflow.loadConversations(2)
    vi.mocked(conversationApi.list).mockClear()

    await realtime.emit({
      ...eventBase,
      event_id: '01J00000000000000000000006',
      type: 'ai.response.canceled.v2',
      sequence: 6,
      durability: 'durable',
      data: {
        conversation_id: 7,
        request_id: 'request-a',
        assistant_message_id: 97,
      },
    })

    expect(onCanceled).toHaveBeenCalledWith({
      conversation_id: 7,
      request_id: 'request-a',
      assistant_message_id: 97,
    })
    expect(messageApi.list).not.toHaveBeenCalled()
    expect(conversationApi.list).toHaveBeenCalledOnce()
    workflow.dispose()
  })

  it('refreshes the active session and conversation list only after a history mutation succeeds', async () => {
    const conversationApi = createConversationApi()
    const messageApi = createMessageApi()
    const onReplyAccepted = vi.fn()
    const onAcceptedMessagesRecovered = vi.fn()
    const workflow = createAIChatWorkflow({
      conversationApi,
      messageApi,
      realtime: new FakeFeatureRealtime(),
      handlers: { onReplyAccepted, onAcceptedMessagesRecovered },
    })
    await workflow.loadConversations(2)
    await workflow.loadMessages(17)
    vi.mocked(conversationApi.list).mockClear()
    vi.mocked(messageApi.list).mockClear()

    await workflow.reviseMessage.mutate({
      conversation_id: 17,
      message_id: 101,
      content: 'Corrected question',
      request_id: 'revision-request',
    })

    expect(messageApi.revise).toHaveBeenCalledWith({
      conversation_id: 17,
      message_id: 101,
      content: 'Corrected question',
      request_id: 'revision-request',
    }, { signal: expect.any(AbortSignal) })
    expect(messageApi.list).toHaveBeenCalledOnce()
    expect(conversationApi.list).toHaveBeenCalledOnce()
    expect(onReplyAccepted).toHaveBeenCalledWith({
      conversation_id: 17,
      user_message_id: 101,
      command_id: 201,
      request_id: 'revision-request',
      state: 'pending',
    })
    expect(onAcceptedMessagesRecovered).toHaveBeenCalledWith(
      17,
      expect.objectContaining({ list: expect.any(Array) }),
      'revision-request',
    )

    vi.mocked(conversationApi.list).mockClear()
    vi.mocked(messageApi.list).mockClear()
    await workflow.deleteMessages.mutate({ conversation_id: 17, ids: [202, 101] })

    expect(messageApi.deleteBatch).toHaveBeenCalledWith(
      { conversation_id: 17, ids: [202, 101] },
      { signal: expect.any(AbortSignal) },
    )
    expect(messageApi.list).toHaveBeenCalledOnce()
    expect(conversationApi.list).toHaveBeenCalledOnce()
    workflow.dispose()
  })

  it('restores visible current messages before advancing the assistant cursor and only lists non-current completions', async () => {
    const order: string[] = []
    const realtime = new FakeFeatureRealtime()
    const conversationApi = createConversationApi(vi.fn(async () => {
      order.push('conversations')
      return { list: [conversation(17), conversation(18)], next_time: '', next_id: 0, has_more: false }
    }))
    vi.mocked(conversationApi.advanceReadCursor).mockImplementation(async ({ message_id }) => {
      order.push(`cursor:${message_id}`)
      return { conversation_id: 17, last_read_message_id: message_id, unread_count: 0 }
    })
    const messageApi = createMessageApi(vi.fn(async () => {
      order.push('messages')
      return { list: [{ ...message(307), paired_message_id: 101 }], next_id: 0, has_more: false }
    }))
    const workflow = createAIChatWorkflow({
      conversationApi,
      messageApi,
      realtime,
      handlers: {
        onMessagesRecovered() {
          order.push('visible')
        },
      },
    })
    await workflow.loadConversations(2)
    await workflow.loadMessages(17)
    order.length = 0

    await realtime.emit({
      ...eventBase,
      event_id: '01J00000000000000000000003',
      type: 'ai.response.completed.v1',
      sequence: 3,
      durability: 'durable',
      data: { conversation_id: 17, request_id: 'request-17', assistant_message_id: 307 },
    })
    expect(order).toEqual(['messages', 'visible', 'cursor:307', 'conversations'])

    order.length = 0
    await realtime.emit({
      ...eventBase,
      event_id: '01J00000000000000000000004',
      type: 'ai.response.completed.v1',
      sequence: 4,
      durability: 'durable',
      data: { conversation_id: 18, request_id: 'request-18', assistant_message_id: 408 },
    })
    expect(order).toEqual(['conversations'])

    order.length = 0
    await realtime.recover(5)
    expect(order).toEqual(['messages', 'visible', 'cursor:307', 'conversations'])
    workflow.dispose()
  })

  it('restores the exact prior feedback state when the optimistic request fails', async () => {
    const onFeedbackChanged = vi.fn()
    const runApi = {
      setUserFeedback: vi.fn(async () => {
        throw new Error('feedback failed')
      }),
    }
    const workflow = createAIChatWorkflow({
      conversationApi: createConversationApi(),
      messageApi: createMessageApi(),
      runApi,
      realtime: new FakeFeatureRealtime(),
      handlers: { onFeedbackChanged },
    })

    await expect(workflow.setMessageFeedback.mutate({
      conversation_id: 17,
      message_id: 202,
      run_id: 707,
      liked: false,
      previous_liked: true,
    })).rejects.toBeDefined()

    expect(onFeedbackChanged.mock.calls).toEqual([
      [17, 202, false],
      [17, 202, true],
    ])
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
    advanceReadCursor: vi.fn(async ({ conversation_id, message_id }) => ({
      conversation_id,
      last_read_message_id: message_id,
      unread_count: 0,
    })),
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
      status: 'stopped',
      assistant_message_id: 1,
      settlement_pending: true,
    })),
    revise: vi.fn(async ({ conversation_id, request_id }) => ({
      conversation_id,
      user_message_id: 101,
      command_id: 201,
      request_id,
      state: 'pending',
    })),
    regenerate: vi.fn(async ({ conversation_id, request_id }) => ({
      conversation_id,
      user_message_id: 102,
      command_id: 202,
      request_id,
      state: 'pending',
    })),
    deleteBatch: vi.fn(async ({ ids }) => ({ deleted_ids: [...ids].sort((a, b) => a - b) })),
  }
}
