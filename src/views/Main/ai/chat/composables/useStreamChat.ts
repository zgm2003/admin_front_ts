import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AiChatApi } from '@/api/ai/chat'
import { AiMessageApi } from '@/api/ai/messages'
import { AiConversationApi } from '@/api/ai/conversations'
import { AiRoleEnum } from '@/enums'
import type { StreamCallbacks, Attachment, StreamChatOptions, CreateCallbacksOptions, Message, PendingRun } from './types'

export function useStreamChat(options: StreamChatOptions) {
  const { t } = useI18n()
  const {
    messages,
    conversations,
    currentConversationId,
    selectedAgentId,
    selectedAgent,
    scrollToBottom,
    loadMessages
  } = options

  const sending = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const currentRunId = ref<number | null>(null)
  const pendingRuns = ref<Map<number, PendingRun>>(new Map())

  // 创建流式回调
  const createCallbacks = (opts: CreateCallbacksOptions): StreamCallbacks => {
    const { requestConversationId, onNewConversation, onComplete } = opts

    return {
      onContent: (delta) => {
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) return
        streamingContent.value += delta
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
          lastMsg.content = streamingContent.value
        }
        nextTick(() => scrollToBottom())
      },
      onConversation: onNewConversation ?? (() => {}),
      onRun: (runId) => {
        currentRunId.value = runId
      },
      onDone: async () => {
        if (currentConversationId.value !== requestConversationId && requestConversationId !== null) return
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        if (requestConversationId) {
          pendingRuns.value.delete(requestConversationId)
        }
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg) lastMsg.isStreaming = false
        if (onComplete) await onComplete()
      },
      onError: (msg) => {
        handleError(requestConversationId, msg)
      }
    }
  }

  // 错误处理
  const handleError = (requestConversationId: number | null, errorMsg: string) => {
    if (currentConversationId.value === requestConversationId || requestConversationId === null) {
      isStreaming.value = false
      streamingContent.value = ''
      currentRunId.value = null
      ElNotification.error({ message: errorMsg })
      messages.value.pop()
    }
  }

  // 保存 pending run（切换会话时）
  const savePendingRun = () => {
    if (isStreaming.value && currentConversationId.value && currentRunId.value) {
      pendingRuns.value.set(currentConversationId.value, {
        runId: currentRunId.value,
        contentLength: streamingContent.value.length
      })
      isStreaming.value = false
      streamingContent.value = ''
      sending.value = false
      currentRunId.value = null
      // 移除未完成的 AI 占位消息
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) {
          messages.value.pop()
        }
      }
    }
  }

  // 添加 AI 占位消息
  const addAiPlaceholder = (content = ''): Message => {
    const aiMessage: Message = {
      id: Date.now(),
      role: AiRoleEnum.ASSISTANT,
      content,
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
      const callbacks = createCallbacks({
        requestConversationId,
        onNewConversation: (conversationId) => {
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
        },
        onComplete: async () => {
          if (currentConversationId.value) {
            const conv = conversations.value.find(c => c.id === currentConversationId.value)
            if (conv) {
              conv.last_message_at = new Date().toISOString()
              // 首次对话时获取自动生成的标题
              if (!conv.title) {
                try {
                  const detail = await AiConversationApi.detail({ id: currentConversationId.value })
                  conv.title = detail.title || ''
                } catch { /* ignore */ }
              }
            }
          }
        }
      })

      await AiChatApi.stream({
        content,
        conversation_id: currentConversationId.value || undefined,
        agent_id: currentConversationId.value ? undefined : agentId ?? undefined,
        attachments: attachments?.length ? attachments : undefined
      }, callbacks)
    } catch (error: any) {
      handleError(requestConversationId, error.message || t('aiChat.sendFailed'))
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
      const callbacks = createCallbacks({ requestConversationId })
      await AiChatApi.stream({
        content: userMsg.content,
        conversation_id: currentConversationId.value!
      }, callbacks)
    } catch (error: any) {
      handleError(requestConversationId, error.message || t('aiChat.regenerateFailed'))
    } finally {
      sending.value = false
    }
  }

  // 恢复流式输出
  const resume = async (conversationId: number) => {
    const pending = pendingRuns.value.get(conversationId)
    if (!pending) return

    try {
      const resumeData = await AiChatApi.resume(pending.runId)

      if (resumeData.is_complete) {
        pendingRuns.value.delete(conversationId)
        await loadMessages()
        return
      }

      if (resumeData.can_subscribe) {
        isStreaming.value = true
        sending.value = true
        streamingContent.value = resumeData.content
        currentRunId.value = pending.runId

        addAiPlaceholder(resumeData.content)
        await nextTick()
        scrollToBottom()

        // 复用回调工厂，但 resume 场景需要用固定的 conversationId
        const callbacks = createCallbacks({
          requestConversationId: conversationId,
          onComplete: async () => {
            const conv = conversations.value.find(c => c.id === conversationId)
            if (conv) conv.last_message_at = new Date().toISOString()
          }
        })

        await AiChatApi.resumeStream(pending.runId, resumeData.content_length, callbacks)
        sending.value = false
      } else {
        pendingRuns.value.delete(conversationId)
        await loadMessages()
      }
    } catch {
      pendingRuns.value.delete(conversationId)
      await loadMessages()
    }
  }

  return {
    sending,
    isStreaming,
    streamingContent,
    pendingRuns,
    send,
    regenerate,
    resume,
    savePendingRun
  }
}
