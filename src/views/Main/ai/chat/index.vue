<script setup lang="ts">
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {ElNotification, ElMessageBox} from 'element-plus'
import {ArrowLeft, ChatDotRound, Check, WarningFilled, Loading} from '@element-plus/icons-vue'
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
const conversationsLoadingMore = ref(false)
const conversationsPage = ref(1)
const conversationsHasMore = ref(true)
const CONV_PAGE_SIZE = 50
const currentConversationId = ref<number | null>(null)

const currentConversation = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)
})

// 加载会话（初始加载）
const loadConversations = async () => {
  conversationsLoading.value = true
  conversationsPage.value = 1
  conversationsHasMore.value = true
  try {
    const res = await AiConversationApi.list({page_size: CONV_PAGE_SIZE, current_page: 1})
    const list = res.list || []
    conversations.value = list
    conversationsHasMore.value = list.length >= CONV_PAGE_SIZE
  } finally {
    conversationsLoading.value = false
  }
}

// 加载更多会话（滚到底部触发）
const loadMoreConversations = async () => {
  if (conversationsLoadingMore.value || !conversationsHasMore.value) return
  
  conversationsLoadingMore.value = true
  const nextPage = conversationsPage.value + 1
  
  try {
    const res = await AiConversationApi.list({page_size: CONV_PAGE_SIZE, current_page: nextPage})
    const list = res.list || []
    
    if (list.length > 0) {
      conversations.value = [...conversations.value, ...list]
      conversationsPage.value = nextPage
      conversationsHasMore.value = list.length >= CONV_PAGE_SIZE
    } else {
      conversationsHasMore.value = false
    }
  } finally {
    conversationsLoadingMore.value = false
  }
}

// ========== 消息相关 ==========
const messages = ref<any[]>([])
const messagesLoading = ref(false)
const messagesLoadingMore = ref(false)  // 加载更多中
const messagesPage = ref(1)  // 当前页码
const messagesHasMore = ref(true)  // 是否还有更多
const PAGE_SIZE = 200  // 单次加载消息数，足够大避免频繁分页
const sending = ref(false)
const messageScrollRef = ref<InstanceType<typeof import('element-plus')['ElScrollbar']> | null>(null)
const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null)

// 流式消息的实时内容
const streamingContent = ref('')
const isStreaming = ref(false)

// 加载消息（初始加载）
const loadMessages = async () => {
  if (!currentConversationId.value) {
    messages.value = []
    return
  }
  messagesLoading.value = true
  messagesPage.value = 1
  messagesHasMore.value = true
  try {
    const res = await AiMessageApi.list({
      conversation_id: currentConversationId.value,
      page_size: PAGE_SIZE,
      current_page: 1
    })
    const list = res.list || []
    messages.value = list.reverse()  // 后端按时间倒序，这里反转让最新消息在最下面
    messagesHasMore.value = list.length >= PAGE_SIZE
    nextTick(() => scrollToBottom())
  } finally {
    messagesLoading.value = false
  }
}

// 加载更多历史消息（上滑触发）
const loadMoreMessages = async () => {
  if (!currentConversationId.value || messagesLoadingMore.value || !messagesHasMore.value) return
  
  messagesLoadingMore.value = true
  const nextPage = messagesPage.value + 1
  
  try {
    // 记住当前滚动位置
    const wrap = messageScrollRef.value?.wrapRef
    const prevScrollHeight = wrap?.scrollHeight || 0
    
    const res = await AiMessageApi.list({
      conversation_id: currentConversationId.value,
      page_size: PAGE_SIZE,
      current_page: nextPage
    })
    const list = res.list || []
    
    if (list.length > 0) {
      // 插入到列表开头（反转后变成时间升序）
      messages.value = [...list.reverse(), ...messages.value]
      messagesPage.value = nextPage
      messagesHasMore.value = list.length >= PAGE_SIZE
      
      // 保持滚动位置（新内容插入后保持相对位置不变）
      nextTick(() => {
        if (wrap) {
          const newScrollHeight = wrap.scrollHeight
          messageScrollRef.value?.setScrollTop(newScrollHeight - prevScrollHeight)
        }
      })
    } else {
      messagesHasMore.value = false
    }
  } finally {
    messagesLoadingMore.value = false
  }
}

// 滚动事件处理（滚到顶部加载更多）
const handleScroll = (e: { scrollTop: number }) => {
  if (e.scrollTop < 50 && !messagesLoadingMore.value && messagesHasMore.value) {
    loadMoreMessages()
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

// 智能体选项（el-select-v2 格式）
const agentOptions = computed(() => {
  return agents.value.map(a => ({
    value: a.id,
    label: a.name,
    avatar: a.avatar,
    description: a.description
  }))
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
  // 如果正在流式输出，切换会话时重置前端状态（后端继续生成）
  if (isStreaming.value) {
    isStreaming.value = false
    streamingContent.value = ''
    sending.value = false
    // 移除未完成的 AI 占位消息（后端会继续完成，稍后可从数据库加载）
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg.role === 2 && lastMsg.isStreaming) {
        messages.value.pop()
      }
    }
  }
  currentConversationId.value = conv.id
}

const handleCreateConversation = () => {
  // 如果正在流式输出，新建会话时重置前端状态
  if (isStreaming.value) {
    isStreaming.value = false
    streamingContent.value = ''
    sending.value = false
  }
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
      onConversation: (conversationId) => {
        // 新建会话时更新 ID，并直接插入列表头部（不触发全量刷新）
        if (!currentConversationId.value) {
          currentConversationId.value = conversationId
          // 插入临时会话到列表头部
          conversations.value.unshift({
            id: conversationId,
            title: '',  // 标题稍后自动生成
            agent_id: selectedAgentId.value,
            agent_name: selectedAgent.value?.name || '',
            last_message_at: new Date().toISOString(),
          })
        }
      },
      onDone: async (data) => {
        isStreaming.value = false
        streamingContent.value = ''
        // 标记流式结束
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) {
          lastMsg.isStreaming = false
        }
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
      onDone: async (data) => {
        isStreaming.value = false
        streamingContent.value = ''
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) lastMsg.isStreaming = false
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
        :loading-more="conversationsLoadingMore"
        :has-more="conversationsHasMore"
        :current-id="currentConversationId"
        @select="handleSelectConversation"
        @create="handleCreateConversation"
        @rename="handleRenameConversation"
        @delete="handleDeleteConversation"
        @load-more="loadMoreConversations"
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
      <el-scrollbar ref="messageScrollRef" class="message-area" @scroll="handleScroll">
        <!-- 新对话欢迎界面 -->
        <div v-if="!currentConversationId && messages.length === 0" class="welcome-area">
          <div class="welcome-content">
            <h1 class="welcome-title">{{ t('aiChat.welcome') }}</h1>
            
            <!-- 智能体选择下拉框 -->
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
          <el-icon class="is-loading"><Loading/></el-icon>
          <span>加载中...</span>
        </div>
        <div v-else-if="!messagesHasMore && messages.length > 0" class="no-more-tip">
          没有更多历史消息了
        </div>
        <MessageList
            v-if="currentConversationId || messages.length > 0"
            :messages="messages"
            :loading="messagesLoading"
            :sending="sending"
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

/* 智能体选择器 */
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

/* 重命名弹窗 */
:deep(.rename-dialog .el-dialog__body) {
  padding-top: 20px;
}

/* 加载更多提示 */
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
  
  .agent-cards {
    grid-template-columns: 1fr;
  }
}
</style>
