<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

import AgentList from './components/AgentList/index.vue'
import ConversationDrawer from './components/ConversationDrawer/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'

import {
  useConversations,
  findTodayConversation,
  useMessages,
  useAgents,
  useStreamChat,
  useChatSessionManager
} from './composables'
import type { Agent, Conversation } from './composables/types'
import type { Message } from './composables/types'
import type { ScrollRefApi } from './composables/useMessages'

const { t } = useI18n()
const isMobile = useIsMobile()

// ========== 状态管理 ==========
const currentConversationId = ref<number | null>(null)
const showConversationDrawer = ref(false)
const switchingAgent = ref(false)

// ========== Session Manager ==========
const sessionManager = useChatSessionManager()

// ========== Composables ==========
const {
  conversations,
  loaded,
  loading: conversationsLoading,
  loadingMore: conversationsLoadingMore,
  hasMore: conversationsHasMore,
  showArchived,
  loadConversations,
  loadMore: loadMoreConversations,
  rename: renameConversation,
  remove: removeConversation,
  archive: archiveConversation,
  toggleArchived,
  search: searchConversations
} = useConversations()

const {
  messages,
  loading: messagesLoading,
  loadingMore: messagesLoadingMore,
  hasMore: messagesHasMore,
  scrollRef: messageScrollRef,
  scrollToBottom,
  loadMessages: loadMessagesRaw,
  handleScroll: handleScrollRaw,
  copy: copyMessage,
  remove: removeMessage,
  feedback: feedbackMessage
} = useMessages()

const {
  agents,
  selectedAgentId,
  loading: agentsLoading,
  selectedAgent,
  loadAgents,
  selectAgent,
  getAgentModalities
} = useAgents()

// 包装 loadMessages 以便传入 conversationId
const loadMessages = () => loadMessagesRaw(currentConversationId.value)
const handleScroll = (e: { scrollTop: number }) => handleScrollRaw(e, currentConversationId.value)

const {
  sending,
  isStreaming,
  send: sendMessage,
  regenerate: regenerateMessage,
  editAndResend: editAndResendMessage,
  stop: stopGeneration
} = useStreamChat({
  messages,
  conversations,
  currentConversationId,
  selectedAgentId,
  selectedAgent,
  scrollToBottom,
  loadMessages,
  getActiveAgentId: () => selectedAgentId.value,
  getSession: (agentId: number) => sessionManager.getOrCreate(agentId),
  getRuntimeParams: () => messageInputRef.value?.getRequestParams?.() ?? {},
})

// ========== 计算属性 ==========
const currentConversation = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)
})

const currentModalities = computed(() => {
  return getAgentModalities(selectedAgentId.value) ?? undefined
})

const setMessageScrollRef = (el: unknown) => {
  messageScrollRef.value = el as ScrollRefApi | null
}

// ========== 挂起当前 agent 状态到 session ==========
const suspendCurrentAgent = () => {
  const agentId = selectedAgentId.value
  if (!agentId) return

  const session = sessionManager.getOrCreate(agentId)
  // 保存 UI 状态到 session
  session.conversationId = currentConversationId.value
  session.messages = [...messages.value]
  session.conversations = [...conversations.value]
  session.conversationsLoaded = loaded.value
  session.isStreaming = isStreaming.value
  session.sending = sending.value
}

// ========== 从 session 恢复 agent 状态到 UI ==========
const resumeAgent = (agentId: number) => {
  const session = sessionManager.resume(agentId)
  if (!session) return false

  currentConversationId.value = session.conversationId
  messages.value = [...session.messages]
  conversations.value = [...session.conversations]
  loaded.value = session.conversationsLoaded
  // 恢复流式状态
  isStreaming.value = session.isStreaming
  sending.value = session.sending

  if (session.isStreaming) {
    nextTick(() => scrollToBottom())
  }
  return true
}

// ========== 智能体选择处理（断点续连版） ==========
const handleSelectAgent = async (agent: Agent) => {
  if (selectedAgentId.value === agent.id) return

  switchingAgent.value = true

  // 1. 挂起当前 agent 的状态（不中断 SSE）
  suspendCurrentAgent()

  // 2. 切换到新 agent
  selectAgent(agent)

  // 3. 尝试从 session 恢复
  const restored = resumeAgent(agent.id)

  if (restored) {
    // 恢复成功，直接显示缓存的状态
    switchingAgent.value = false
    nextTick(() => {
      scrollToBottom()
      messageInputRef.value?.focus()
    })
    return
  }

  // 4. 没有缓存，正常加载
  currentConversationId.value = null
  messages.value = []

  try {
    await loadConversations({ agent_id: agent.id })

    // 确保还是当前 agent（防竞态）
    if (selectedAgentId.value !== agent.id) return

    // 初始化 session
    const session = sessionManager.getOrCreate(agent.id)
    session.conversations = [...conversations.value]
    session.conversationsLoaded = true

    const todayConv = findTodayConversation(conversations.value)
    if (todayConv) {
      currentConversationId.value = todayConv.id
      session.conversationId = todayConv.id
    }
  } catch {
    if (selectedAgentId.value !== agent.id) return
    currentConversationId.value = null
    messages.value = []
  } finally {
    if (selectedAgentId.value === agent.id) {
      switchingAgent.value = false
    }
  }

  nextTick(() => messageInputRef.value?.focus())
}

// ========== 会话抽屉处理 ==========
const handleOpenDrawer = async () => {
  showConversationDrawer.value = true
  if (selectedAgentId.value && !loaded.value) {
    await loadConversations({ agent_id: selectedAgentId.value })
  }
}

const handleSelectConversation = async (conv: Conversation) => {
  currentConversationId.value = conv.id
  // 同步到 session
  const agentId = selectedAgentId.value
  if (agentId) {
    const session = sessionManager.getOrCreate(agentId)
    session.conversationId = conv.id
  }
}

const handleCreateConversation = async () => {
  currentConversationId.value = null
  messages.value = []
  const agentId = selectedAgentId.value
  if (agentId) {
    const session = sessionManager.getOrCreate(agentId)
    session.conversationId = null
    session.messages = []
  }
}

// 重命名弹窗
const showRenameDialog = ref(false)
const renameForm = ref({ id: 0, title: '' })

const handleRenameConversation = (conv: Conversation) => {
  renameForm.value = { id: conv.id, title: conv.title || '' }
  showRenameDialog.value = true
}

const confirmRename = async () => {
  const success = await renameConversation(renameForm.value.id, renameForm.value.title)
  if (success) showRenameDialog.value = false
}

const handleDeleteConversation = async (conv: Conversation) => {
  const deleted = await removeConversation(conv.id)
  if (deleted && currentConversationId.value === conv.id) {
    currentConversationId.value = null
    messages.value = []
  }
}

const handleArchiveConversation = async (conv: Conversation) => {
  await archiveConversation(conv.id)
  if (currentConversationId.value === conv.id) {
    currentConversationId.value = null
    messages.value = []
  }
}

const handleToggleArchived = (archived: boolean) => {
  toggleArchived(archived)
  currentConversationId.value = null
  messages.value = []
}

// ========== 消息处理 ==========
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null)

const handleSendMessage = async (content: string, attachments?: Array<{ type: 'image'; url: string; name: string; size: number }>) => {
  messageInputRef.value?.clear()
  await sendMessage(content, attachments)
}

const handleDeleteMessage = async (msg: Message) => {
  const deleted = await removeMessage(msg)
  if (deleted) await loadMessages()
}

const handleFeedbackMessage = async (msg: Message, feedback: number | null) => {
  await feedbackMessage(msg, feedback)
}

const handleRegenerateMessage = async (msg: Message) => {
  await regenerateMessage(msg)
}

const handleEditMessage = async (msg: Message, newContent: string) => {
  await editAndResendMessage(msg, newContent)
}

// ========== 移动端返回 ==========
const handleBackToAgentList = () => {
  suspendCurrentAgent()
  selectedAgentId.value = null
  currentConversationId.value = null
  messages.value = []
}

// ========== 生命周期 ==========
onMounted(async () => {
  await loadAgents()

  // 自动初始化第一个智能体的会话（loadAgents 已设置 selectedAgentId）
  const agentId = selectedAgentId.value
  if (agentId) {
    switchingAgent.value = true
    try {
      await loadConversations({ agent_id: agentId })
      if (selectedAgentId.value !== agentId) return // 防竞态

      const session = sessionManager.getOrCreate(agentId)
      session.conversations = [...conversations.value]
      session.conversationsLoaded = true

      const todayConv = findTodayConversation(conversations.value)
      if (todayConv) {
        currentConversationId.value = todayConv.id
        session.conversationId = todayConv.id
      }
    } catch { /* ignore */ }
    finally {
      if (selectedAgentId.value === agentId) {
        switchingAgent.value = false
      }
    }
    nextTick(() => messageInputRef.value?.focus())
  }
})

watch(currentConversationId, async (newId, oldId) => {
  if (newId) {
    const isNewConversationFromSend = oldId === null && isStreaming.value
    if (currentConversationId.value === newId && !isNewConversationFromSend) {
      await loadMessages()
      // 同步到 session
      const agentId = selectedAgentId.value
      if (agentId) {
        const session = sessionManager.getOrCreate(agentId)
        session.messages = [...messages.value]
      }
    }
  }
})
</script>

<template>
  <div class="chat-container">
    <!-- 左侧智能体列表 -->
    <AgentList
      v-show="!isMobile || !selectedAgentId"
      :agents="agents"
      :loading="agentsLoading"
      :selected-id="selectedAgentId"
      @select="handleSelectAgent"
    />

    <!-- 右侧主区域 -->
    <div class="main-area" v-show="!isMobile || selectedAgentId">
      <!-- 顶部标题栏 -->
      <div class="main-header">
        <el-button v-if="isMobile" text @click="handleBackToAgentList" class="back-btn">
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </el-button>
        <div class="header-content">
          <span class="header-title">
            {{ currentConversation?.title || selectedAgent?.name || t('aiChat.welcome') }}
          </span>
          <span class="header-agent" v-if="currentConversation && selectedAgent">
            {{ selectedAgent.name }}
          </span>
        </div>
      </div>

      <!-- 消息滚动区 -->
      <el-scrollbar :ref="setMessageScrollRef" class="message-area" @scroll="handleScroll">
        <!-- 切换智能体加载中 -->
        <div v-if="switchingAgent" class="welcome-area">
          <div class="welcome-content">
            <el-icon class="is-loading" :size="32" color="var(--el-color-primary)"><Loading /></el-icon>
          </div>
        </div>

        <!-- 欢迎界面（选中智能体但无会话时） -->
        <div v-else-if="selectedAgentId && !currentConversationId && messages.length === 0" class="welcome-area">
          <div class="welcome-content">
            <el-avatar :size="64" :src="selectedAgent?.avatar ?? undefined" class="welcome-avatar">
              {{ selectedAgent?.name?.charAt(0) || '?' }}
            </el-avatar>
            <h1 class="welcome-title">{{ selectedAgent?.name }}</h1>
            <p class="welcome-tip">{{ t('aiChat.welcomeTip') }}</p>
          </div>
        </div>

        <!-- 未选择智能体时的提示 -->
        <div v-else-if="!selectedAgentId && agents.length > 0" class="welcome-area">
          <div class="welcome-content">
            <h1 class="welcome-title">{{ t('aiChat.welcome') }}</h1>
            <p class="welcome-tip">{{ t('aiChat.selectAgentFirst') }}</p>
          </div>
        </div>

        <!-- 无智能体时的提示 -->
        <div v-else-if="!agentsLoading && agents.length === 0" class="welcome-area">
          <div class="welcome-content">
            <p class="no-agent-tip">{{ t('aiChat.noAgentTip') }}</p>
          </div>
        </div>

        <!-- 加载更多历史消息提示 -->
        <div v-if="messagesLoadingMore" class="loading-more-tip">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>
        <div v-else-if="!messagesHasMore && messages.length > 0" class="no-more-tip">
          {{ t('aiChat.noMoreHistory') }}
        </div>

        <MessageList
          v-if="currentConversationId || messages.length > 0"
          :messages="messages"
          :loading="messagesLoading"
          :sending="sending"
          @copy="copyMessage"
          @delete="handleDeleteMessage"
          @regenerate="handleRegenerateMessage"
          @edit="handleEditMessage"
          @feedback="handleFeedbackMessage"
        />
      </el-scrollbar>

      <!-- 底部输入区 -->
      <MessageInput
        ref="messageInputRef"
        :sending="sending"
        :disabled="!selectedAgentId"
        :modalities="currentModalities"
        :is-streaming="isStreaming"
        :show-history-btn="true"
        @send="handleSendMessage"
        @stop="stopGeneration"
        @open-history="handleOpenDrawer"
      />
    </div>

    <!-- 历史会话抽屉 -->
    <ConversationDrawer
      v-model:visible="showConversationDrawer"
      :conversations="conversations"
      :loading="conversationsLoading"
      :loading-more="conversationsLoadingMore"
      :has-more="conversationsHasMore"
      :current-id="currentConversationId"
      :agent-name="selectedAgent?.name"
      :show-archived="showArchived"
      @select="handleSelectConversation"
      @create="handleCreateConversation"
      @rename="handleRenameConversation"
      @delete="handleDeleteConversation"
      @archive="handleArchiveConversation"
      @load-more="loadMoreConversations"
      @toggle-archived="handleToggleArchived"
      @search="searchConversations"
    />
  </div>

  <!-- 重命名弹窗 -->
  <el-dialog v-model="showRenameDialog" :title="t('aiChat.renameTitle')" width="400px" class="rename-dialog">
    <el-input v-model="renameForm.title" :placeholder="t('aiChat.newTitle')" maxlength="50" show-word-limit />
    <template #footer>
      <el-button @click="showRenameDialog = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmRename">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>


<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: var(--el-bg-color-page);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
}

.main-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.back-btn {
  margin-left: -8px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-agent {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.welcome-avatar {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 22px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
}

.welcome-tip {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0;
}

.no-agent-tip {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

:deep(.rename-dialog .el-dialog__body) {
  padding-top: 20px;
}

.loading-more-tip,
.no-more-tip {
  text-align: center;
  padding: 12px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  opacity: 0.6;
}

.loading-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .welcome-content { padding: 0 16px; }
  .welcome-title { font-size: 24px; }
}
</style>
