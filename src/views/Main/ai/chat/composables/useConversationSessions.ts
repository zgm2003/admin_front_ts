import { computed, shallowRef } from 'vue'
import { AiRoleEnum } from '@/enums'
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
    updatedAt: Date.now(),
  }
}

function nowText() {
  return new Date().toISOString()
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
    let session = sessions.value.get(conversationId)
    if (!session) {
      session = createSession(conversationId)
      sessions.value.set(conversationId, session)
    }
    session.updatedAt = Date.now()
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
    const session = getOrCreate(conversationId)
    if (session.isStreaming || session.sending) return
    session.messages = messages
    session.nextMessageId = nextMessageId
    session.hasMoreMessages = hasMoreMessages
    session.updatedAt = Date.now()
    commit()
  }

  function prependMessages(conversationId: number, messages: Message[], nextMessageId: number, hasMoreMessages: boolean) {
    const session = getOrCreate(conversationId)
    const existingIds = new Set(session.messages.map((message) => message.id))
    session.messages = [...messages.filter((message) => !existingIds.has(message.id)), ...session.messages]
    session.nextMessageId = nextMessageId
    session.hasMoreMessages = hasMoreMessages
    session.updatedAt = Date.now()
    commit()
  }

  function setLoading(conversationId: number, value: boolean) {
    const session = getOrCreate(conversationId)
    session.loadingMessages = value
    commit()
  }

  function setLoadingMore(conversationId: number, value: boolean) {
    const session = getOrCreate(conversationId)
    session.loadingMoreMessages = value
    commit()
  }

  function beginSend(conversationId: number, requestId: string, content: string) {
    const session = getOrCreate(conversationId)
    const createdAt = nowText()
    session.pendingRequestId = requestId
    session.sending = true
    session.isStreaming = true
    session.streamingContent = ''
    session.messages = [
      ...session.messages,
      {
        id: -Date.now(),
        role: AiRoleEnum.USER,
        content_type: TEXT_CONTENT_TYPE,
        content,
        created_at: createdAt,
        updated_at: createdAt,
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
    ]
    session.updatedAt = Date.now()
    commit()
  }

  function markUserMessage(conversationId: number, requestId: string, userMessageId: number) {
    const session = getOrCreate(conversationId)
    session.messages = session.messages.map((message) => {
      if (message.request_id === requestId && message.role === AiRoleEnum.USER && message.id < 0) {
        return { ...message, id: userMessageId }
      }
      return message
    })
    session.sending = false
    commit()
  }

  function appendDelta(conversationId: number, requestId: string, delta: string) {
    const session = getOrCreate(conversationId)
    if (session.pendingRequestId && session.pendingRequestId !== requestId) return

    session.pendingRequestId = requestId
    session.isStreaming = true
    session.sending = false
    session.streamingContent += delta
    session.messages = session.messages.map((message, index) => {
      const isLast = index === session.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return { ...message, content: session.streamingContent, isStreaming: true, request_id: requestId }
      }
      return message
    })
    session.updatedAt = Date.now()
    commit()
  }

  function complete(conversationId: number, requestId: string, assistantMessageId: number) {
    const session = getOrCreate(conversationId)
    if (session.pendingRequestId && session.pendingRequestId !== requestId) return

    session.messages = session.messages.map((message, index) => {
      const isLast = index === session.messages.length - 1
      if (isLast && message.role === AiRoleEnum.ASSISTANT) {
        return {
          ...message,
          id: assistantMessageId,
          content: session.streamingContent || message.content,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      return message
    })
    session.pendingRequestId = ''
    session.sending = false
    session.isStreaming = false
    session.streamingContent = ''
    session.updatedAt = Date.now()
    commit()
  }

  function fail(conversationId: number, requestId: string, messageText: string) {
    const session = getOrCreate(conversationId)
    if (session.pendingRequestId && session.pendingRequestId !== requestId) return

    session.messages = session.messages.map((message, index) => {
      const isLast = index === session.messages.length - 1
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
    session.pendingRequestId = ''
    session.sending = false
    session.isStreaming = false
    session.streamingContent = ''
    session.updatedAt = Date.now()
    commit()
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
    remove,
  }
}
