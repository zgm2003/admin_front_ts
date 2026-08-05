import { computed, shallowRef } from 'vue'
import { AiRoleEnum } from '@/enums'
import type { AiChatAttachment, AIRuntimeParams } from '@/api/ai/messages'
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
    stopCommitPendingRequestId: '',
    streamingContent: '',
    lastContinuousDeliverySeq: 0,
    canceledRequestIds: [],
    settlementPendingRequestIds: [],
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

function canApplyAssistantTerminalEvent(session: ConversationSession, requestId: string) {
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

  const activeStreams = computed(() => Array.from(sessions.value.values()).filter((session) => (
    session.isStreaming || session.sending || Boolean(session.stopCommitPendingRequestId)
  )).length)

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
      if (session?.isStreaming || session?.sending || session?.pendingRequestId || session?.stopCommitPendingRequestId) break
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
    if (current.isStreaming || current.sending || current.stopCommitPendingRequestId) return
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

  function beginSend(
    conversationId: number,
    requestId: string,
    content: string,
    attachments?: AiChatAttachment[],
    runtimeParams?: AIRuntimeParams,
  ) {
    const current = getOrCreate(conversationId)
    if (current.pendingRequestId || current.stopCommitPendingRequestId) return false
    const createdAt = nowText()
    const session: ConversationSession = {
      ...current,
      pendingRequestId: requestId,
      stopCommitPendingRequestId: '',
      sending: true,
      isStreaming: true,
      streamingContent: '',
      lastContinuousDeliverySeq: 0,
      messages: [
        ...current.messages,
        {
          id: -Date.now(),
          role: AiRoleEnum.USER,
          content_type: TEXT_CONTENT_TYPE,
          content,
          created_at: createdAt,
          updated_at: createdAt,
          meta_json: attachments?.length || runtimeParams
            ? { attachments, runtime_params: runtimeParams }
            : undefined,
          paired_message_id: null,
          run_id: null,
          liked: false,
          delivery_state: null,
          settlement_pending: false,
          request_id: requestId,
        },
        {
          id: -Date.now() - 1,
          role: AiRoleEnum.ASSISTANT,
          content_type: TEXT_CONTENT_TYPE,
          content: '',
          created_at: createdAt,
          updated_at: createdAt,
          paired_message_id: null,
          run_id: null,
          liked: false,
          delivery_state: null,
          settlement_pending: false,
          isStreaming: true,
          request_id: requestId,
        },
      ],
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
    return true
  }

  function beginAcceptedReply(
    conversationId: number,
    requestId: string,
    userMessageId: number,
  ) {
    const current = getOrCreate(conversationId)
    if (current.pendingRequestId || current.stopCommitPendingRequestId) return false
    const createdAt = nowText()
    const hasPlaceholder = current.messages.some((message) => (
      message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId
    ))
    const messages = current.messages.map((message) => (
      message.id === userMessageId
        ? { ...message, request_id: requestId }
        : message
    ))
    if (!hasPlaceholder) {
      messages.push({
        id: -Date.now(),
        role: AiRoleEnum.ASSISTANT,
        content_type: TEXT_CONTENT_TYPE,
        content: '',
        created_at: createdAt,
        updated_at: createdAt,
        paired_message_id: userMessageId,
        run_id: null,
        liked: false,
        delivery_state: null,
        settlement_pending: false,
        isStreaming: true,
        request_id: requestId,
      })
    }
    commitSession(sessions.value, conversationId, {
      ...current,
      messages,
      pendingRequestId: requestId,
      stopCommitPendingRequestId: '',
      sending: false,
      isStreaming: true,
      streamingContent: '',
      lastContinuousDeliverySeq: 0,
      updatedAt: Date.now(),
    })
    commit()
    return true
  }

  function setMessageLiked(conversationId: number, messageId: number, liked: boolean) {
    const current = get(conversationId)
    if (!current) return
    commitSession(sessions.value, conversationId, {
      ...current,
      messages: current.messages.map((message) => (
        message.id === messageId ? { ...message, liked } : message
      )),
      updatedAt: Date.now(),
    })
    commit()
  }

  function recoverAcceptedMessages(
    conversationId: number,
    messages: Message[],
    nextMessageId: number,
    hasMoreMessages: boolean,
    requestId: string,
  ) {
    const current = get(conversationId)
    if (!current || current.pendingRequestId !== requestId) return
    const placeholder = current.messages.find((message) => (
      message.role === AiRoleEnum.ASSISTANT
      && message.request_id === requestId
      && message.isStreaming === true
    ))
    if (!placeholder) return

    const userMessageId = placeholder.paired_message_id
    const terminalReplyVisible = userMessageId !== null && messages.some((message) => (
      message.role === AiRoleEnum.ASSISTANT && message.paired_message_id === userMessageId
    ))
    if (terminalReplyVisible) {
      recoverMessages(conversationId, messages, nextMessageId, hasMoreMessages)
      return
    }

    const recovered = messages.map((message) => (
      message.id === userMessageId ? { ...message, request_id: requestId } : message
    ))
    commitSession(sessions.value, conversationId, {
      ...current,
      messages: [...recovered, placeholder],
      nextMessageId,
      hasMoreMessages,
      loadingMessages: false,
      updatedAt: Date.now(),
    })
    commit()
  }

  function beginStopping(conversationId: number, requestId: string): number | null {
    const current = getOrCreate(conversationId)
    if (current.stopCommitPendingRequestId === requestId) {
      return current.lastContinuousDeliverySeq
    }
    if (current.pendingRequestId !== requestId || current.canceledRequestIds.includes(requestId)) {
      return null
    }
    const hasAssistant = current.messages.some((message) => (
      message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId
    ))
    if (!hasAssistant) return null

    commitSession(sessions.value, conversationId, {
      ...current,
      messages: current.messages.map((message) => (
        message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId
          ? {
              ...message,
              content: current.streamingContent || message.content,
              delivery_state: 'stopped',
              settlement_pending: true,
              isStreaming: false,
              updated_at: nowText(),
            }
          : message
      )),
      pendingRequestId: '',
      stopCommitPendingRequestId: requestId,
      sending: false,
      isStreaming: false,
      streamingContent: '',
      canceledRequestIds: [...current.canceledRequestIds.filter((id) => id !== requestId), requestId].slice(-20),
      settlementPendingRequestIds: [
        ...current.settlementPendingRequestIds.filter((id) => id !== requestId),
        requestId,
      ].slice(-20),
      updatedAt: Date.now(),
    })
    commit()
    return current.lastContinuousDeliverySeq
  }

  function markUserMessage(conversationId: number, requestId: string, userMessageId: number) {
    const current = getOrCreate(conversationId)
    const stoppedRequest = current.canceledRequestIds.includes(requestId)
    if (stoppedRequest) {
      if (!hasPendingUserMessage(current, requestId)) return
    } else if (!canApplyUserMessageEvent(current, requestId)) {
      return
    }
    const assistantMessageId = current.messages.find((message) => (
      message.request_id === requestId && message.role === AiRoleEnum.ASSISTANT && message.id > 0
    ))?.id ?? null
    const session: ConversationSession = {
      ...current,
      messages: current.messages.map((message) => {
        if (message.request_id === requestId && message.role === AiRoleEnum.USER && message.id < 0) {
          return { ...message, id: userMessageId, paired_message_id: assistantMessageId }
        }
        if (message.request_id === requestId && message.role === AiRoleEnum.ASSISTANT) {
          return { ...message, paired_message_id: userMessageId }
        }
        return message
      }),
      sending: current.pendingRequestId === requestId ? false : current.sending,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
  }

  function appendDelta(
    conversationId: number,
    requestId: string,
    deliverySeq: number,
    delta: string,
  ): 'applied' | 'duplicate' | 'gap' | 'ignored' {
    const current = getOrCreate(conversationId)
    if (!canApplyAssistantStreamEvent(current, requestId)) return 'ignored'
    if (!Number.isSafeInteger(deliverySeq) || deliverySeq <= 0 || delta.length === 0) return 'ignored'
    if (deliverySeq <= current.lastContinuousDeliverySeq) return 'duplicate'
    if (deliverySeq !== current.lastContinuousDeliverySeq + 1) return 'gap'

    const streamingContent = current.streamingContent + delta
    const messages = current.messages.map((message) => {
      if (message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId) {
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
      lastContinuousDeliverySeq: deliverySeq,
      messages,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
    return 'applied'
  }

  function complete(
    conversationId: number,
    requestId: string,
    assistantMessageId: number,
  ): 'applied' | 'recover' | 'ignored' {
    const current = getOrCreate(conversationId)
    if (current.canceledRequestIds.includes(requestId)) {
      return current.stopCommitPendingRequestId === requestId ? 'recover' : 'ignored'
    }
    if (!canApplyAssistantTerminalEvent(current, requestId)) return 'ignored'

    const messages = current.messages.map((message) => {
      if (message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId) {
        return {
          ...message,
          id: assistantMessageId,
          content: current.streamingContent || message.content,
          delivery_state: 'completed' as const,
          settlement_pending: false,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      if (message.role === AiRoleEnum.USER && message.request_id === requestId) {
        return { ...message, paired_message_id: assistantMessageId }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      messages,
      pendingRequestId: '',
      stopCommitPendingRequestId: current.stopCommitPendingRequestId === requestId
        ? ''
        : current.stopCommitPendingRequestId,
      sending: false,
      isStreaming: false,
      streamingContent: '',
      lastContinuousDeliverySeq: 0,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
    return 'applied'
  }

  function fail(
    conversationId: number,
    requestId: string,
    messageText: string,
  ): 'applied' | 'recover' | 'ignored' {
    const current = getOrCreate(conversationId)
    if (current.canceledRequestIds.includes(requestId)) {
      return current.stopCommitPendingRequestId === requestId ? 'recover' : 'ignored'
    }
    if (!canApplyAssistantTerminalEvent(current, requestId)) return 'ignored'

    const hasDeliveredPrefix = current.lastContinuousDeliverySeq > 0
    const messages = current.messages.map((message) => {
      if (message.role === AiRoleEnum.ASSISTANT && message.request_id === requestId) {
        return {
          ...message,
          content: hasDeliveredPrefix ? current.streamingContent : messageText,
          delivery_state: hasDeliveredPrefix ? 'stopped' as const : null,
          settlement_pending: false,
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
      stopCommitPendingRequestId: current.stopCommitPendingRequestId === requestId
        ? ''
        : current.stopCommitPendingRequestId,
      sending: false,
      isStreaming: false,
      streamingContent: '',
      lastContinuousDeliverySeq: 0,
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
    return 'applied'
  }

  function confirmStopped(
    conversationId: number,
    requestId: string,
    assistantMessageId: number,
    settlementPending: boolean,
  ) {
    const current = getOrCreate(conversationId)
    if (!Number.isSafeInteger(assistantMessageId) || assistantMessageId <= 0) return false
    const hasAssistant = current.messages.some((message) => (
      message.role === AiRoleEnum.ASSISTANT
      && (message.request_id === requestId || message.id === assistantMessageId)
    ))
    if (!hasAssistant) return false
    const matchingAssistant = current.messages.find((message) => (
      message.role === AiRoleEnum.ASSISTANT
      && (message.request_id === requestId || message.id === assistantMessageId)
    ))
    const alreadySettled = matchingAssistant?.delivery_state === 'stopped'
      && matchingAssistant.settlement_pending === false
      && matchingAssistant.id === assistantMessageId
      && !current.settlementPendingRequestIds.includes(requestId)
    const effectiveSettlementPending = alreadySettled ? false : settlementPending

    const userMessageId = current.messages.find((message) => (
      message.role === AiRoleEnum.USER && message.request_id === requestId && message.id > 0
    ))?.id ?? null
    const messages = current.messages.map((message) => {
      if (message.role === AiRoleEnum.ASSISTANT
        && (message.request_id === requestId || message.id === assistantMessageId)) {
        return {
          ...message,
          id: assistantMessageId,
          paired_message_id: userMessageId,
          delivery_state: 'stopped' as const,
          settlement_pending: effectiveSettlementPending,
          isStreaming: false,
          request_id: requestId,
          updated_at: nowText(),
        }
      }
      if (message.role === AiRoleEnum.USER && message.request_id === requestId) {
        return { ...message, paired_message_id: assistantMessageId }
      }
      return message
    })
    const session: ConversationSession = {
      ...current,
      messages,
      pendingRequestId: current.pendingRequestId === requestId ? '' : current.pendingRequestId,
      stopCommitPendingRequestId: current.stopCommitPendingRequestId === requestId
        ? ''
        : current.stopCommitPendingRequestId,
      sending: current.pendingRequestId === requestId ? false : current.sending,
      isStreaming: current.pendingRequestId === requestId ? false : current.isStreaming,
      streamingContent: current.pendingRequestId === requestId ? '' : current.streamingContent,
      canceledRequestIds: [...current.canceledRequestIds.filter((id) => id !== requestId), requestId].slice(-20),
      settlementPendingRequestIds: effectiveSettlementPending
        ? [...current.settlementPendingRequestIds.filter((id) => id !== requestId), requestId].slice(-20)
        : current.settlementPendingRequestIds.filter((id) => id !== requestId),
      updatedAt: Date.now(),
    }
    commitSession(sessions.value, conversationId, session)
    commit()
    return true
  }

  function settleStopped(conversationId: number, requestId: string, assistantMessageId: number) {
    return confirmStopped(conversationId, requestId, assistantMessageId, false)
  }

  function recoverMessages(
    conversationId: number,
    messages: Message[],
    nextMessageId: number,
    hasMoreMessages: boolean,
    requestId?: string,
  ) {
    const current = getOrCreate(conversationId)
    const recoveredRequestId = requestId && /\S/.test(requestId) ? requestId : undefined
    if (!recoveredRequestId && current.pendingRequestId) {
      const activePlaceholder = current.messages.find((message) => (
        message.role === AiRoleEnum.ASSISTANT
        && message.request_id === current.pendingRequestId
        && message.isStreaming === true
      ))
      const terminalReplyVisible = activePlaceholder?.paired_message_id !== null
        && activePlaceholder?.paired_message_id !== undefined
        && messages.some((message) => (
          message.role === AiRoleEnum.ASSISTANT
          && message.paired_message_id === activePlaceholder.paired_message_id
        ))
      if (activePlaceholder && !terminalReplyVisible) {
        recoverAcceptedMessages(
          conversationId,
          messages,
          nextMessageId,
          hasMoreMessages,
          current.pendingRequestId,
        )
        return
      }
    }
    const knownRecoveredAssistantId = recoveredRequestId
      ? current.messages.find((message) => (
          message.role === AiRoleEnum.ASSISTANT && message.request_id === recoveredRequestId
        ))?.id
      : undefined
    const recoveredAssistantIndex = recoveredRequestId
      ? (() => {
          if (knownRecoveredAssistantId !== undefined && knownRecoveredAssistantId > 0) {
            const exact = messages.findIndex((message) => message.id === knownRecoveredAssistantId)
            if (exact >= 0) return exact
          }
          for (let index = messages.length - 1; index >= 0; index--) {
            if (messages[index]?.role === AiRoleEnum.ASSISTANT) return index
          }
          return -1
        })()
      : -1
    const recoveredAssistant = recoveredAssistantIndex >= 0
      ? messages[recoveredAssistantIndex]
      : undefined
    const activeRequestId = current.pendingRequestId
    const preserveActiveRequest = Boolean(
      recoveredRequestId && activeRequestId && activeRequestId !== recoveredRequestId,
    )
    const authoritativeIds = new Set(messages.map((message) => message.id))
    const authoritativeMessages = messages.map((message, index) => {
      if (index === recoveredAssistantIndex && recoveredRequestId) {
        return { ...message, request_id: recoveredRequestId }
      }
      if (preserveActiveRequest) {
        const localActiveMessage = current.messages.find((candidate) => (
          candidate.id === message.id && candidate.request_id === activeRequestId
        ))
        if (localActiveMessage) return { ...message, request_id: activeRequestId }
      }
      return message
    })
    const activeMessages = preserveActiveRequest
      ? current.messages.filter((message) => (
          message.request_id === activeRequestId && !authoritativeIds.has(message.id)
        ))
      : []
    const recoveredIsStopped = recoveredAssistant?.delivery_state === 'stopped'
    const recoveredSettlementPending = recoveredIsStopped
      && recoveredAssistant?.settlement_pending === true
    const canceledRequestIds = recoveredRequestId
      ? recoveredIsStopped
        ? [...current.canceledRequestIds.filter((id) => id !== recoveredRequestId), recoveredRequestId].slice(-20)
        : current.canceledRequestIds.filter((id) => id !== recoveredRequestId)
      : current.canceledRequestIds
    const settlementPendingRequestIds = recoveredRequestId
      ? recoveredSettlementPending
        ? [
            ...current.settlementPendingRequestIds.filter((id) => id !== recoveredRequestId),
            recoveredRequestId,
          ].slice(-20)
        : current.settlementPendingRequestIds.filter((id) => id !== recoveredRequestId)
      : current.settlementPendingRequestIds

    commitSession(sessions.value, conversationId, {
      ...current,
      messages: [...authoritativeMessages, ...activeMessages],
      nextMessageId,
      hasMoreMessages,
      loadingMessages: false,
      sending: preserveActiveRequest ? current.sending : false,
      isStreaming: preserveActiveRequest ? current.isStreaming : false,
      pendingRequestId: preserveActiveRequest ? current.pendingRequestId : '',
      stopCommitPendingRequestId: current.stopCommitPendingRequestId === recoveredRequestId
        || recoveredRequestId === undefined
        ? ''
        : current.stopCommitPendingRequestId,
      streamingContent: preserveActiveRequest ? current.streamingContent : '',
      lastContinuousDeliverySeq: preserveActiveRequest ? current.lastContinuousDeliverySeq : 0,
      canceledRequestIds,
      settlementPendingRequestIds,
      updatedAt: Date.now(),
    })
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
    beginAcceptedReply,
    beginStopping,
    markUserMessage,
    appendDelta,
    complete,
    fail,
    confirmStopped,
    settleStopped,
    recoverMessages,
    recoverAcceptedMessages,
    setMessageLiked,
    isCanceled,
    remove,
  }
}
