import { shallowRef } from 'vue'
import { AiConversationApi, type AiConversationItem, type AiConversationListResponse } from '@/api/ai/conversations'
import {
  AiMessageApi,
  type AiMessageCancelParams,
  type AiMessageCancelResponse,
  type AiMessageDeleteParams,
  type AiMessageDeleteResponse,
  type AiMessageItem,
  type AiMessageListResponse,
  type AiMessageRegenerationParams,
  type AiMessageRevisionParams,
  type AiMessageSendParams,
  type AiMessageSendResponse,
} from '@/api/ai/messages'
import { AiRunApi, type AiRunUserFeedbackResponse } from '@/api/ai/runs'
import type { KernelRealtime } from '@/app/kernel'
import type { ExecuteOptions } from '@/modules/http/client'
import { createMutation } from '@/modules/resource-query/mutation'
import { createResourceQuery, type ResourceQuery } from '@/modules/resource-query/query'
import type {
  AICanceledPayload,
  AICompletedPayload,
  AIDeltaPayload,
  AIFailedPayload,
  AIStartPayload,
} from '@/modules/realtime/protocol'
import type { Id } from '@/types/common'

const CONVERSATION_LIMIT = 30
const MESSAGE_LIMIT = 50

export interface AIChatConversationApi {
  list(
    params: { agent_id?: number | ''; before_time?: string; before_id?: number; limit?: number },
    options: ExecuteOptions,
  ): Promise<AiConversationListResponse>
  create(params: { agent_id: number; title?: string }, options: ExecuteOptions): Promise<{ id: number }>
  update(params: { id: Id; title: string }, options: ExecuteOptions): Promise<void>
  deleteOne(params: { id: Id }, options: ExecuteOptions): Promise<void>
  advanceReadCursor(
    params: { conversation_id: number; message_id: number },
    options: ExecuteOptions,
  ): Promise<{ conversation_id: number; last_read_message_id: number; unread_count: number }>
}

export interface AIChatMessageApi {
  list(
    params: { conversation_id: number; before_id?: number; limit?: number },
    options: ExecuteOptions,
  ): Promise<AiMessageListResponse>
  send(params: AiMessageSendParams, options: ExecuteOptions): Promise<AiMessageSendResponse>
  cancel(params: AiMessageCancelParams, options: ExecuteOptions): Promise<AiMessageCancelResponse>
  revise(params: AiMessageRevisionParams, options: ExecuteOptions): Promise<AiMessageSendResponse>
  regenerate(params: AiMessageRegenerationParams, options: ExecuteOptions): Promise<AiMessageSendResponse>
  deleteBatch(params: AiMessageDeleteParams, options: ExecuteOptions): Promise<AiMessageDeleteResponse>
}

export interface AIChatRunApi {
  setUserFeedback(
    params: { id: Id; liked: boolean },
    options: ExecuteOptions,
  ): Promise<AiRunUserFeedbackResponse>
}

export interface AIChatWorkflowHandlers {
  readonly onStart?: (payload: AIStartPayload) => void | Promise<void>
  readonly onDelta?: (payload: AIDeltaPayload) => void | Promise<void>
  readonly onCompleted?: (payload: AICompletedPayload) => void | Promise<void>
  readonly onFailed?: (payload: AIFailedPayload) => void | Promise<void>
  readonly onCanceled?: (payload: AICanceledPayload) => void | Promise<void>
  readonly onMessagesRecovered?: (
    conversationID: number,
    response: AiMessageListResponse,
    requestID?: string,
  ) => void | Promise<void>
  readonly onReplyAccepted?: (response: AiMessageSendResponse) => void | Promise<void>
  readonly onAcceptedMessagesRecovered?: (
    conversationID: number,
    response: AiMessageListResponse,
    requestID: string,
  ) => void | Promise<void>
  readonly onFeedbackChanged?: (
    conversationID: number,
    messageID: number,
    liked: boolean,
  ) => void | Promise<void>
}

export interface AIChatWorkflowOptions {
  readonly conversationApi?: AIChatConversationApi
  readonly messageApi?: AIChatMessageApi
  readonly runApi?: AIChatRunApi
  readonly realtime: KernelRealtime
  readonly handlers?: AIChatWorkflowHandlers
}

interface ConversationRequest {
  readonly agent_id: number
  readonly before_time?: string
  readonly before_id?: number
  readonly limit: number
  readonly append: boolean
  readonly existing: readonly AiConversationItem[]
}

interface MessageRequest {
  readonly conversation_id: number
  readonly before_id?: number
  readonly limit: number
  readonly append: boolean
  readonly existing: readonly AiMessageItem[]
}

function mergeByID<T extends { readonly id: number }>(
  current: readonly T[],
  incoming: readonly T[],
): T[] {
  const seen = new Set(current.map(({ id }) => id))
  return [...current, ...incoming.filter(({ id }) => !seen.has(id))]
}

function refreshIfStarted(query: ResourceQuery<unknown, unknown, unknown>): Promise<unknown> | undefined {
  return query.state.value.kind === 'idle' ? undefined : query.refresh()
}

function isActiveReplyState(state: AiMessageSendResponse['state']) {
  return state === 'pending' || state === 'claimed' || state === 'running'
}

export function createAIChatWorkflow(options: AIChatWorkflowOptions) {
  const conversationApi = options.conversationApi ?? AiConversationApi
  const messageApi = options.messageApi ?? AiMessageApi
  const runApi = options.runApi ?? AiRunApi
  const lifecycle = new AbortController()
  let activeAgentID: number | null = null
  let activeConversationID: number | null = null
  let selectedConversationID: number | null = null
  let nextConversationTime = ''
  let nextConversationID = 0
  let hasMoreConversations = false
  let nextMessageID = 0
  let hasMoreMessages = false
  const conversationCursor = shallowRef({ next_time: '', next_id: 0, has_more: false })
  const messageCursor = shallowRef({ next_id: 0, has_more: false })

  const conversations: ResourceQuery<AiConversationItem, ConversationRequest, AiConversationListResponse> = createResourceQuery({
    async request(params, context) {
      const response = await conversationApi.list({
        agent_id: params.agent_id,
        ...(params.before_time === undefined ? {} : { before_time: params.before_time }),
        ...(params.before_id === undefined ? {} : { before_id: params.before_id }),
        limit: params.limit,
      }, context)
      return params.append
        ? { ...response, list: mergeByID(params.existing, response.list) }
        : response
    },
    selectItems: (response) => response.list,
    onCommit(response, params) {
      activeAgentID = params.agent_id
      nextConversationTime = response.next_time
      nextConversationID = response.next_id
      hasMoreConversations = response.has_more
      conversationCursor.value = {
        next_time: response.next_time,
        next_id: response.next_id,
        has_more: response.has_more,
      }
      return { agent_id: params.agent_id, limit: params.limit, append: false, existing: [] }
    },
  })

  const messages: ResourceQuery<AiMessageItem, MessageRequest, AiMessageListResponse> = createResourceQuery({
    async request(params, context) {
      const response = await messageApi.list({
        conversation_id: params.conversation_id,
        ...(params.before_id === undefined ? {} : { before_id: params.before_id }),
        limit: params.limit,
      }, context)
      return params.append
        ? { ...response, list: mergeByID(params.existing, response.list) }
        : response
    },
    selectItems: (response) => response.list,
    onCommit(response, params) {
      activeConversationID = params.conversation_id
      nextMessageID = response.next_id
      hasMoreMessages = response.has_more
      messageCursor.value = { next_id: response.next_id, has_more: response.has_more }
      return { conversation_id: params.conversation_id, limit: params.limit, append: false, existing: [] }
    },
  })

  function loadConversations(agentID: number) {
    return conversations.execute({
      agent_id: agentID,
      limit: CONVERSATION_LIMIT,
      append: false,
      existing: [],
    })
  }

  function loadMoreConversations() {
    if (!activeAgentID || !hasMoreConversations) return Promise.resolve(undefined)
    if (!nextConversationTime || nextConversationID <= 0) {
      return Promise.reject(new TypeError('AI conversation response exposed an incomplete cursor'))
    }
    return conversations.execute({
      agent_id: activeAgentID,
      before_time: nextConversationTime,
      before_id: nextConversationID,
      limit: CONVERSATION_LIMIT,
      append: true,
      existing: conversations.state.value.data,
    })
  }

  function loadMessages(conversationID: number) {
    selectedConversationID = conversationID
    return messages.execute({
      conversation_id: conversationID,
      limit: MESSAGE_LIMIT,
      append: false,
      existing: [],
    })
  }

  function loadMoreMessages(conversationID?: number, beforeID?: number) {
    const targetConversationID = conversationID ?? activeConversationID
    const targetBeforeID = beforeID ?? nextMessageID
    if (!targetConversationID || (conversationID === undefined && !hasMoreMessages)) {
      return Promise.resolve(undefined)
    }
    if (!targetBeforeID || targetBeforeID <= 0) {
      return Promise.reject(new TypeError('AI message response exposed an incomplete cursor'))
    }
    return messages.execute({
      conversation_id: targetConversationID,
      before_id: targetBeforeID,
      limit: MESSAGE_LIMIT,
      append: conversationID === undefined,
      existing: conversationID === undefined ? messages.state.value.data : [],
    })
  }

  const refreshConversations = { refresh: async () => { await refreshIfStarted(conversations) } }
  const createConversation = createMutation({
    key: (input: { agent_id: number; title?: string }) => `ai-conversation:create:${input.agent_id}:${input.title ?? ''}`,
    execute: (input, mutationOptions) => conversationApi.create(input, mutationOptions),
    invalidate: [refreshConversations],
  })
  const updateConversation = createMutation({
    key: (input: { id: Id; title: string }) => `ai-conversation:update:${input.id}`,
    execute: (input, mutationOptions) => conversationApi.update(input, mutationOptions),
    invalidate: [refreshConversations],
  })
  const deleteConversation = createMutation({
    key: (input: { id: Id }) => `ai-conversation:delete:${input.id}`,
    execute: (input, mutationOptions) => conversationApi.deleteOne(input, mutationOptions),
    invalidate: [refreshConversations],
  })
  const advanceReadCursor = createMutation({
    key: (input: { conversation_id: number; message_id: number }) => (
      `ai-conversation:read:${input.conversation_id}:${input.message_id}`
    ),
    execute: (input, mutationOptions) => conversationApi.advanceReadCursor(input, mutationOptions),
    invalidate: [],
  })
  const sendMessage = createMutation({
    key: (input: AiMessageSendParams) => `ai-message:send:${input.request_id}`,
    execute: (input, mutationOptions) => messageApi.send(input, mutationOptions),
    invalidate: [],
  })
  const cancelMessage = createMutation({
    key: (input: AiMessageCancelParams) => `ai-message:cancel:${input.request_id}`,
    execute: (input, mutationOptions) => messageApi.cancel(input, mutationOptions),
    invalidate: [],
  })
  const reviseMessage = createMutation({
    key: (input: AiMessageRevisionParams) => `ai-message:revise:${input.request_id}`,
    execute: async (input, mutationOptions) => {
      const result = await messageApi.revise(input, mutationOptions)
      if (isActiveReplyState(result.state)) {
        await options.handlers?.onReplyAccepted?.(result)
        await recoverAcceptedHistory(input.conversation_id, result.request_id)
      } else {
        await recoverConversation(input.conversation_id, { markRead: true })
      }
      return result
    },
    invalidate: [],
  })
  const regenerateMessage = createMutation({
    key: (input: AiMessageRegenerationParams) => `ai-message:regenerate:${input.request_id}`,
    execute: async (input, mutationOptions) => {
      const result = await messageApi.regenerate(input, mutationOptions)
      if (isActiveReplyState(result.state)) {
        await options.handlers?.onReplyAccepted?.(result)
        await recoverAcceptedHistory(input.conversation_id, result.request_id)
      } else {
        await recoverConversation(input.conversation_id, { markRead: true })
      }
      return result
    },
    invalidate: [],
  })
  const deleteMessages = createMutation({
    key: (input: AiMessageDeleteParams) => (
      `ai-message:delete:${input.conversation_id}:${input.ids.join(',')}`
    ),
    execute: async (input, mutationOptions) => {
      const result = await messageApi.deleteBatch(input, mutationOptions)
      await recoverHistoryMutation(input.conversation_id)
      return result
    },
    invalidate: [],
  })
  const setMessageFeedback = createMutation({
    key: (input: {
      conversation_id: number
      message_id: number
      run_id: number
      liked: boolean
      previous_liked: boolean
    }) => `ai-run:feedback:${input.run_id}`,
    execute: async (input, mutationOptions) => {
      await options.handlers?.onFeedbackChanged?.(
        input.conversation_id, input.message_id, input.liked,
      )
      try {
        const result = await runApi.setUserFeedback(
          { id: input.run_id, liked: input.liked }, mutationOptions,
        )
        await options.handlers?.onFeedbackChanged?.(
          input.conversation_id, input.message_id, result.liked,
        )
        return result
      } catch (error) {
        await options.handlers?.onFeedbackChanged?.(
          input.conversation_id, input.message_id, input.previous_liked,
        )
        throw error
      }
    },
    invalidate: [],
  })

  async function refreshConversationList() {
    await (refreshIfStarted(conversations) ?? Promise.resolve())
  }

  function setActiveConversation(conversationID: number | null) {
    if (conversationID !== null && (!Number.isSafeInteger(conversationID) || conversationID <= 0)) {
      throw new TypeError('AI active conversation ID must be a positive integer or null')
    }
    selectedConversationID = conversationID
  }

  function latestAssistantMessageID(response: AiMessageListResponse): number | null {
    let latest: number | null = null
    for (const message of response.list) {
      if (message.role !== 2 || message.id <= 0) continue
      if (latest === null || message.id > latest) latest = message.id
    }
    return latest
  }

  async function fetchVisibleMessages(conversationID: number) {
    return activeConversationID === conversationID && messages.state.value.kind !== 'idle'
      ? await messages.refresh()
      : await messageApi.list(
        { conversation_id: conversationID, limit: MESSAGE_LIMIT },
        { signal: lifecycle.signal },
      )
  }

  async function recoverVisibleMessages(conversationID: number, requestID?: string) {
    const response = await fetchVisibleMessages(conversationID)
    await options.handlers?.onMessagesRecovered?.(conversationID, response, requestID)
    return response
  }

  async function recoverAcceptedHistory(conversationID: number, requestID: string) {
    const response = await fetchVisibleMessages(conversationID)
    await options.handlers?.onAcceptedMessagesRecovered?.(conversationID, response, requestID)
    await refreshConversationList()
  }

  async function recoverConversation(
    conversationID: number,
    recoveryOptions: { requestID?: string; markRead?: boolean } = {},
  ) {
    if (selectedConversationID !== conversationID) {
      if (recoveryOptions.requestID !== undefined) {
        await recoverVisibleMessages(conversationID, recoveryOptions.requestID)
      }
      await refreshConversationList()
      return
    }

    const response = await recoverVisibleMessages(conversationID, recoveryOptions.requestID)
    try {
      if (recoveryOptions.markRead) {
        const messageID = latestAssistantMessageID(response)
        if (messageID !== null) {
          await conversationApi.advanceReadCursor(
            { conversation_id: conversationID, message_id: messageID },
            { signal: lifecycle.signal },
          )
        }
      }
    } finally {
      await refreshConversationList()
    }
  }

  async function recoverHistoryMutation(conversationID: number) {
    await recoverVisibleMessages(conversationID)
    await refreshConversationList()
  }

  function recoverRequest(conversationID: number, requestID: string) {
    if (!Number.isSafeInteger(conversationID) || conversationID <= 0) {
      return Promise.reject(new TypeError('AI recovery conversation ID must be a positive integer'))
    }
    if (!/\S/.test(requestID)) {
      return Promise.reject(new TypeError('AI recovery request ID must be non-empty'))
    }
    return recoverConversation(conversationID, { requestID, markRead: true })
  }

  const unsubscribe = [
    options.realtime.subscribe('ai.response.start.v1', ({ data }) => options.handlers?.onStart?.(data)),
    options.realtime.subscribe('ai.response.delta.v2', ({ data }) => options.handlers?.onDelta?.(data)),
    options.realtime.subscribe('ai.response.completed.v1', async ({ data }) => {
      await options.handlers?.onCompleted?.(data)
      await recoverConversation(data.conversation_id, { markRead: true })
    }),
    options.realtime.subscribe('ai.response.failed.v1', async ({ data }) => {
      await options.handlers?.onFailed?.(data)
      await recoverConversation(data.conversation_id)
    }),
    options.realtime.subscribe('ai.response.canceled.v2', async ({ data }) => {
      await options.handlers?.onCanceled?.(data)
      await recoverConversation(data.conversation_id)
    }),
  ]
  const unregisterRecovery = options.realtime.registerRecovery(async () => {
    if (selectedConversationID !== null) {
      await recoverConversation(selectedConversationID, { markRead: true })
      return
    }
    await refreshConversationList()
  })

  function dispose() {
    lifecycle.abort(new DOMException('AI chat workflow disposed', 'AbortError'))
    unsubscribe.forEach((release) => release())
    unregisterRecovery()
    createConversation.dispose()
    updateConversation.dispose()
    deleteConversation.dispose()
    advanceReadCursor.dispose()
    sendMessage.dispose()
    cancelMessage.dispose()
    reviseMessage.dispose()
    regenerateMessage.dispose()
    deleteMessages.dispose()
    setMessageFeedback.dispose()
    conversations.dispose()
    messages.dispose()
  }

  return {
    conversations,
    conversationCursor,
    messages,
    messageCursor,
    loadConversations,
    loadMoreConversations,
    loadMessages,
    setActiveConversation,
    loadMoreMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    advanceReadCursor,
    sendMessage,
    cancelMessage,
    reviseMessage,
    regenerateMessage,
    deleteMessages,
    setMessageFeedback,
    recoverConversation,
    refreshConversationList,
    recoverRequest,
    dispose,
  }
}
