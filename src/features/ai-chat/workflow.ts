import { AiConversationApi, type AiConversationItem, type AiConversationListResponse } from '@/api/ai/conversations'
import {
  AiMessageApi,
  type AiMessageCancelParams,
  type AiMessageCancelResponse,
  type AiMessageItem,
  type AiMessageListResponse,
  type AiMessageSendParams,
  type AiMessageSendResponse,
} from '@/api/ai/messages'
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
}

export interface AIChatMessageApi {
  list(
    params: { conversation_id: number; before_id?: number; limit?: number },
    options: ExecuteOptions,
  ): Promise<AiMessageListResponse>
  send(params: AiMessageSendParams, options: ExecuteOptions): Promise<AiMessageSendResponse>
  cancel(params: AiMessageCancelParams, options: ExecuteOptions): Promise<AiMessageCancelResponse>
}

export interface AIChatWorkflowHandlers {
  readonly onStart?: (payload: AIStartPayload) => void | Promise<void>
  readonly onDelta?: (payload: AIDeltaPayload) => void | Promise<void>
  readonly onCompleted?: (payload: AICompletedPayload) => void | Promise<void>
  readonly onFailed?: (payload: AIFailedPayload) => void | Promise<void>
  readonly onCanceled?: (payload: AICanceledPayload) => void | Promise<void>
}

export interface AIChatWorkflowOptions {
  readonly conversationApi?: AIChatConversationApi
  readonly messageApi?: AIChatMessageApi
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

export function createAIChatWorkflow(options: AIChatWorkflowOptions) {
  const conversationApi = options.conversationApi ?? AiConversationApi
  const messageApi = options.messageApi ?? AiMessageApi
  let activeAgentID: number | null = null
  let activeConversationID: number | null = null
  let nextConversationTime = ''
  let nextConversationID = 0
  let hasMoreConversations = false
  let nextMessageID = 0
  let hasMoreMessages = false

  let conversations!: ResourceQuery<AiConversationItem, ConversationRequest, AiConversationListResponse>
  conversations = createResourceQuery({
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
      return { agent_id: params.agent_id, limit: params.limit, append: false, existing: [] }
    },
  })

  let messages!: ResourceQuery<AiMessageItem, MessageRequest, AiMessageListResponse>
  messages = createResourceQuery({
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
    return messages.execute({
      conversation_id: conversationID,
      limit: MESSAGE_LIMIT,
      append: false,
      existing: [],
    })
  }

  function loadMoreMessages() {
    if (!activeConversationID || !hasMoreMessages) return Promise.resolve(undefined)
    if (nextMessageID <= 0) {
      return Promise.reject(new TypeError('AI message response exposed an incomplete cursor'))
    }
    return messages.execute({
      conversation_id: activeConversationID,
      before_id: nextMessageID,
      limit: MESSAGE_LIMIT,
      append: true,
      existing: messages.state.value.data,
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

  async function recoverTerminal(conversationID: number) {
    if (activeConversationID === conversationID && messages.state.value.kind !== 'idle') {
      await messages.refresh()
    }
  }

  const unsubscribe = [
    options.realtime.subscribe('ai.response.start.v1', ({ data }) => options.handlers?.onStart?.(data)),
    options.realtime.subscribe('ai.response.delta.v1', ({ data }) => options.handlers?.onDelta?.(data)),
    options.realtime.subscribe('ai.response.completed.v1', async ({ data }) => {
      await options.handlers?.onCompleted?.(data)
      await recoverTerminal(data.conversation_id)
    }),
    options.realtime.subscribe('ai.response.failed.v1', async ({ data }) => {
      await options.handlers?.onFailed?.(data)
      await recoverTerminal(data.conversation_id)
    }),
    options.realtime.subscribe('ai.response.canceled.v1', async ({ data }) => {
      await options.handlers?.onCanceled?.(data)
      await recoverTerminal(data.conversation_id)
    }),
  ]
  const unregisterRecovery = options.realtime.registerRecovery(async () => {
    const work = [refreshIfStarted(conversations), refreshIfStarted(messages)]
      .filter((value): value is Promise<unknown> => value !== undefined)
    await Promise.all(work)
  })

  function dispose() {
    unsubscribe.forEach((release) => release())
    unregisterRecovery()
    createConversation.dispose()
    updateConversation.dispose()
    deleteConversation.dispose()
    sendMessage.dispose()
    cancelMessage.dispose()
    conversations.dispose()
    messages.dispose()
  }

  return {
    conversations,
    messages,
    loadConversations,
    loadMoreConversations,
    loadMessages,
    loadMoreMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    cancelMessage,
    dispose,
  }
}
