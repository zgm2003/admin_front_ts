import { ref, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AiChatApi } from '@/api/ai/chat'
import { AiMessageApi } from '@/api/ai/messages'
import { AiRoleEnum } from '@/enums'
import type { StreamCallbacks, Attachment, StreamChatOptions, Message } from './types'

// SSE 渲染节流配置
const FLUSH_INTERVAL = 50 // 每 50ms flush 一次，约 20fps
const SCROLL_THROTTLE = 100 // 滚动节流 100ms

export function useStreamChat(options: StreamChatOptions) {
  const { t } = useI18n()
  const {
    messages,
    conversations,
    currentConversationId,
    selectedAgentId,
    selectedAgent,
    scrollToBottom
  } = options

  const sending = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const currentRunId = ref<number | null>(null)

  // 渲染节流状态
  let deltaBuffer = ''
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let lastScrollTime = 0
  let rafId: number | null = null

  // 清理定时器
  const clearTimers = () => {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // 节流滚动
  const throttledScroll = () => {
    const now = Date.now()
    if (now - lastScrollTime >= SCROLL_THROTTLE) {
      lastScrollTime = now
      rafId = requestAnimationFrame(() => {
        scrollToBottom()
        rafId = null
      })
    }
  }

  // flush 缓冲区内容到 UI
  const flushBuffer = () => {
    if (!deltaBuffer) return
    
    streamingContent.value += deltaBuffer
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
      lastMsg.content = streamingContent.value
    }
    deltaBuffer = ''
    throttledScroll()
  }

  // 启动定时 flush
  const startFlushTimer = () => {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushBuffer()
      flushTimer = null
      if (isStreaming.value && deltaBuffer) {
        startFlushTimer()
      }
    }, FLUSH_INTERVAL)
  }

  // 创建流式回调
  const createCallbacks = (
    requestConversationId: number | null,
    onNewConversation?: (id: number) => void
  ): StreamCallbacks => {
    return {
      onContent: (delta) => {
        // 会话已切换，忽略
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) return
        // 将 delta 加入缓冲区，而不是直接更新 UI
        deltaBuffer += delta
        startFlushTimer()
      },
      onConversation: onNewConversation,
      onRun: (runId) => {
        currentRunId.value = runId
      },
      onDone: (data) => {
        // 会话已切换，清空 buffer 并退出（防止串话）
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) {
          deltaBuffer = ''
          clearTimers()
          return
        }
        
        // flush 剩余内容
        flushBuffer()
        clearTimers()
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) lastMsg.isStreaming = false

        // 用服务端真实 ID 替换临时 ID
        if (data.assistant_message_id) {
          const aiMsg = messages.value.findLast(m => m.role === AiRoleEnum.ASSISTANT)
          if (aiMsg) aiMsg.id = data.assistant_message_id
        }
        if (data.user_message_id) {
          const userMsg = messages.value.findLast(m => m.role === AiRoleEnum.USER)
          if (userMsg) userMsg.id = data.user_message_id
        }
        
        // 最终滚动到底部
        nextTick(() => scrollToBottom())
        
        // 更新会话时间（标题由后端异步生成，打开历史抽屉时会刷新）
        const convId = data.conversation_id || currentConversationId.value
        if (convId) {
          const conv = conversations.value.find(c => c.id === convId)
          if (conv) {
            conv.last_message_at = new Date().toISOString()
          }
        }
      },
      onError: (msg) => {
        clearTimers()
        deltaBuffer = ''
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) return
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: msg })
        // 移除 AI 占位消息
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) {
          messages.value.pop()
        }
      }
    }
  }

  // 添加 AI 占位消息
  const addAiPlaceholder = (): Message => {
    const aiMessage: Message = {
      id: -(Date.now() + Math.random()),
      role: AiRoleEnum.ASSISTANT,
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true
    }
    messages.value.push(aiMessage)
    return aiMessage
  }

  // 发送消息
  const send = async (content: string, attachments?: Attachment[]) => {
    if (sending.value) return

    const agentId = selectedAgentId.value
    if (!currentConversationId.value && !agentId) {
      ElNotification.warning({ message: t('aiChat.noAgentTip') })
      return
    }

    sending.value = true
    isStreaming.value = true
    streamingContent.value = ''
    currentRunId.value = null
    deltaBuffer = ''

    const requestConversationId = currentConversationId.value

    // 添加用户消息
    const userMessage: Message = {
      id: -(Date.now() + Math.random()),
      role: AiRoleEnum.USER,
      content,
      created_at: new Date().toISOString(),
      meta_json: attachments?.length ? { attachments } : undefined
    }
    messages.value.push(userMessage)
    await nextTick()
    scrollToBottom()

    // 添加 AI 占位
    addAiPlaceholder()

    try {
      const callbacks = createCallbacks(requestConversationId, (conversationId) => {
        if (!currentConversationId.value) {
          currentConversationId.value = conversationId
          conversations.value.unshift({
            id: conversationId,
            title: '',
            agent_id: selectedAgentId.value ?? undefined,
            agent_name: selectedAgent.value?.name || '',
            last_message_at: new Date().toISOString()
          })
        }
      })

      await AiChatApi.stream({
        content,
        conversation_id: currentConversationId.value || undefined,
        agent_id: currentConversationId.value ? undefined : agentId ?? undefined,
        attachments: attachments?.length ? attachments : undefined
      }, callbacks)
    } catch (error: any) {
      clearTimers()
      deltaBuffer = ''
      if (currentConversationId.value === requestConversationId || requestConversationId === null) {
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: error.message || t('aiChat.sendFailed') })
        messages.value.pop()
      }
    } finally {
      sending.value = false
    }
  }

  // 重新生成
  const regenerate = async (msg: Message) => {
    if (sending.value) return

    const msgIndex = messages.value.findIndex(m => m.id === msg.id)
    if (msgIndex <= 0) return

    const userMsg = messages.value[msgIndex - 1]
    if (!userMsg || userMsg.role !== AiRoleEnum.USER) {
      ElNotification.warning({ message: t('aiChat.userMessageNotFound') })
      return
    }

    // 删除旧的 AI 回复
    try {
      await AiMessageApi.del({ id: msg.id })
    } catch { /* ignore */ }

    messages.value.splice(msgIndex, 1)

    sending.value = true
    isStreaming.value = true
    streamingContent.value = ''
    currentRunId.value = null
    deltaBuffer = ''

    const requestConversationId = currentConversationId.value

    addAiPlaceholder()
    await nextTick()
    scrollToBottom()

    try {
      const callbacks = createCallbacks(requestConversationId)
      await AiChatApi.stream({
        content: userMsg.content,
        conversation_id: currentConversationId.value!
      }, callbacks)
    } catch (error: any) {
      clearTimers()
      deltaBuffer = ''
      if (currentConversationId.value === requestConversationId) {
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: error.message || t('aiChat.regenerateFailed') })
        messages.value.pop()
      }
    } finally {
      sending.value = false
    }
  }

  // 切换会话时取消当前流式输出
  const cancelOnSwitch = async () => {
    if (!isStreaming.value || !currentRunId.value) return
    
    const runId = currentRunId.value
    // 立即重置状态
    isStreaming.value = false
    sending.value = false
    streamingContent.value = ''
    currentRunId.value = null
    deltaBuffer = ''
    clearTimers()
    
    // 移除 AI 占位消息
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) {
      messages.value.pop()
    }
    
    // 后台取消请求（不等待结果）
    AiChatApi.cancel(runId).catch(() => {})
  }

  // 停止生成
  const stop = async () => {
    if (!isStreaming.value || !currentRunId.value) return

    const runId = currentRunId.value
    
    try {
      await AiChatApi.cancel(runId)
      
      // flush 剩余内容
      flushBuffer()
      clearTimers()
      
      if (isStreaming.value) {
        isStreaming.value = false
        sending.value = false
        streamingContent.value = ''
        currentRunId.value = null
        deltaBuffer = ''
        
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.isStreaming) {
          lastMsg.isStreaming = false
        }
      }
    } catch (error: any) {
      ElNotification.error({ message: error.message || t('aiChat.stopFailed') })
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    clearTimers()
  })

  return {
    sending,
    isStreaming,
    currentRunId,
    send,
    regenerate,
    cancelOnSwitch,
    stop
  }
}
