import { computed, nextTick, onMounted, onUnmounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { insufficientBalanceFromFailedEvent } from '@/api/ai/billing-error'
import { assertAiStoppingAcknowledgment } from '@/api/ai/chat'
import { type AIRuntimeParams, type AiMessageAttachmentRequest } from '@/api/ai/messages'
import { createAiRequestId } from '@/api/ai/request-id'
import { useAppKernel } from '@/app/injection'
import { createAIChatWorkflow } from '@/features/ai-chat/workflow'
import { renderAiBillingActions } from '@/features/ai-billing/notification'
import { useCopy } from '@/hooks/useCopy'
import { useIsMobile } from '@/hooks/useResponsive'
import { isApiError } from '@/modules/http/error'
import {
  createActionRequestIdentityRegistry,
  useAgents,
  useConversations,
  useConversationSessions,
  useMessageSelection,
  useMessageSpeech,
} from './composables'
import type { Agent, Conversation, Message } from './composables/types'
import { createConversationTitle } from './conversation-title'
import { executeStopRequest } from './stop-delivery'
import type { Attachment } from './components/MessageInput/use-attachments'
import {
  prepareCapabilityTransition,
  type CapabilityConflicts,
  type ComposerCapabilityState,
} from './components/MessageInput/capability-transition'

export function useChatPage() {
  const { t } = useI18n()
  const { copy } = useCopy()
  const isMobile = useIsMobile()

  interface MessageInputHandle {
    clear: () => void
    focus: () => void
    getCapabilityState: () => ComposerCapabilityState
    clearCapabilityConflicts: (conflicts: CapabilityConflicts) => void
  }

  interface ScrollbarRef {
    wrapRef?: HTMLElement
    setScrollTop: (value: number) => void
  }

  const messageInputRef = shallowRef<MessageInputHandle | null>(null)
  const messageScrollRef = shallowRef<ScrollbarRef | null>(null)
  const currentConversationId = shallowRef<number | null>(null)
  const showConversationDrawer = shallowRef(false)
  const switchingAgent = shallowRef(false)
  const selectedConversationByAgent = shallowRef(new Map<number, number | null>())
  const showRenameDialog = shallowRef(false)
  const renameConversationId = shallowRef(0)
  const renameTitle = shallowRef('')
  const interactionPending = shallowRef(false)
  const actionRequestIdentities = createActionRequestIdentityRegistry()

  const {
    agents,
    selectedAgentId,
    loading: agentsLoading,
    selectedAgent,
    loadAgents,
    selectAgent,
  } = useAgents()

  const sessions = useConversationSessions()
  const messageSelection = useMessageSelection()
  const messageSpeech = useMessageSpeech()
  const chatWorkflow = createAIChatWorkflow({
    realtime: useAppKernel().realtime,
    handlers: {
      onStart(payload) {
        sessions.markUserMessage(payload.conversation_id, payload.request_id, payload.user_message_id)
      },
      async onDelta(payload) {
        const result = sessions.appendDelta(
          payload.conversation_id,
          payload.request_id,
          payload.delivery_seq,
          payload.delta,
        )
        if (result === 'gap') {
          await chatWorkflow.recoverActiveRequest(payload.conversation_id, payload.request_id)
          return
        }
        if (result === 'applied' && currentConversationId.value === payload.conversation_id) {
          scrollToBottom()
        }
      },
      onCompleted(payload) {
        sessions.complete(payload.conversation_id, payload.request_id, payload.assistant_message_id)
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onFailed(payload) {
        const result = sessions.fail(payload.conversation_id, payload.request_id, payload.msg)
        if (result === 'ignored') return
        const actions = insufficientBalanceFromFailedEvent(payload)
        ElNotification.error({
          message: actions
            ? renderAiBillingActions(payload.msg, actions, {
              walletLabel: t('wallet.balance'),
              rechargeLabel: t('wallet.recharge'),
            })
            : payload.msg,
          duration: actions ? 0 : undefined,
        })
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onCanceled(payload) {
        sessions.settleStopped(
          payload.conversation_id,
          payload.request_id,
          payload.assistant_message_id,
        )
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onMessagesRecovered(conversationId, response, requestId) {
        sessions.recoverMessages(
          conversationId,
          responseToMessages(response.list),
          response.next_id,
          response.has_more,
          requestId,
        )
        if (currentConversationId.value === conversationId) scrollToBottom()
      },
      onReplyAccepted(response) {
        sessions.beginAcceptedReply(
          response.conversation_id,
          response.request_id,
          response.user_message_id,
        )
        if (currentConversationId.value === response.conversation_id) scrollToBottom()
      },
      onAcceptedMessagesRecovered(conversationId, response, requestId) {
        sessions.recoverAcceptedMessages(
          conversationId,
          responseToMessages(response.list),
          response.next_id,
          response.has_more,
          requestId,
        )
        if (currentConversationId.value === conversationId) scrollToBottom()
      },
      onFeedbackChanged(conversationId, messageId, liked) {
        sessions.setMessageLiked(conversationId, messageId, liked)
      },
    },
  })

  const {
    conversations,
    loaded: conversationsLoaded,
    searched: conversationsSearched,
    loading: conversationsLoading,
    loadingMore: conversationsLoadingMore,
    hasMore: conversationsHasMore,
    loadConversations,
    loadMore: loadMoreConversations,
    create: createConversation,
    remove: removeConversation,
    rename: renameConversation,
    search: searchConversations,
    setUnreadCount: setConversationUnreadCount,
  } = useConversations(chatWorkflow)

  const currentConversation = computed(() => conversations.value.find((conversation) => conversation.id === currentConversationId.value))
  const currentSession = computed(() => sessions.get(currentConversationId.value))
  const messages = computed(() => currentSession.value?.messages ?? [])
  const messagesLoading = computed(() => currentSession.value?.loadingMessages ?? false)
  const messagesLoadingMore = computed(() => currentSession.value?.loadingMoreMessages ?? false)
  const messagesHasMore = computed(() => currentSession.value?.hasMoreMessages ?? false)
  const sending = computed(() => currentSession.value?.sending ?? false)
  const isStreaming = computed(() => currentSession.value?.isStreaming ?? false)
  const isStopping = computed(() => Boolean(currentSession.value?.stopCommitPendingRequestId))
  const activeRequestId = computed(() => currentSession.value?.pendingRequestId ?? '')
  const interactionDisabled = computed(() => (
    sessions.activeStreams.value > 0 || interactionPending.value
  ))

  function setSelectedConversationForAgent(agentId: number, conversationId: number | null) {
    const next = new Map(selectedConversationByAgent.value)
    next.set(agentId, conversationId)
    selectedConversationByAgent.value = next
  }

  function setMessageScrollRef(el: unknown) {
    messageScrollRef.value = el as ScrollbarRef | null
  }

  function setMessageInputRef(el: unknown) {
    messageInputRef.value = el as MessageInputHandle | null
  }

  function scrollToBottom() {
    nextTick(() => {
      const wrap = messageScrollRef.value?.wrapRef
      if (wrap) messageScrollRef.value?.setScrollTop(wrap.scrollHeight)
    })
  }

  function responseToMessages(list: Message[]) {
    return [...list]
  }

  function latestAssistantMessageId(list: readonly Message[]) {
    let latest: number | null = null
    for (const message of list) {
      if (message.role !== 2 || message.id <= 0) continue
      if (latest === null || message.id > latest) latest = message.id
    }
    return latest
  }

  async function markVisibleMessagesRead(conversationId: number) {
    const conversation = conversations.value.find((item) => item.id === conversationId)
    if (!conversation || conversation.unread_count === 0) return
    const session = sessions.get(conversationId)
    const messageId = session ? latestAssistantMessageId(session.messages) : null
    if (messageId === null) return
    try {
      const result = await chatWorkflow.advanceReadCursor.mutate({
        conversation_id: conversationId,
        message_id: messageId,
      })
      if (result.kind === 'canceled') return
      setConversationUnreadCount(result.data.conversation_id, result.data.unread_count)
    } catch (error) {
      if (isApiError(error) && error.kind === 'canceled') return
      ElNotification.error({
        message: error instanceof Error ? error.message : t('http.requestFailed'),
      })
    }
  }

  async function recoverInteraction(conversationId: number) {
    try {
      await chatWorkflow.recoverConversation(conversationId, { markRead: true })
    } catch (error) {
      ElNotification.error({
        message: error instanceof Error ? error.message : t('http.requestFailed'),
      })
    }
  }

  async function loadConversationMessages(conversationId: number, force = false) {
    const session = sessions.getOrCreate(conversationId)
    if (session.isStreaming || session.sending) return false
    if (!force && session.messages.length > 0) return true

    sessions.setLoading(conversationId, true)
    try {
      const response = await chatWorkflow.loadMessages(conversationId)
      sessions.replaceMessages(conversationId, responseToMessages(response.list), response.next_id, response.has_more)
      scrollToBottom()
      return true
    } catch (error) {
      if (isApiError(error) && error.kind === 'canceled') return false
      ElNotification.error({
        message: error instanceof Error ? error.message : t('http.requestFailed'),
      })
      return false
    } finally {
      sessions.setLoading(conversationId, false)
    }
  }

  async function loadMoreMessages() {
    const conversationId = currentConversationId.value
    if (!conversationId) return

    const session = sessions.get(conversationId)
    if (!session || session.loadingMoreMessages || !session.hasMoreMessages) return

    const wrap = messageScrollRef.value?.wrapRef
    const oldHeight = wrap?.scrollHeight ?? 0
    sessions.setLoadingMore(conversationId, true)
    try {
      const response = await chatWorkflow.loadMoreMessages(conversationId, session.nextMessageId)
      if (!response) return
      sessions.prependMessages(conversationId, responseToMessages(response.list), response.next_id, response.has_more)
      nextTick(() => {
        const newHeight = wrap?.scrollHeight ?? 0
        if (wrap) messageScrollRef.value?.setScrollTop(newHeight - oldHeight)
      })
    } finally {
      sessions.setLoadingMore(conversationId, false)
    }
  }

  function handleMessageScroll(event: { scrollTop: number }) {
    if (event.scrollTop < 50) void loadMoreMessages()
  }

  async function selectConversation(conversation: Conversation) {
    messageSpeech.stop()
    messageSelection.clear()
    currentConversationId.value = conversation.id
    chatWorkflow.setActiveConversation(conversation.id)
    if (selectedAgentId.value) setSelectedConversationForAgent(selectedAgentId.value, conversation.id)
    sessions.getOrCreate(conversation.id)
    // A cached non-current session can be stale because background completions
    // only refresh the authoritative conversation list. Reload before advancing
    // the read cursor so the newly completed reply is visible first.
    const loaded = await loadConversationMessages(conversation.id, true)
    if (!loaded || currentConversationId.value !== conversation.id) return
    await markVisibleMessagesRead(conversation.id)
    scrollToBottom()
  }

  async function selectDefaultConversation(agentId: number) {
    const savedConversationId = selectedConversationByAgent.value.get(agentId)
    const savedConversation = conversations.value.find((conversation) => conversation.id === savedConversationId)
    const nextConversation = savedConversation ?? conversations.value[0]

    if (nextConversation) {
      await selectConversation(nextConversation)
      return
    }

    currentConversationId.value = null
    chatWorkflow.setActiveConversation(null)
    setSelectedConversationForAgent(agentId, null)
  }

  async function handleSelectAgent(agent: Agent) {
    if (selectedAgentId.value === agent.id && conversations.value.length > 0) return

    const composer = messageInputRef.value
    if (composer) {
      const allowed = await prepareCapabilityTransition({
        state: composer.getCapabilityState(),
        target: agent.capabilities,
        confirm: async () => {
          await ElMessageBox.confirm(
            t('aiChat.capabilitySwitchConfirm'),
            t('aiChat.capabilitySwitchTitle'),
            { type: 'warning' },
          )
        },
        clear: composer.clearCapabilityConflicts,
      })
      if (!allowed) return
    }

    messageSpeech.stop()
    messageSelection.clear()
    chatWorkflow.setActiveConversation(null)
    switchingAgent.value = true
    selectAgent(agent)
    currentConversationId.value = selectedConversationByAgent.value.get(agent.id) ?? null

    try {
      await loadConversations(agent.id)
      if (selectedAgentId.value !== agent.id) return
      await selectDefaultConversation(agent.id)
    } finally {
      if (selectedAgentId.value === agent.id) switchingAgent.value = false
      nextTick(() => messageInputRef.value?.focus())
    }
  }

  function handleCreateConversation() {
    messageSpeech.stop()
    messageSelection.clear()
    currentConversationId.value = null
    chatWorkflow.setActiveConversation(null)
    if (selectedAgentId.value) setSelectedConversationForAgent(selectedAgentId.value, null)
    nextTick(() => messageInputRef.value?.focus())
  }

  async function handleDeleteConversation(conversation: Conversation) {
    const removed = await removeConversation(conversation.id)
    if (!removed) return

    sessions.remove(conversation.id)
    if (currentConversationId.value === conversation.id) {
      messageSpeech.stop()
      messageSelection.clear()
      currentConversationId.value = null
      chatWorkflow.setActiveConversation(null)
      if (selectedAgentId.value) setSelectedConversationForAgent(selectedAgentId.value, null)
    }
  }

  async function ensureConversation(content: string) {
    if (currentConversationId.value) return currentConversationId.value

    const agentId = selectedAgentId.value
    const agent = selectedAgent.value
    if (!agentId || !agent) throw new Error(t('aiChat.selectAgentFirst'))

    const conversationId = await createConversation(agentId, createConversationTitle(content))
    const created = conversations.value.find((item) => item.id === conversationId)
    if (!created) throw new Error('Created AI conversation is missing from the authoritative list')
    currentConversationId.value = conversationId
    chatWorkflow.setActiveConversation(conversationId)
    setSelectedConversationForAgent(agentId, conversationId)
    sessions.getOrCreate(conversationId)
    return conversationId
  }

  async function handleSendMessage(content: string, attachments?: Attachment[], runtimeParams?: AIRuntimeParams) {
    if (!selectedAgentId.value) {
      ElNotification.warning({ message: t('aiChat.selectAgentFirst') })
      return
    }
    if (sending.value || isStreaming.value || isStopping.value) return

    const requestId = createAiRequestId()
    let conversationId = 0
    try {
      conversationId = await ensureConversation(content)
      const requestAttachments = attachments?.map((attachment) => attachment.request)
      const previewAttachments = attachments?.map((attachment) => attachment.preview)
      const started = sessions.beginSend(
        conversationId,
        requestId,
        content,
        previewAttachments,
        runtimeParams,
      )
      if (!started) return
      messageInputRef.value?.clear()
      scrollToBottom()

      const result = await chatWorkflow.sendMessage.mutate({
        conversation_id: conversationId,
        content,
        request_id: requestId,
        attachments: requestAttachments,
        runtime_params: runtimeParams,
      })
      if (result.kind === 'canceled') return
      const response = result.data
      sessions.markUserMessage(conversationId, response.request_id, response.user_message_id)
    } catch (error) {
      if (conversationId > 0) {
        sessions.fail(conversationId, requestId, error instanceof Error ? error.message : t('aiChat.sendFailed'))
      }
      ElNotification.error({ message: error instanceof Error ? error.message : t('aiChat.sendFailed') })
    }
  }

  async function handleStopGeneration() {
    const conversationId = currentConversationId.value
    const requestId = activeRequestId.value
    if (!conversationId || !requestId) return

    const deliveredSeq = sessions.beginStopping(conversationId, requestId)
    if (deliveredSeq === null) return
    const stopInput = Object.freeze({
      conversation_id: conversationId,
      request_id: requestId,
      delivered_seq: deliveredSeq,
    })
    try {
      const result = await executeStopRequest(
        stopInput,
        (input) => chatWorkflow.cancelMessage.mutate(input),
      )
      if (result.kind === 'canceled') {
        await chatWorkflow.recoverRequest(conversationId, requestId)
        return
      }
      const acknowledgment = assertAiStoppingAcknowledgment(
        result.data,
        conversationId,
        requestId,
      )
      if (acknowledgment.status === 'stopped') {
        const confirmed = sessions.confirmStopped(
          conversationId,
          requestId,
          acknowledgment.assistant_message_id,
          acknowledgment.settlement_pending,
        )
        if (!confirmed) await chatWorkflow.recoverRequest(conversationId, requestId)
        return
      }
      await chatWorkflow.recoverRequest(conversationId, requestId)
    } catch (error) {
      try {
        await chatWorkflow.recoverRequest(conversationId, requestId)
      } catch (recoveryError) {
        ElNotification.error({ message: recoveryError instanceof Error ? recoveryError.message : t('aiChat.stopFailed') })
      }
      ElNotification.error({ message: error instanceof Error ? error.message : t('aiChat.stopFailed') })
    }
  }

  async function handleOpenDrawer() {
    showConversationDrawer.value = true
    if (selectedAgentId.value && !conversationsLoaded.value && !conversationsSearched.value) {
      await loadConversations(selectedAgentId.value)
    }
  }

  async function handleRenameConversation(conversation: Conversation) {
    renameConversationId.value = conversation.id
    renameTitle.value = conversation.title || ''
    showRenameDialog.value = true
  }

  async function confirmRenameConversation() {
    if (!renameConversationId.value) return
    await renameConversation(renameConversationId.value, renameTitle.value)
    showRenameDialog.value = false
  }

  async function handleCopyMessage(message: Message) {
    await copy(message.content)
  }

  async function handleEditMessage(
    message: Message,
    payload: { content: string; attachments?: AiMessageAttachmentRequest[] },
  ) {
    const conversationId = currentConversationId.value
    if (!conversationId || interactionDisabled.value || message.role !== 1) return
    const fingerprint = JSON.stringify([
      'revision', conversationId, message.id, payload.content,
      payload.attachments === undefined ? 'preserve' : payload.attachments,
    ])
    const requestId = actionRequestIdentities.acquire(fingerprint)
    interactionPending.value = true
    try {
      const result = await chatWorkflow.reviseMessage.mutate({
        conversation_id: conversationId,
        message_id: message.id,
        content: payload.content,
        request_id: requestId,
        attachments: payload.attachments,
      })
      if (result.kind === 'canceled') return
      actionRequestIdentities.settle(fingerprint)
      scrollToBottom()
    } catch (error) {
      const accepted = sessions.get(conversationId)?.pendingRequestId === requestId
      actionRequestIdentities.settle(fingerprint, accepted ? undefined : error)
      if (!accepted) await recoverInteraction(conversationId)
      ElNotification.error({
        message: accepted
          ? t('http.requestFailed')
          : error instanceof Error ? error.message : t('aiChat.editFailed'),
      })
    } finally {
      interactionPending.value = false
    }
  }

  async function handleRegenerateMessage(message: Message) {
    const conversationId = currentConversationId.value
    if (!conversationId || interactionDisabled.value || message.role !== 2) return
    const fingerprint = JSON.stringify(['regeneration', conversationId, message.id])
    const requestId = actionRequestIdentities.acquire(fingerprint)
    interactionPending.value = true
    try {
      const result = await chatWorkflow.regenerateMessage.mutate({
        conversation_id: conversationId,
        message_id: message.id,
        request_id: requestId,
      })
      if (result.kind === 'canceled') return
      actionRequestIdentities.settle(fingerprint)
      scrollToBottom()
    } catch (error) {
      const accepted = sessions.get(conversationId)?.pendingRequestId === requestId
      actionRequestIdentities.settle(fingerprint, accepted ? undefined : error)
      if (!accepted) await recoverInteraction(conversationId)
      ElNotification.error({
        message: accepted
          ? t('http.requestFailed')
          : error instanceof Error ? error.message : t('aiChat.regenerateFailed'),
      })
    } finally {
      interactionPending.value = false
    }
  }

  function handleDeleteMessage(message: Message) {
    if (interactionDisabled.value || message.id <= 0) return
    messageSelection.open(message)
  }

  async function confirmDeleteMessages() {
    const conversationId = currentConversationId.value
    const ids = [...messageSelection.selectedIds.value]
    if (!conversationId || ids.length === 0 || interactionDisabled.value) return
    try {
      await ElMessageBox.confirm(t('common.confirmBatchDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }

    interactionPending.value = true
    try {
      const result = await chatWorkflow.deleteMessages.mutate({ conversation_id: conversationId, ids })
      if (result.kind === 'canceled') return
      messageSelection.clear()
      ElNotification.success({ message: t('common.success.delete') })
    } catch (error) {
      await recoverInteraction(conversationId)
      ElNotification.error({
        message: error instanceof Error ? error.message : t('common.fail.operation'),
      })
    } finally {
      interactionPending.value = false
    }
  }

  async function handleMessageFeedback(message: Message, liked: boolean) {
    const conversationId = currentConversationId.value
    if (!conversationId || message.run_id === null) return
    try {
      await chatWorkflow.setMessageFeedback.mutate({
        conversation_id: conversationId,
        message_id: message.id,
        run_id: message.run_id,
        liked,
        previous_liked: message.liked,
      })
    } catch (error) {
      ElNotification.error({
        message: error instanceof Error ? error.message : t('common.fail.operation'),
      })
    }
  }

  function handleStartSpeech(message: Message) {
    messageSpeech.start(message.id, message.content)
  }

  function handleBackToAgentList() {
    messageSpeech.stop()
    messageSelection.clear()
    currentConversationId.value = null
    chatWorkflow.setActiveConversation(null)
    selectedAgentId.value = null
  }

  onMounted(async () => {
    await loadAgents()
    const agentId = selectedAgentId.value
    const agent = agents.value.find((item) => item.id === agentId)
    if (agent) await handleSelectAgent(agent)
  })

  onUnmounted(() => {
    messageSpeech.dispose()
    chatWorkflow.dispose()
  })

  return {
    t, isMobile, agents, agentsLoading, selectedAgentId, selectedAgent,
    currentConversation, currentConversationId, messages, messagesLoading,
    messagesLoadingMore, messagesHasMore, sending, isStreaming, isStopping, switchingAgent,
    interactionDisabled, messageSelection, messageSpeech, interactionPending,
    setMessageInputRef, showConversationDrawer, conversations, conversationsLoading,
    conversationsLoadingMore, conversationsHasMore, showRenameDialog, renameTitle,
    setMessageScrollRef, handleMessageScroll, handleSelectAgent, handleCopyMessage,
    handleSendMessage, handleStopGeneration, handleOpenDrawer, selectConversation,
    handleCreateConversation, handleRenameConversation, handleDeleteConversation,
    loadMoreConversations, searchConversations, confirmRenameConversation,
    handleEditMessage, handleRegenerateMessage, handleDeleteMessage, confirmDeleteMessages,
    handleMessageFeedback, handleStartSpeech, handleBackToAgentList,
  }
}
