<script setup lang="ts">
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {ElNotification, ElMessageBox} from 'element-plus'
import {ArrowLeft, ChatDotRound} from '@element-plus/icons-vue'
import {AiConversationApi} from '@/api/ai/conversations'
import {AiMessageApi} from '@/api/ai/messages'
import {AiChatApi} from '@/api/ai/chat'
import type {StreamCallbacks} from '@/api/ai/chat'
import {AiAgentApi} from '@/api/ai/agents'
import {useIsMobile} from '@/hooks/useResponsive'

import ConversationList from './components/ConversationList/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'

const {t} = useI18n()
const isMobile = useIsMobile()

// ========== 会话相关 ==========
const conversations = ref<any[]>([])
const conversationsLoading = ref(false)
const currentConversationId = ref<number | null>(null)

const currentConversation = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)
})

const loadConversations = async () => {
  conversationsLoading.value = true
  try {
    const res = await AiConversationApi.list({page_size: 100})
    conversations.value = res.list || []
  } finally {
    conversationsLoading.value = false
  }
}

// ========== 消息相关 ==========
const messages = ref<any[]>([])
const messagesLoading = ref(false)
const sending = ref(false)
const messageScrollRef = ref<InstanceType<typeof import('element-plus')['ElScrollbar']> | null>(null)
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null)

// 流式消息的实时内容
const streamingContent = ref('')
const isStreaming = ref(false)

const loadMessages = async () => {
  if (!currentConversationId.value) {
    messages.value = []
    return
  }
  messagesLoading.value = true
  try {
    const res = await AiMessageApi.list({
      conversation_id: currentConversationId.value,
      page_size: 200
    })
    messages.value = res.list || []
    nextTick(() => scrollToBottom())
  } finally {
    messagesLoading.value = false
  }
}

const scrollToBottom = () => {
  const wrap = messageScrollRef.value?.wrapRef
  if (wrap) {
    messageScrollRef.value?.setScrollTop(wrap.scrollHeight)
  }
}

// ========== 智能体相关 ==========
const agents = ref<any[]>([])
const selectedAgentId = ref<number | null>(null)
const showAgentDialog = ref(false)

const loadAgents = async () => {
  try {
    const res = await AiAgentApi.list({page_size: 100, status: 1})
    agents.value = res.list || []
    if (agents.value.length > 0 && !selectedAgentId.value) {
      selectedAgentId.value = agents.value[0].id
    }
  } catch { /* ignore */ }
}

// ========== 事件处理 ==========
const handleSelectConversation = (conv: any) => {
  currentConversationId.value = conv.id
}

const handleCreateConversation = () => {
  if (agents.value.length === 0) {
    ElNotification.warning({message: '暂无可用智能体，请先配置'})
    return
  }
  if (agents.value.length === 1) {
    createConversation(agents.value[0].id)
  } else {
    showAgentDialog.value = true
  }
}

const confirmSelectAgent = () => {
  if (!selectedAgentId.value) {
    ElNotification.warning({message: t('aiChat.selectAgent')})
    return
  }
  showAgentDialog.value = false
  createConversation(selectedAgentId.value)
}

const createConversation = async (agentId: number) => {
  try {
    const res = await AiConversationApi.add({agent_id: agentId})
    await loadConversations()
    currentConversationId.value = res.id
    messages.value = []
  } catch { /* handled */ }
}

// 重命名
const showRenameDialog = ref(false)
const renameForm = ref({id: 0, title: ''})

const handleRenameConversation = (conv: any) => {
  renameForm.value = {id: conv.id, title: conv.title || ''}
  showRenameDialog.value = true
}

const confirmRename = async () => {
  if (!renameForm.value.title.trim()) {
    ElNotification.warning({message: t('aiChat.newTitle') + t('common.required')})
    return
  }
  try {
    await AiConversationApi.edit({id: renameForm.value.id, title: renameForm.value.title})
    ElNotification.success({message: t('common.success.operation')})
    showRenameDialog.value = false
    await loadConversations()
  } catch { /* handled */ }
}

// 删除
const handleDeleteConversation = async (conv: any) => {
  try {
    await ElMessageBox.confirm(t('aiChat.confirmDelete'), t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel')
    })
  } catch {
    return
  }
  try {
    await AiConversationApi.del({id: conv.id})
    ElNotification.success({message: t('common.success.operation')})
    if (currentConversationId.value === conv.id) {
      currentConversationId.value = null
      messages.value = []
    }
    await loadConversations()
  } catch { /* handled */ }
}

// 发送消息（流式）
const handleSendMessage = async (content: string) => {
  if (sending.value) return // 硬挡防止重复提交

  // 确定 agent_id
  const agentId = currentConversation.value?.agent_id || selectedAgentId.value || agents.value[0]?.id
  if (!currentConversationId.value && !agentId) {
    ElNotification.warning({message: '暂无可用智能体，请先配置'})
    return
  }

  sending.value = true
  isStreaming.value = true
  streamingContent.value = ''

  // 立即显示用户消息
  const userMessage = {
    id: Date.now(),
    role: 1,
    content,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMessage)
  messageInputRef.value?.clear()
  await nextTick()
  scrollToBottom()

  // 添加 AI 占位消息
  const aiMessage = {
    id: Date.now() + 1,
    role: 2,
    content: '',
    created_at: new Date().toISOString(),
    isStreaming: true,
  }
  messages.value.push(aiMessage)

  try {
    const callbacks: StreamCallbacks = {
      onContent: (delta) => {
        streamingContent.value += delta
        // 更新 AI 消息内容
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 2) {
          lastMsg.content = streamingContent.value
        }
        nextTick(() => scrollToBottom())
      },
      onConversation: async (conversationId) => {
        // 新建会话时更新 ID
        if (!currentConversationId.value) {
          currentConversationId.value = conversationId
          await loadConversations()
        }
      },
      onDone: async () => {
        isStreaming.value = false
        streamingContent.value = ''
        // 标记流式结束
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) {
          lastMsg.isStreaming = false
        }
        // 刷新消息列表获取完整数据
        await loadMessages()
      },
      onError: (msg) => {
        isStreaming.value = false
        streamingContent.value = ''
        ElNotification.error({message: msg})
        // 移除占位消息
        messages.value.pop()
      },
    }

    await AiChatApi.stream({
      content,
      conversation_id: currentConversationId.value || undefined,
      agent_id: currentConversationId.value ? undefined : agentId,
    }, callbacks)
  } catch (error: any) {
    isStreaming.value = false
    streamingContent.value = ''
    ElNotification.error({message: error.message || '发送失败'})
    // 移除占位消息
    messages.value.pop()
  } finally {
    sending.value = false
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadConversations()
  loadAgents()
})

watch(currentConversationId, () => {
  if (currentConversationId.value) {
    loadMessages()
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
        :current-id="currentConversationId"
        @select="handleSelectConversation"
        @create="handleCreateConversation"
        @rename="handleRenameConversation"
        @delete="handleDeleteConversation"
    />

    <!-- 右侧主区域 -->
    <div class="main-area" v-show="!isMobile || currentConversationId">
      <!-- 顶部标题栏 -->
      <div class="main-header">
        <el-button v-if="isMobile && currentConversationId" text @click="currentConversationId = null">
          <el-icon><ArrowLeft/></el-icon>
        </el-button>
        <span class="header-title">
          {{ currentConversation?.title || currentConversation?.agent_name || t('aiChat.selectConversation') }}
        </span>
      </div>

      <!-- 消息滚动区 -->
      <el-scrollbar ref="messageScrollRef" class="message-area">
        <div v-if="!currentConversationId" class="empty-message">
          <el-icon :size="48" color="#c0c4cc"><ChatDotRound/></el-icon>
          <p>{{ t('aiChat.selectConversation') }}</p>
        </div>
        <MessageList
            v-else
            :messages="messages"
            :loading="messagesLoading"
        />
      </el-scrollbar>

      <!-- 底部输入区 -->
      <MessageInput ref="messageInputRef" :sending="sending" @send="handleSendMessage"/>
    </div>

    <!-- 选择智能体弹窗 -->
    <el-dialog v-model="showAgentDialog" :title="t('aiChat.selectAgent')" width="400px">
      <el-select v-model="selectedAgentId" style="width: 100%">
        <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id"/>
      </el-select>
      <template #footer>
        <el-button @click="showAgentDialog = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSelectAgent">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 重命名弹窗 -->
    <el-dialog v-model="showRenameDialog" :title="t('aiChat.renameTitle')" width="400px">
      <el-input v-model="renameForm.title" :placeholder="t('aiChat.newTitle')"/>
      <template #footer>
        <el-button @click="showRenameDialog = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmRename">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: var(--el-bg-color);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.message-area {
  flex: 1;
  min-height: 0;
}

.message-area :deep(.el-scrollbar__view) {
  padding: 16px;
}

.empty-message {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.empty-message p {
  margin-top: 16px;
}
</style>
