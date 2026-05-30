import { computed, shallowRef } from 'vue'
import { AiRoleEnum } from '@/enums'
import type { AiChatAttachment } from '@/api/ai/messages'
import type { ConversationSession, Message } from './types'

const MAX_SESSIONS = 8
const TEXT_CONTENT_TYPE = 'text'

function createSession(conversationId: number): ConversationSession {
  return {
    conversationId,
    messages: [],
    nextMessageId: 0,
    hasMoreMessages: false,
    loadingMessages: false,
    loadingMoreMessages: false,
    sending: false,
    isStreaming: false,
    pendingRequestId: '',
    streamingContent: '',
    canceledRequestIds: [],
    updatedAt: Date.now(),
  }
}

function nowText() {
  return new Date().toISOString()
}

function lastAssistantMessage(session: ConversationSession) {
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const message = session.messages[i]
    if (message?.role === AiRoleEnum.ASSISTANT) return message
  }
  return undefined
}

function hasPendingUserMessage(session: ConversationSession, requestId: string) {
  return session.messages.some((message) => message.request_id === requestId && message.role === AiRoleEnum.USER && message.id < 0)
}

function canApplyUserMessageEvent(session: ConversationSession, requestId: string) {
  if (session.canceledRequestIds.includes(requestId)) return false
  if (session.pendingRequestId && session.pendingRequestId !== requestId) return false
  return hasPendingUserMessage(session, requestId)
}

function canApplyAssistantStreamEvent(session: ConversationSession, requestId: string) {
  if (session.canceledRequestIds.includes(requestId)) return false
  if (session.pendingRequestId) return session.pendingRequestId === requestId

  const assistantMessage = lastAssistantMessage(session)
  return assistantMessage?.request_id === requestId && assistantMessage.isStreaming === true
}

function commitSession(sessions: Map<number, ConversationSession>, conversationId: number, session: ConversationSession) {
  sessions.set(conversationId, session)
}

export function useConversationSessions() {
  const sessions = shallowRef(new Map<number, ConversationSession>())
  const accessOrder = shallowRef<number[]>([])

  const activeStreams = computed(() => Array.from(sessions.value.values()).filter((session) => session.isStreaming || session.sending).length)

  function commit() {
    sessions.value = new Map(sessions.value)
  }

  function touch(conversationId: number) {
    accessOrder.value = [conversationId, ...accessOrder.value.filter((id) => id !== conversationId)]
  }

  function evict() {
    while (accessOrder.value.length > MAX_SESSIONS) {
      const id = accessOrder.value[accessOrder.value.length - 1]
      if (id === undefined) break
      const session = sessions.value.get(id)
      if (session?.isStreaming || session?.sending || session?.pendingRequestId) break
      sessions.value.delete(id)
      accessOrder.value = accessOrder.value.slice(0, -1)
    }
  }

  function getOrCreate(conversationId: number): ConversationSession {
    const current = sessions.value.get(conversationId)
    const session = {
      ...(current ?? createSession(conversationId)),
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    touch(conversationId)
    evict()
    commit()
    return session
  }

  function get(conversationId: number | null): ConversationSession | undefined {
    if (!conversationId) return undefined
    return sessions.value.get(conversationId)
  }

  function replaceMessages(conversationId: number, messages: Message[], nextMessageId: number, hasMoreMessages: boolean) {
    const current = getOrCreate(conversationId)
    if (current.isStreaming || current.sending) return
    const session: ConversationSession = {
      ...current,
      messages,
      nextMessageId,
      hasMoreMessages,
      loadingMessages: false,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function prependMessages(conversationId: number, messages: Message[], nextMessageId: number, hasMoreMessages: boolean) {
    const current = getOrCreate(conversationId)
    const existingIds = new Set(current.messages.map((message) => message.id))
    const session: ConversationSession = {
      ...current,
      messages: [...messages.filter((message) => !existingIds.has(message.id)), ...current.messages],
      nextMessageId,
      hasMoreMessages,
      loadingMoreMessages: false,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function setLoading(conversationId: number, value: boolean) {
    const current = getOrCreate(conversationId)
    commitSession(sessions.value, conversationId, { ...current, loadingMessages: value, updatedAt: Date.now() })
    commit()
  }

  function setLoadingMore(conversationId: number, value: boolean) {
    const current = getOrCreate(conversationId)
    commitSession(sessions.value, conversationId, { ...current, loadingMoreMessages: value, updatedAt: Date.now() })
    commit()
  }

  function beginSend(conversationId: number, requestId: string, content: string, attachments?: AiChatAttachment[]) {
    const current = getOrCreate(conversationId)
    const createdAt = nowText()
    const session: ConversationSession = {
      ...current,
      pendingRequestId: requestId,
      sending: true,
      isStreaming: true,
      streamingContent: '',
      messages: [
        ...current.messages,
        {
          id: -Date.now(),
          role: AiRoleEnum.USER,
          content_type: TEXT_CONTENT_TYPE,
          content,
          created_at: createdAt,
          updated_at: createdAt,
          meta_json: attachments?.length ? { attachments } : undefined,
          request_id: requestId,
        },
        {
          id: -Date.now() - 1,
          role: AiRoleEnum.ASSISTANT,
          content_type: TEXT_CONTENT_TYPE,
          content: '',
          created_at: createdAt,
          updated_at: createdAt,
          isStreaming: true,
          request_id: requestId,
        },
      ],
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function markUserMessage(conversationId: number, requestId: string, userMessageId: number) {
    const current = getOrCreate(conversationId)
    if (!canApplyUserMessageEvent(current, requestId)) return
    const session: ConversationSession = {
      ...current,
      messages: current.messages.map((message) => {
        if (message.request_id === requestId && message.role === AiRoleEnum.USER && message.id < 0) {
          return { ...message, id: userMessageId }
        }
        return message
      }),
      sending: false,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function appendDelta(conversationId: number, requestId: string, delta: string) {
    const current = getOrCreate(conversationId)
    if (!canApplyAssistantStreamEvent(current, requestId)) return

    const streamingContent = current.streamingContent + delta
    const messages = current.messages.map((message, index) => {
      const isLast = index === current.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return { ...message, content: streamingContent, isStreaming: true, request_id: requestId }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      pendingRequestId: requestId,
      isStreaming: true,
      sending: false,
      streamingContent,
      messages,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function complete(conversationId: number, requestId: string, assistantMessageId: number) {
    const current = getOrCreate(conversationId)
    if (!canApplyAssistantStreamEvent(current, requestId)) return

    const messages = current.messages.map((message, index) => {
      const isLast = index === current.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return {
          ...message,
          id: assistantMessageId,
          content: current.streamingContent || message.content,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      messages,
      pendingRequestId: '',
      sending: false,
      isStreaming: false,
      streamingContent: '',
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function fail(conversationId: number, requestId: string, messageText: string) {
    const current = getOrCreate(conversationId)
    if (!canApplyAssistantStreamEvent(current, requestId)) return

    const messages = current.messages.map((message, index) => {
      const isLast = index === current.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return {
          ...message,
          content: messageText,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      messages,
      pendingRequestId: '',
      sending: false,
      isStreaming: false,
      streamingContent: '',
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function cancel(conversationId: number, requestId: string, messageText = '') {
    const current = getOrCreate(conversationId)
    if (current.pendingRequestId !== requestId) return

    const messages = current.messages.map((message, index) => {
      const isLast = index === current.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return {
          ...message,
          content: message.content || messageText,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      messages,
      pendingRequestId: '',
      sending: false,
      isStreaming: false,
      streamingContent: '',
      canceledRequestIds: [...current.canceledRequestIds.filter((id) => id !== requestId), requestId].slice(-20),
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function isCanceled(conversationId: number, requestId: string) {
    const current = get(conversationId)
    return current?.canceledRequestIds.includes(requestId) ?? false
  }

  function remove(conversationId: number) {
    sessions.value.delete(conversationId)
    accessOrder.value = accessOrder.value.filter((id) => id !== conversationId)
    commit()
  }

  return {
    sessions,
    activeStreams,
    get,
    getOrCreate,
    replaceMessages,
    prependMessages,
    setLoading,
    setLoadingMore,
    beginSend,
    markUserMessage,
    appendDelta,
    complete,
    fail,
    cancel,
    isCanceled,
    remove,
  }
}
