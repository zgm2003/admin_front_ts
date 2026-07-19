import { computed, nextTick, onMounted, onUnmounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { type AiChatAttachment, type AIRuntimeParams } from '@/api/ai/messages'
import { createAiRequestId } from '@/api/ai/chat'
import { useAppKernel } from '@/app/injection'
import { createAIChatWorkflow } from '@/features/ai-chat/workflow'
import { useCopy } from '@/hooks/useCopy'
import { useIsMobile } from '@/hooks/useResponsive'
import { useAgents, useConversations, useConversationSessions } from './composables'
import type { Agent, Conversation, Message } from './composables/types'
import { createConversationTitle } from './conversation-title'

export function useChatPage() {
  const { t } = useI18n()
  const { copy } = useCopy()
  const isMobile = useIsMobile()

  interface MessageInputHandle {
    clear: () => void
    focus: () => void
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

  const {
    agents,
    selectedAgentId,
    loading: agentsLoading,
    selectedAgent,
    loadAgents,
    selectAgent,
  } = useAgents()

  const sessions = useConversationSessions()
  const chatWorkflow = createAIChatWorkflow({
    realtime: useAppKernel().realtime,
    handlers: {
      onStart(payload) {
        if (!sessions.isCanceled(payload.conversation_id, payload.request_id)) {
          sessions.markUserMessage(payload.conversation_id, payload.request_id, payload.user_message_id)
        }
      },
      onDelta(payload) {
        if (sessions.isCanceled(payload.conversation_id, payload.request_id)) return
        sessions.appendDelta(payload.conversation_id, payload.request_id, payload.delta)
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onCompleted(payload) {
        if (sessions.isCanceled(payload.conversation_id, payload.request_id)) return
        sessions.complete(payload.conversation_id, payload.request_id, payload.assistant_message_id)
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onFailed(payload) {
        if (sessions.isCanceled(payload.conversation_id, payload.request_id)) return
        sessions.fail(payload.conversation_id, payload.request_id, payload.msg)
        ElNotification.error({ message: payload.msg })
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onCanceled(payload) {
        sessions.cancel(payload.conversation_id, payload.request_id)
        if (currentConversationId.value === payload.conversation_id) scrollToBottom()
      },
      onMessagesRecovered(conversationId, response) {
        sessions.replaceMessages(
          conversationId,
          responseToMessages(response.list),
          response.next_id,
          response.has_more,
        )
        if (currentConversationId.value === conversationId) scrollToBottom()
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
  } = useConversations(chatWorkflow)

  const currentConversation = computed(() => conversations.value.find((conversation) => conversation.id === currentConversationId.value))
  const currentSession = computed(() => sessions.get(currentConversationId.value))
  const messages = computed(() => currentSession.value?.messages ?? [])
  const messagesLoading = computed(() => currentSession.value?.loadingMessages ?? false)
  const messagesLoadingMore = computed(() => currentSession.value?.loadingMoreMessages ?? false)
  const messagesHasMore = computed(() => currentSession.value?.hasMoreMessages ?? false)
  const sending = computed(() => currentSession.value?.sending ?? false)
  const isStreaming = computed(() => currentSession.value?.isStreaming ?? false)
  const activeRequestId = computed(() => currentSession.value?.pendingRequestId ?? '')

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

  async function loadConversationMessages(conversationId: number) {
    const session = sessions.getOrCreate(conversationId)
    if (session.messages.length > 0 || session.isStreaming || session.sending) return

    sessions.setLoading(conversationId, true)
    try {
      const response = await chatWorkflow.loadMessages(conversationId)
      sessions.replaceMessages(conversationId, responseToMessages(response.list), response.next_id, response.has_more)
      scrollToBottom()
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
    currentConversationId.value = conversation.id
    if (selectedAgentId.value) setSelectedConversationForAgent(selectedAgentId.value, conversation.id)
    sessions.getOrCreate(conversation.id)
    await loadConversationMessages(conversation.id)
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
    setSelectedConversationForAgent(agentId, null)
  }

  async function handleSelectAgent(agent: Agent) {
    if (selectedAgentId.value === agent.id && conversations.value.length > 0) return

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
    currentConversationId.value = null
    if (selectedAgentId.value) setSelectedConversationForAgent(selectedAgentId.value, null)
    nextTick(() => messageInputRef.value?.focus())
  }

  async function handleDeleteConversation(conversation: Conversation) {
    const removed = await removeConversation(conversation.id)
    if (!removed) return

    sessions.remove(conversation.id)
    if (currentConversationId.value === conversation.id) {
      currentConversationId.value = null
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
    setSelectedConversationForAgent(agentId, conversationId)
    sessions.getOrCreate(conversationId)
    return conversationId
  }

  async function handleSendMessage(content: string, attachments?: AiChatAttachment[], runtimeParams?: AIRuntimeParams) {
    if (!selectedAgentId.value) {
      ElNotification.warning({ message: t('aiChat.selectAgentFirst') })
      return
    }

    const requestId = createAiRequestId()
    let conversationId = 0
    try {
      conversationId = await ensureConversation(content)
      messageInputRef.value?.clear()
      sessions.beginSend(conversationId, requestId, content, attachments)
      scrollToBottom()

      const result = await chatWorkflow.sendMessage.mutate({
        conversation_id: conversationId,
        content,
        request_id: requestId,
        attachments,
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

    try {
      const result = await chatWorkflow.cancelMessage.mutate({ conversation_id: conversationId, request_id: requestId })
      if (result.kind === 'canceled') return
      sessions.cancel(conversationId, requestId)
    } catch (error) {
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

  function handleBackToAgentList() {
    currentConversationId.value = null
    selectedAgentId.value = null
  }

  onMounted(async () => {
    await loadAgents()
    const agentId = selectedAgentId.value
    const agent = agents.value.find((item) => item.id === agentId)
    if (agent) await handleSelectAgent(agent)
  })

  onUnmounted(() => chatWorkflow.dispose())

  return {
    t, isMobile, agents, agentsLoading, selectedAgentId, selectedAgent,
    currentConversation, currentConversationId, messages, messagesLoading,
    messagesLoadingMore, messagesHasMore, sending, isStreaming, switchingAgent,
    setMessageInputRef, showConversationDrawer, conversations, conversationsLoading,
    conversationsLoadingMore, conversationsHasMore, showRenameDialog, renameTitle,
    setMessageScrollRef, handleMessageScroll, handleSelectAgent, handleCopyMessage,
    handleSendMessage, handleStopGeneration, handleOpenDrawer, selectConversation,
    handleCreateConversation, handleRenameConversation, handleDeleteConversation,
    loadMoreConversations, searchConversations, confirmRenameConversation,
    handleBackToAgentList,
  }
}
