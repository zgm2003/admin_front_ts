<script setup lang="ts">
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {ElNotification, ElMessageBox} from 'element-plus'
import {ArrowLeft, ChatDotRound, Check, WarningFilled} from '@element-plus/icons-vue'
import {AiConversationApi} from '@/api/ai/conversations'
import {AiMessageApi} from '@/api/ai/messages'
import {AiChatApi} from '@/api/ai/chat'
import type {StreamCallbacks} from '@/api/ai/chat'
import {AiAgentApi} from '@/api/ai/agents'
import {useIsMobile} from '@/hooks/useResponsive'
import {useUserStore} from '@/store/user'

import ConversationList from './components/ConversationList/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'

const {t} = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()

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
      page_size: 50
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
const agentSearchLoading = ref(false)

// 当前选中的智能体
const selectedAgent = computed(() => {
  return agents.value.find(a => a.id === selectedAgentId.value)
})

// 加载智能体（初始加载前10个，支持搜索）
const loadAgents = async (keyword?: string) => {
  agentSearchLoading.value = true
  try {
    const res = await AiAgentApi.list({
      page_size: 10, 
      status: 1,
      name: keyword || undefined
    })
    agents.value = res.list || []
    // 初始加载时默认选中第一个
    if (!keyword && agents.value.length > 0 && !selectedAgentId.value) {
      selectedAgentId.value = agents.value[0].id
    }
  } catch { /* ignore */ }
  agentSearchLoading.value = false
}

// 搜索智能体（远程搜索）
const handleAgentSearch = (keyword: string) => {
  loadAgents(keyword)
}

// 当前智能体头像
const currentAgentAvatar = computed(() => {
  // 先看当前会话的智能体
  if (currentConversation.value?.agent_avatar) {
    return currentConversation.value.agent_avatar
  }
  // 再看选中的智能体
  const agent = agents.value.find(a => a.id === selectedAgentId.value)
  return agent?.avatar || ''
})

// ========== 事件处理 ==========
const handleSelectConversation = (conv: any) => {
  currentConversationId.value = conv.id
}

const handleCreateConversation = () => {
  // 简化：直接清空当前会话，让用户在新对话界面选择智能体并输入
  currentConversationId.value = null
  messages.value = []
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
        // 刷新会话列表获取自动生成的标题
        await loadConversations()
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

// ========== 消息操作 ==========
// 复制消息
const handleCopyMessage = async (msg: any) => {
  try {
    await navigator.clipboard.writeText(msg.content)
    ElNotification.success({message: t('aiChat.copied')})
  } catch {
    ElNotification.error({message: '复制失败'})
  }
}

// 删除消息
const handleDeleteMessage = async (msg: any) => {
  try {
    await ElMessageBox.confirm(t('aiChat.confirmDeleteMessage'), t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel')
    })
  } catch {
    return
  }
  try {
    await AiMessageApi.del({id: msg.id})
    ElNotification.success({message: t('common.success.operation')})
    await loadMessages()
  } catch { /* handled */ }
}

// 重新生成（删除最后一条 AI 回复，重新发送上一条用户消息）
const handleRegenerateMessage = async (msg: any) => {
  if (sending.value) return
  
  // 找到对应的用户消息（上一条）
  const msgIndex = messages.value.findIndex(m => m.id === msg.id)
  if (msgIndex <= 0) return
  
  const userMsg = messages.value[msgIndex - 1]
  if (!userMsg || userMsg.role !== 1) {
    ElNotification.warning({message: '找不到对应的用户消息'})
    return
  }
  
  // 删除旧的 AI 回复
  try {
    await AiMessageApi.del({id: msg.id})
  } catch { /* ignore */ }
  
  // 从本地列表移除
  messages.value.splice(msgIndex, 1)
  
  // 重新发送
  sending.value = true
  isStreaming.value = true
  streamingContent.value = ''
  
  // 添加 AI 占位消息
  const aiMessage = {
    id: Date.now(),
    role: 2,
    content: '',
    created_at: new Date().toISOString(),
    isStreaming: true,
  }
  messages.value.push(aiMessage)
  await nextTick()
  scrollToBottom()
  
  try {
    const callbacks: StreamCallbacks = {
      onContent: (delta) => {
        streamingContent.value += delta
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 2) {
          lastMsg.content = streamingContent.value
        }
        nextTick(() => scrollToBottom())
      },
      onConversation: () => {},
      onDone: async () => {
        isStreaming.value = false
        streamingContent.value = ''
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) lastMsg.isStreaming = false
        await loadMessages()
      },
      onError: (errMsg) => {
        isStreaming.value = false
        streamingContent.value = ''
        ElNotification.error({message: errMsg})
        messages.value.pop()
      },
    }
    
    await AiChatApi.stream({
      content: userMsg.content,
      conversation_id: currentConversationId.value!,
    }, callbacks)
  } catch (error: any) {
    isStreaming.value = false
    streamingContent.value = ''
    ElNotification.error({message: error.message || '重新生成失败'})
    messages.value.pop()
  } finally {
    sending.value = false
  }
}
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
      <div class="main-header" v-if="currentConversationId">
        <el-button v-if="isMobile" text @click="currentConversationId = null" class="back-btn">
          <el-icon :size="20"><ArrowLeft/></el-icon>
        </el-button>
        <div class="header-content">
          <span class="header-title">
            {{ currentConversation?.title || t('aiChat.untitled') }}
          </span>
          <span class="header-agent" v-if="currentConversation?.agent_name">
            {{ currentConversation.agent_name }}
          </span>
        </div>
      </div>

      <!-- 消息滚动区 -->
      <el-scrollbar ref="messageScrollRef" class="message-area">
        <!-- 新对话欢迎界面 -->
        <div v-if="!currentConversationId" class="welcome-area">
          <div class="welcome-content">
            <div class="welcome-logo">
              <el-avatar v-if="currentAgentAvatar" :src="currentAgentAvatar" :size="80"/>
              <el-icon v-else :size="48"><ChatDotRound/></el-icon>
            </div>
            <h1 class="welcome-title">{{ t('aiChat.welcome') }}</h1>
            <p class="welcome-subtitle">{{ t('aiChat.welcomeTip') }}</p>
            
            <!-- 智能体选择下拉框 -->
            <div class="agent-selector">
              <el-select
                v-model="selectedAgentId"
                filterable
                remote
                :remote-method="handleAgentSearch"
                :loading="agentSearchLoading"
                :placeholder="t('aiChat.selectAgent')"
                size="large"
                class="agent-select"
              >
                <el-option
                  v-for="agent in agents"
                  :key="agent.id"
                  :value="agent.id"
                  :label="agent.name"
                >
                  <div class="agent-option">
                    <el-avatar v-if="agent.avatar" :src="agent.avatar" :size="32"/>
                    <el-icon v-else :size="16" class="agent-option-icon"><ChatDotRound/></el-icon>
                    <div class="agent-option-info">
                      <div class="agent-option-name">{{ agent.name }}</div>
                      <div class="agent-option-desc">{{ agent.description || '' }}</div>
                    </div>
                  </div>
                </el-option>
              </el-select>
              
              <!-- 选中后显示智能体信息 -->
              <div class="selected-agent-info" v-if="selectedAgent">
                <div class="selected-agent-avatar">
                  <el-avatar v-if="selectedAgent.avatar" :src="selectedAgent.avatar" :size="64"/>
                  <el-icon v-else :size="32"><ChatDotRound/></el-icon>
                </div>
                <div class="selected-agent-name">{{ selectedAgent.name }}</div>
                <div class="selected-agent-desc">{{ selectedAgent.description || t('aiChat.noDescription') }}</div>
              </div>
            </div>
            
            <div v-if="agents.length === 0 && !agentSearchLoading" class="no-agent-tip">
              <el-icon :size="32"><WarningFilled/></el-icon>
              <p>{{ t('aiChat.noAgentTip') }}</p>
            </div>
          </div>
        </div>
        <MessageList
            v-else
            :messages="messages"
            :loading="messagesLoading"
            :sending="sending"
            :user-avatar="userStore.avatar"
            :agent-avatar="currentAgentAvatar"
            @copy="handleCopyMessage"
            @delete="handleDeleteMessage"
            @regenerate="handleRegenerateMessage"
        />
      </el-scrollbar>

      <!-- 底部输入区 -->
      <MessageInput 
        ref="messageInputRef" 
        :sending="sending" 
        :disabled="agents.length === 0"
        @send="handleSendMessage"
      />
    </div>
  </div>

  <!-- 重命名弹窗 -->
  <el-dialog v-model="showRenameDialog" :title="t('aiChat.renameTitle')" width="400px" class="rename-dialog">
    <el-input v-model="renameForm.title" :placeholder="t('aiChat.newTitle')" maxlength="50" show-word-limit/>
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

/* 欢迎页面 */
.welcome-area {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--el-bg-color);
}

.welcome-content {
  max-width: 600px;
  text-align: center;
}

.welcome-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.welcome-logo :deep(.el-avatar) {
  border-radius: 20px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0 0 40px;
}

/* 智能体选择器 */
.agent-selector {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.agent-select {
  width: 100%;
}

.agent-select :deep(.el-input__inner) {
  height: 48px;
  font-size: 15px;
}

.agent-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.agent-option-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.agent-option-info {
  flex: 1;
  min-width: 0;
}

.agent-option-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.agent-option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-agent-info {
  margin-top: 24px;
  text-align: center;
}

.selected-agent-avatar {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.selected-agent-avatar :deep(.el-avatar) {
  border-radius: 16px;
}

.selected-agent-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.selected-agent-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.no-agent-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

/* 重命名弹窗 */
:deep(.rename-dialog .el-dialog__body) {
  padding-top: 20px;
}

@media (max-width: 768px) {
  .welcome-content {
    padding: 0 16px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .agent-cards {
    grid-template-columns: 1fr;
  }
}
</style>
