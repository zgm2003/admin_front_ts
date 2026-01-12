<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

import ConversationList from './components/ConversationList/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'

import {
  useConversations,
  useMessages,
  useAgents,
  useStreamChat
} from './composables'

const { t } = useI18n()
const isMobile = useIsMobile()

// ========== 状态管理 ==========
const currentConversationId = ref<number | null>(null)
const currentConversationModalities = ref<any>(null)

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
  toggleArchived,
  getDetail: getConversationDetail
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
  searchLoading: agentSearchLoading,
  selectedAgent,
  agentOptions,
  loadAgents,
  handleSearch: handleAgentSearch,
  getAgentModalities
} = useAgents()

// 包装 loadMessages 以便传入 conversationId
const loadMessages = () => loadMessagesRaw(currentConversationId.value)
const handleScroll = (e: { scrollTop: number }) => handleScrollRaw(e, currentConversationId.value)

const {
  sending,
  isStreaming,
  pendingRuns,
  send: sendMessage,
  regenerate: regenerateMessage,
  resume: resumeStream,
  savePendingRun,
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
  return currentConversationModalities.value || getAgentModalities(selectedAgentId.value)
})

// ========== 事件处理 ==========
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null)

const handleSelectConversation = (conv: any) => {
  savePendingRun()
  currentConversationId.value = conv.id
}

const handleCreateConversation = () => {
  savePendingRun()
  currentConversationId.value = null
  messages.value = []
}

// 重命名弹窗
const showRenameDialog = ref(false)
const renameForm = ref({ id: 0, title: '' })

const handleRenameConversation = (conv: any) => {
  renameForm.value = { id: conv.id, title: conv.title || '' }
  showRenameDialog.value = true
}

const confirmRename = async () => {
  const success = await renameConversation(renameForm.value.id, renameForm.value.title)
  if (success) showRenameDialog.value = false
}

const handleDeleteConversation = async (conv: any) => {
  const deleted = await removeConversation(conv.id)
  if (deleted && currentConversationId.value === conv.id) {
    currentConversationId.value = null
    messages.value = []
  }
}

const handleArchiveConversation = async (conv: any) => {
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

const handleSendMessage = async (content: string, attachments?: any[]) => {
  messageInputRef.value?.clear()  // 立即清空输入框
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

// ========== 生命周期 ==========
onMounted(() => {
  loadConversations()
  loadAgents()
})

watch(currentConversationId, async (newId) => {
  currentConversationModalities.value = null

  if (newId && !isStreaming.value) {
    try {
      const detail = await getConversationDetail(newId)
      currentConversationModalities.value = detail.modalities || null
    } catch { /* ignore */ }

    if (pendingRuns.value.has(newId)) {
      await loadMessages()
      await resumeStream(newId)
    } else {
      await loadMessages()
    }
  }
})
</script>

<template>
  <div class="chat-container">
    <!-- 左侧会话列表 -->
    <ConversationList
      v-show="!isMobile || !currentConversationId"
      :conversations="conversations"
      :loading="conversationsLoading"
      :loading-more="conversationsLoadingMore"
      :has-more="conversationsHasMore"
      :current-id="currentConversationId"
      :show-archived="showArchived"
      @select="handleSelectConversation"
      @create="handleCreateConversation"
      @rename="handleRenameConversation"
      @delete="handleDeleteConversation"
      @archive="handleArchiveConversation"
      @load-more="loadMoreConversations"
      @toggle-archived="handleToggleArchived"
    />

    <!-- 右侧主区域 -->
    <div class="main-area" v-show="!isMobile || currentConversationId">
      <!-- 顶部标题栏 -->
      <div class="main-header" v-if="currentConversationId">
        <el-button v-if="isMobile" text @click="currentConversationId = null" class="back-btn">
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </el-button>
        <div class="header-content">
          <span class="header-title">{{ currentConversation?.title || t('aiChat.untitled') }}</span>
          <span class="header-agent" v-if="currentConversation?.agent_name">
            {{ currentConversation.agent_name }}
          </span>
        </div>
      </div>

      <!-- 消息滚动区 -->
      <el-scrollbar :ref="(el: any) => { if (el) messageScrollRef = el }" class="message-area" @scroll="handleScroll">
        <!-- 新对话欢迎界面 -->
        <div v-if="!currentConversationId && messages.length === 0" class="welcome-area">
          <div class="welcome-content">
            <h1 class="welcome-title">{{ t('aiChat.welcome') }}</h1>
            <div class="agent-selector" v-if="agents.length > 0">
              <el-select-v2
                v-model="selectedAgentId"
                :options="agentOptions"
                filterable
                remote
                :remote-method="handleAgentSearch"
                :loading="agentSearchLoading"
                :debounce="300"
                :placeholder="t('aiChat.selectAgent')"
                size="large"
                class="agent-select"
              >
                <template #default="{ item }">
                  <div class="agent-option">
                    <div class="agent-option-name">{{ item.label }}</div>
                  </div>
                </template>
              </el-select-v2>
            </div>
            <div v-else-if="!agentSearchLoading" class="no-agent-tip">
              {{ t('aiChat.noAgentTip') }}
            </div>
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
        :disabled="agents.length === 0"
        :modalities="currentModalities"
        :is-streaming="isStreaming"
        @send="handleSendMessage"
        @stop="stopGeneration"
      />
    </div>
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
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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

.welcome-title {
  font-size: 22px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 24px;
}

.agent-selector {
  width: 100%;
}

.agent-select {
  width: 100%;
}

.agent-option {
  padding: 4px 0;
}

.agent-option-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
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
