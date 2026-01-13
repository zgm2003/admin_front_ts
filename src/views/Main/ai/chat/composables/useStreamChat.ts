import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AiChatApi } from '@/api/ai/chat'
import { AiMessageApi } from '@/api/ai/messages'
import { AiRoleEnum } from '@/enums'
import type { StreamCallbacks, Attachment, StreamChatOptions, Message } from './types'

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

  // 创建流式回调
  const createCallbacks = (
    requestConversationId: number | null,
    onNewConversation?: (id: number) => void
  ): StreamCallbacks => {
    return {
      onContent: (delta) => {
        // 会话已切换，忽略
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) return
        streamingContent.value += delta
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
          lastMsg.content = streamingContent.value
        }
        nextTick(() => scrollToBottom())
      },
      onConversation: onNewConversation,
      onRun: (runId) => {
        currentRunId.value = runId
      },
      onDone: (data) => {
        // 会话已切换，只重置状态，不更新 UI
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) {
          return
        }
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) lastMsg.isStreaming = false
        
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
      id: Date.now(),
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

    const requestConversationId = currentConversationId.value

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
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
      
      if (isStreaming.value) {
        isStreaming.value = false
        sending.value = false
        streamingContent.value = ''
        currentRunId.value = null
        
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.isStreaming) {
          lastMsg.isStreaming = false
        }
      }
    } catch (error: any) {
      ElNotification.error({ message: error.message || t('aiChat.stopFailed') })
    }
  }

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
