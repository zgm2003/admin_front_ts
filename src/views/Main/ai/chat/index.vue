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
  useMessages,
  useAgents,
  useStreamChat
} from './composables'
import type { Agent, Conversation } from './composables/types'

const { t } = useI18n()
const isMobile = useIsMobile()

// ========== 状态管理 ==========
const currentConversationId = ref<number | null>(null)
const showConversationDrawer = ref(false)

// ========== Composables ==========
const {
  conversations,
  loading: conversationsLoading,
  loadingMore: conversationsLoadingMore,
  hasMore: conversationsHasMore,
  showArchived,
  loadConversations,
  loadMore: loadMoreConversations,
  rename: renameConversation,
  remove: removeConversation,
  archive: archiveConversation,
  toggleArchived
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
  cancelOnSwitch,
  stop: stopGeneration
} = useStreamChat({
  messages,
  conversations,
  currentConversationId,
  selectedAgentId,
  selectedAgent,
  scrollToBottom,
  loadMessages
})

// ========== 计算属性 ==========
const currentConversation = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)
})

const currentModalities = computed(() => {
  return getAgentModalities(selectedAgentId.value)
})

// ========== 智能体选择处理 ==========
const handleSelectAgent = async (agent: Agent) => {
  // 取消正在进行的流式响应
  await cancelOnSwitch()
  
  // 选择智能体（会持久化到 localStorage）
  selectAgent(agent)
  
  // 清空当前状态，准备新对话
  currentConversationId.value = null
  messages.value = []
  
  // 自动聚焦输入框
  nextTick(() => messageInputRef.value?.focus())
}

// ========== 会话抽屉处理 ==========
const handleOpenDrawer = async () => {
  showConversationDrawer.value = true
  // 打开抽屉时才加载会话列表
  if (selectedAgentId.value) {
    await loadConversations({ agent_id: selectedAgentId.value })
  }
}

const handleSelectConversation = async (conv: Conversation) => {
  await cancelOnSwitch()
  currentConversationId.value = conv.id
}

const handleCreateConversation = async () => {
  await cancelOnSwitch()
  currentConversationId.value = null
  messages.value = []
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

const handleSendMessage = async (content: string, attachments?: any[]) => {
  messageInputRef.value?.clear()
  await sendMessage(content, attachments)
}

const handleDeleteMessage = async (msg: any) => {
  const deleted = await removeMessage(msg)
  if (deleted) await loadMessages()
}

const handleFeedbackMessage = async (msg: any, feedback: number | null) => {
  await feedbackMessage(msg, feedback)
}

const handleRegenerateMessage = async (msg: any) => {
  await regenerateMessage(msg)
}

// ========== 移动端返回 ==========
const handleBackToAgentList = () => {
  selectedAgentId.value = null
  currentConversationId.value = null
  messages.value = []
}

// ========== 生命周期 ==========
onMounted(async () => {
  // 只加载智能体列表，不加载会话
  await loadAgents()
  // 如果已有选中的智能体，自动聚焦输入框
  if (selectedAgentId.value) {
    nextTick(() => messageInputRef.value?.focus())
  }
})

watch(currentConversationId, async (newId, oldId) => {
  if (newId) {
    const isNewConversationFromSend = oldId === null && isStreaming.value

    // 只加载消息，不调用会话详情接口
    // modalities 直接从选中的智能体获取
    if (currentConversationId.value === newId && !isNewConversationFromSend) {
      await loadMessages()
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
      <el-scrollbar :ref="(el: any) => { if (el) messageScrollRef = el }" class="message-area" @scroll="handleScroll">
        <!-- 欢迎界面（选中智能体但无会话时） -->
        <div v-if="selectedAgentId && !currentConversationId && messages.length === 0" class="welcome-area">
          <div class="welcome-content">
            <el-avatar :size="64" :src="selectedAgent?.avatar" class="welcome-avatar">
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
  padding: 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.loading-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .welcome-content {
    padding: 0 16px;
  }

  .welcome-title {
    font-size: 24px;
  }
}
</style>
