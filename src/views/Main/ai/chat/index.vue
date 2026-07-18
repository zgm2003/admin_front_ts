<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { ElNotification } from 'element-plus'
import { AiMessageApi, type AiChatAttachment } from '@/api/ai/messages'
import { AiChatApi, createAiRequestId } from '@/api/ai/chat'
import { useCopy } from '@/hooks/useCopy'
import { useIsMobile } from '@/hooks/useResponsive'
import AgentList from './components/AgentList/index.vue'
import ConversationDrawer from './components/ConversationDrawer/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'
import { useAgents, useConversations, useConversationSessions, useConversationSocket } from './composables'
import type { Agent, Conversation, Message } from './composables/types'

const { t } = useI18n()
const { copy } = useCopy()
const isMobile = useIsMobile()

const MESSAGE_PAGE_SIZE = 50

interface ScrollbarRef {
  wrapRef?: HTMLElement
  setScrollTop: (value: number) => void
}

const messageInputRef = shallowRef<InstanceType<typeof MessageInput> | null>(null)
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
  upsertConversation,
  touchConversation,
} = useConversations()

const sessions = useConversationSessions()

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
    const response = await AiMessageApi.list({ conversation_id: conversationId, limit: MESSAGE_PAGE_SIZE })
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
    const response = await AiMessageApi.list({
      conversation_id: conversationId,
      before_id: session.nextMessageId || undefined,
      limit: MESSAGE_PAGE_SIZE,
    })
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

function firstTitle(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ')
  return normalized.length > 30 ? normalized.slice(0, 30) : normalized
}

function touchActiveConversation(conversationId: number, content: string) {
  const now = new Date().toISOString()
  const conversation = conversations.value.find((item) => item.id === conversationId)
  if (!conversation || !selectedAgent.value) return

  touchConversation(conversationId, {
    title: conversation.title || firstTitle(content),
    last_message_at: now,
    updated_at: now,
  })
}

async function ensureConversation(content: string) {
  if (currentConversationId.value) return currentConversationId.value

  const agentId = selectedAgentId.value
  const agent = selectedAgent.value
  if (!agentId || !agent) throw new Error(t('aiChat.selectAgentFirst'))

  const conversationId = await createConversation(agentId, firstTitle(content))
  const now = new Date().toISOString()
  const created = conversations.value.find((item) => item.id === conversationId) ?? {
    id: conversationId,
    agent_id: agentId,
    agent_name: agent.name,
    title: firstTitle(content),
    last_message_at: now,
    created_at: now,
    updated_at: now,
  }
  upsertConversation(created)
  currentConversationId.value = conversationId
  setSelectedConversationForAgent(agentId, conversationId)
  sessions.getOrCreate(conversationId)
  return conversationId
}

async function handleSendMessage(content: string, attachments?: AiChatAttachment[], runtimeParams?: Record<string, number>) {
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
    touchActiveConversation(conversationId, content)
    scrollToBottom()

    const response = await AiMessageApi.send({ conversation_id: conversationId, content, request_id: requestId, attachments, runtime_params: runtimeParams })
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
    await AiChatApi.cancel({ conversation_id: conversationId, request_id: requestId })
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

useConversationSocket({
  onStart(payload) {
    if (!sessions.isCanceled(payload.conversation_id, payload.request_id)) sessions.markUserMessage(payload.conversation_id, payload.request_id, payload.user_message_id)
  },
  onDelta(payload) {
    if (sessions.isCanceled(payload.conversation_id, payload.request_id)) return
    sessions.appendDelta(payload.conversation_id, payload.request_id, payload.delta)
    if (currentConversationId.value === payload.conversation_id) scrollToBottom()
  },
  onCompleted(payload) {
    if (sessions.isCanceled(payload.conversation_id, payload.request_id)) return
    sessions.complete(payload.conversation_id, payload.request_id, payload.assistant_message_id)
    touchConversation(payload.conversation_id, { last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
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
})

onMounted(async () => {
  await loadAgents()
  const agentId = selectedAgentId.value
  const agent = agents.value.find((item) => item.id === agentId)
  if (agent) await handleSelectAgent(agent)
})
</script>

<template>
  <div class="chat-container">
    <AgentList
      v-show="!isMobile || !selectedAgentId"
      :agents="agents"
      :loading="agentsLoading"
      :selected-id="selectedAgentId"
      @select="handleSelectAgent"
    />

    <main
      v-show="!isMobile || selectedAgentId"
      class="main-area"
    >
      <header class="main-header">
        <el-button
          v-if="isMobile"
          text
          class="back-btn"
          @click="handleBackToAgentList"
        >
          <el-icon :size="20">
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div class="header-content">
          <span class="header-title">{{ currentConversation?.title || selectedAgent?.name || t('aiChat.welcome') }}</span>
          <span
            v-if="selectedAgent"
            class="header-agent"
          >{{ selectedAgent.name }}</span>
        </div>
      </header>

      <el-scrollbar
        :ref="setMessageScrollRef"
        class="message-area"
        @scroll="handleMessageScroll"
      >
        <div
          v-if="switchingAgent"
          class="welcome-area"
        >
          <el-icon
            class="is-loading"
            :size="32"
            color="var(--el-color-primary)"
          >
            <Loading />
          </el-icon>
        </div>

        <div
          v-else-if="selectedAgentId && messages.length === 0 && !messagesLoading"
          class="welcome-area"
        >
          <div class="welcome-content">
            <el-avatar
              :size="64"
              class="welcome-avatar"
            >
              <img
                v-if="selectedAgent?.avatar"
                :src="selectedAgent.avatar"
                :alt="selectedAgent.name"
              >
              {{ selectedAgent?.name?.charAt(0) || '?' }}
            </el-avatar>
            <h1 class="welcome-title">
              {{ selectedAgent?.name }}
            </h1>
            <p class="welcome-tip">
              {{ selectedAgent?.description || t('aiChat.welcomeTip') }}
            </p>
          </div>
        </div>

        <div
          v-else-if="!selectedAgentId && agents.length > 0"
          class="welcome-area"
        >
          <div class="welcome-content">
            <h1 class="welcome-title">
              {{ t('aiChat.welcome') }}
            </h1>
            <p class="welcome-tip">
              {{ t('aiChat.selectAgentFirst') }}
            </p>
          </div>
        </div>

        <div
          v-else-if="!agentsLoading && agents.length === 0"
          class="welcome-area"
        >
          <p class="welcome-tip">
            {{ t('aiChat.noAgentTip') }}
          </p>
        </div>

        <div
          v-if="messagesLoadingMore"
          class="history-tip"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>
        <div
          v-else-if="!messagesHasMore && messages.length > 0"
          class="history-tip"
        >
          {{ t('aiChat.noMoreHistory') }}
        </div>

        <MessageList
          v-if="messages.length > 0 || messagesLoading"
          :messages="messages"
          :loading="messagesLoading"
          :sending="sending"
          @copy="handleCopyMessage"
        />
      </el-scrollbar>

      <MessageInput
        ref="messageInputRef"
        :sending="sending"
        :disabled="!selectedAgentId"
        :is-streaming="isStreaming"
        :show-history-btn="true"
        @send="handleSendMessage"
        @stop="handleStopGeneration"
        @open-history="handleOpenDrawer"
      />
    </main>

    <ConversationDrawer
      v-model:visible="showConversationDrawer"
      :conversations="conversations"
      :loading="conversationsLoading"
      :loading-more="conversationsLoadingMore"
      :has-more="conversationsHasMore"
      :current-id="currentConversationId"
      :agent-name="selectedAgent?.name"
      @select="selectConversation"
      @create="handleCreateConversation"
      @rename="handleRenameConversation"
      @delete="handleDeleteConversation"
      @load-more="loadMoreConversations"
      @search="searchConversations"
    />

    <AppDialog
      v-model="showRenameDialog"
      :title="t('aiChat.renameTitle')"
      width="400px"
      mobile-width="94vw"
      body-padding="24px"
      class="rename-dialog"
    >
      <el-input
        v-model="renameTitle"
        :placeholder="t('aiChat.newTitle')"
        maxlength="50"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showRenameDialog = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="confirmRenameConversation"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color-page);
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.main-header {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.back-btn {
  margin-left: -8px;
}

.header-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-agent {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.message-area {
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color-page);
}

.message-area :deep(.el-scrollbar__view) {
  min-height: 100%;
}

.welcome-area {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.welcome-content {
  width: min(420px, 100%);
  text-align: center;
}

.welcome-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.welcome-title {
  margin: 18px 0 8px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 650;
}

.welcome-tip,
.history-tip {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.history-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
}

@media (max-width: 768px) {
  .chat-container {
    display: block;
  }

  .main-area {
    height: 100%;
  }
}
</style>
