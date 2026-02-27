import { ref, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AiChatApi } from '@/api/ai/chat'
import { AiMessageApi } from '@/api/ai/messages'
import { AiRoleEnum } from '@/enums'
import type { StreamCallbacks, Attachment, StreamChatOptions, Message } from './types'
import type { ChatSession } from './useChatSessionManager'

// SSE 渲染节流配置
const FLUSH_INTERVAL = 50
const SCROLL_THROTTLE = 100

export interface StreamChatOptionsV2 extends StreamChatOptions {
  getActiveAgentId: () => number | null
  getSession: (agentId: number) => ChatSession | undefined
  getRuntimeParams?: () => Record<string, number>
}

export function useStreamChat(options: StreamChatOptionsV2) {
  const { t } = useI18n()
  const {
    messages, conversations, currentConversationId,
    selectedAgentId, selectedAgent, scrollToBottom,
    getActiveAgentId, getSession, getRuntimeParams,
  } = options

  const sending = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const currentRunId = ref<number | null>(null)

  const flushTimers = new Map<number, ReturnType<typeof setTimeout>>()
  let lastScrollTime = 0
  let rafId: number | null = null

  const clearAgentTimer = (agentId: number) => {
    const timer = flushTimers.get(agentId)
    if (timer) { clearTimeout(timer); flushTimers.delete(agentId) }
  }

  const clearAllTimers = () => {
    flushTimers.forEach(timer => clearTimeout(timer))
    flushTimers.clear()
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  }

  const throttledScroll = () => {
    const now = Date.now()
    if (now - lastScrollTime >= SCROLL_THROTTLE) {
      lastScrollTime = now
      rafId = requestAnimationFrame(() => { scrollToBottom(); rafId = null })
    }
  }

  const isActiveAgent = (agentId: number): boolean => getActiveAgentId() === agentId

  const flushBuffer = (agentId: number) => {
    const session = getSession(agentId)
    if (!session || !session.deltaBuffer) return

    if (isActiveAgent(agentId)) {
      streamingContent.value += session.deltaBuffer
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
        lastMsg.content = streamingContent.value
      }
      session.deltaBuffer = ''
      session.streamingContent = streamingContent.value
      throttledScroll()
    } else {
      session.streamingContent += session.deltaBuffer
      const lastMsg = session.messages[session.messages.length - 1]
      if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
        lastMsg.content = session.streamingContent
      }
      session.deltaBuffer = ''
    }
  }

  const startFlushTimer = (agentId: number) => {
    if (flushTimers.has(agentId)) return
    const timer = setTimeout(() => {
      flushTimers.delete(agentId)
      flushBuffer(agentId)
      const session = getSession(agentId)
      if (session?.isStreaming && session.deltaBuffer) {
        startFlushTimer(agentId)
      }
    }, FLUSH_INTERVAL)
    flushTimers.set(agentId, timer)
  }

  const createCallbacks = (
    requestAgentId: number,
    _requestConversationId: number | null,
    onNewConversation?: (id: number) => void
  ): StreamCallbacks => ({
    onContent: (delta) => {
      const session = getSession(requestAgentId)
      if (!session) return
      session.deltaBuffer += delta
      startFlushTimer(requestAgentId)
    },
    onConversation: (conversationId) => {
      const session = getSession(requestAgentId)
      if (isActiveAgent(requestAgentId)) {
        onNewConversation?.(conversationId)
      } else if (session && !session.conversationId) {
        session.conversationId = conversationId
        session.conversations.unshift({
          id: conversationId, title: '', agent_id: requestAgentId,
          last_message_at: new Date().toISOString()
        })
      }
    },
    onRun: (runId) => {
      const session = getSession(requestAgentId)
      if (session) session.currentRunId = runId
      if (isActiveAgent(requestAgentId)) currentRunId.value = runId
    },
    onDone: (data) => {
      const session = getSession(requestAgentId)
      if (!session) return

      flushBuffer(requestAgentId)
      clearAgentTimer(requestAgentId)

      session.isStreaming = false
      session.sending = false
      session.streamingContent = ''
      session.currentRunId = null
      session.deltaBuffer = ''
      const sLastMsg = session.messages[session.messages.length - 1]
      if (sLastMsg) sLastMsg.isStreaming = false

      if (data.assistant_message_id) {
        const aiMsg = [...session.messages].reverse().find(m => m.role === AiRoleEnum.ASSISTANT)
        if (aiMsg) aiMsg.id = data.assistant_message_id
      }
      if (data.user_message_id) {
        const userMsg = [...session.messages].reverse().find(m => m.role === AiRoleEnum.USER)
        if (userMsg) userMsg.id = data.user_message_id
      }

      const convId = data.conversation_id || session.conversationId
      if (convId) {
        const conv = session.conversations.find(c => c.id === convId)
        if (conv) conv.last_message_at = new Date().toISOString()
      }

      if (isActiveAgent(requestAgentId)) {
        isStreaming.value = false
        sending.value = false
        streamingContent.value = ''
        currentRunId.value = null
        const uiLastMsg = messages.value[messages.value.length - 1]
        if (uiLastMsg) uiLastMsg.isStreaming = false
        if (data.assistant_message_id) {
          const aiMsg = [...messages.value].reverse().find(m => m.role === AiRoleEnum.ASSISTANT)
          if (aiMsg) aiMsg.id = data.assistant_message_id
        }
        if (data.user_message_id) {
          const userMsg = [...messages.value].reverse().find(m => m.role === AiRoleEnum.USER)
          if (userMsg) userMsg.id = data.user_message_id
        }
        if (convId) {
          const uiConv = conversations.value.find(c => c.id === convId)
          if (uiConv) uiConv.last_message_at = new Date().toISOString()
        }
        nextTick(() => scrollToBottom())
      }
    },
    onToolCall: (data) => {
      const session = getSession(requestAgentId)
      if (!session) return
      const lastMsg = session.messages[session.messages.length - 1]
      if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT) {
        if (!lastMsg.tool_calls) lastMsg.tool_calls = []
        lastMsg.tool_calls.push({
          call_id: data.call_id,
          tool_name: data.tool_name,
          tool_inputs: data.tool_inputs,
          status: 'calling'
        })
      }
      if (isActiveAgent(requestAgentId)) {
        messages.value = [...messages.value]
      }
    },
    onToolResult: (data) => {
      const session = getSession(requestAgentId)
      if (!session) return
      const lastMsg = session.messages[session.messages.length - 1]
      if (lastMsg && lastMsg.tool_calls) {
        const tc = lastMsg.tool_calls.find(t => t.call_id === data.call_id)
        if (tc) {
          tc.tool_result = data.tool_result
          tc.status = 'done'
        }
      }
      if (isActiveAgent(requestAgentId)) {
        messages.value = [...messages.value]
      }
    },
    onError: (msg) => {
      clearAgentTimer(requestAgentId)
      const session = getSession(requestAgentId)
      if (session) {
        session.deltaBuffer = ''
        session.isStreaming = false
        session.sending = false
        session.streamingContent = ''
        session.currentRunId = null
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) {
          session.messages.pop()
        }
      }
      if (isActiveAgent(requestAgentId)) {
        isStreaming.value = false
        sending.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: msg })
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) {
          messages.value.pop()
        }
      }
    }
  })


  const addAiPlaceholder = (agentId: number): Message => {
    const aiMessage: Message = {
      id: -(Date.now() + Math.random()),
      role: AiRoleEnum.ASSISTANT,
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true
    }
    const session = getSession(agentId)
    if (session) session.messages.push(aiMessage)
    if (isActiveAgent(agentId)) messages.value.push(aiMessage)
    return aiMessage
  }

  const send = async (content: string, attachments?: Attachment[]) => {
    if (sending.value) return

    const agentId = selectedAgentId.value
    if (!currentConversationId.value && !agentId) {
      ElNotification.warning({ message: t('aiChat.noAgentTip') })
      return
    }

    const session = agentId ? getSession(agentId) : undefined

    sending.value = true
    isStreaming.value = true
    streamingContent.value = ''
    currentRunId.value = null

    if (session) {
      session.sending = true
      session.isStreaming = true
      session.streamingContent = ''
      session.currentRunId = null
      session.deltaBuffer = ''
    }

    const requestConversationId = currentConversationId.value

    const userMessage: Message = {
      id: -(Date.now() + Math.random()),
      role: AiRoleEnum.USER,
      content,
      created_at: new Date().toISOString(),
      meta_json: attachments?.length ? { attachments } : undefined
    }
    messages.value.push(userMessage)
    if (session) session.messages.push({ ...userMessage, meta_json: userMessage.meta_json ? { ...userMessage.meta_json } : undefined })
    await nextTick()
    scrollToBottom()

    addAiPlaceholder(agentId!)

    try {
      const callbacks = createCallbacks(agentId!, requestConversationId, (conversationId) => {
        if (!currentConversationId.value) {
          currentConversationId.value = conversationId
          const newConv = {
            id: conversationId,
            title: '',
            agent_id: selectedAgentId.value ?? undefined,
            agent_name: selectedAgent.value?.name || '',
            last_message_at: new Date().toISOString()
          }
          conversations.value.unshift(newConv)
          if (session) {
            session.conversationId = conversationId
            if (!session.conversations.some(c => c.id === conversationId)) {
              session.conversations.unshift({ ...newConv })
            }
          }
        }
      })

      await AiChatApi.stream({
        content,
        conversation_id: currentConversationId.value || undefined,
        agent_id: currentConversationId.value ? undefined : agentId ?? undefined,
        attachments: attachments?.length ? attachments : undefined,
        ...getRuntimeParams?.()
      }, callbacks)
    } catch (error: any) {
      clearAgentTimer(agentId!)
      if (session) {
        session.deltaBuffer = ''
        session.isStreaming = false
        session.sending = false
        session.streamingContent = ''
        session.currentRunId = null
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) session.messages.pop()
      }
      if (isActiveAgent(agentId!)) {
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: error.message || t('aiChat.sendFailed') })
        messages.value.pop()
      }
    } finally {
      sending.value = false
      if (session) session.sending = false
    }
  }

  const regenerate = async (msg: Message) => {
    if (sending.value) return

    const agentId = selectedAgentId.value
    if (!agentId) return

    const msgIndex = messages.value.findIndex(m => m.id === msg.id)
    if (msgIndex <= 0) return

    const userMsg = messages.value[msgIndex - 1]
    if (!userMsg || userMsg.role !== AiRoleEnum.USER) {
      ElNotification.warning({ message: t('aiChat.userMessageNotFound') })
      return
    }

    try { await AiMessageApi.del({ id: msg.id }) } catch { /* ignore */ }

    messages.value.splice(msgIndex, 1)
    const session = getSession(agentId)
    if (session) {
      const sIdx = session.messages.findIndex(m => m.id === msg.id)
      if (sIdx >= 0) session.messages.splice(sIdx, 1)
    }

    sending.value = true
    isStreaming.value = true
    streamingContent.value = ''
    currentRunId.value = null

    if (session) {
      session.sending = true
      session.isStreaming = true
      session.streamingContent = ''
      session.currentRunId = null
      session.deltaBuffer = ''
    }

    const requestConversationId = currentConversationId.value

    addAiPlaceholder(agentId)
    await nextTick()
    scrollToBottom()

    try {
      const callbacks = createCallbacks(agentId, requestConversationId)
      await AiChatApi.stream({
        content: userMsg.content,
        conversation_id: currentConversationId.value!,
        ...getRuntimeParams?.()
      }, callbacks)
    } catch (error: any) {
      clearAgentTimer(agentId)
      if (session) {
        session.deltaBuffer = ''
        session.isStreaming = false
        session.sending = false
        session.streamingContent = ''
        session.currentRunId = null
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) session.messages.pop()
      }
      if (isActiveAgent(agentId)) {
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: error.message || t('aiChat.regenerateFailed') })
        messages.value.pop()
      }
    } finally {
      sending.value = false
      if (session) session.sending = false
    }
  }

  const stop = async () => {
    if (!isStreaming.value || !currentRunId.value) return

    const agentId = selectedAgentId.value
    const runId = currentRunId.value

    try {
      await AiChatApi.cancel(runId)

      if (agentId) { flushBuffer(agentId); clearAgentTimer(agentId) }

      const session = agentId ? getSession(agentId) : undefined
      if (session) {
        session.isStreaming = false
        session.sending = false
        session.streamingContent = ''
        session.currentRunId = null
        session.deltaBuffer = ''
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.isStreaming) lastMsg.isStreaming = false
      }

      isStreaming.value = false
      sending.value = false
      streamingContent.value = ''
      currentRunId.value = null
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.isStreaming) lastMsg.isStreaming = false
    } catch (error: any) {
      ElNotification.error({ message: error.message || t('aiChat.stopFailed') })
    }
  }

  const editAndResend = async (msg: Message, newContent: string) => {
    if (sending.value) return

    const agentId = selectedAgentId.value
    if (!agentId || !currentConversationId.value) return

    // 1. 后端：更新消息内容 + 删除后续消息
    try {
      await AiMessageApi.editContent({ id: msg.id, content: newContent })
    } catch (error: any) {
      ElNotification.error({ message: error.message || t('aiChat.editFailed') })
      return
    }

    // 2. 前端：更新消息内容 + 移除后续消息
    const msgIndex = messages.value.findIndex(m => m.id === msg.id)
    if (msgIndex < 0) return

    messages.value[msgIndex].content = newContent
    messages.value.splice(msgIndex + 1)

    const session = getSession(agentId)
    if (session) {
      const sIdx = session.messages.findIndex(m => m.id === msg.id)
      if (sIdx >= 0) {
        session.messages[sIdx].content = newContent
        session.messages.splice(sIdx + 1)
      }
    }

    // 3. 重新发送（复用 stream 逻辑）
    sending.value = true
    isStreaming.value = true
    streamingContent.value = ''
    currentRunId.value = null

    if (session) {
      session.sending = true
      session.isStreaming = true
      session.streamingContent = ''
      session.currentRunId = null
      session.deltaBuffer = ''
    }

    addAiPlaceholder(agentId)
    await nextTick()
    scrollToBottom()

    try {
      const callbacks = createCallbacks(agentId, currentConversationId.value)
      await AiChatApi.stream({
        content: newContent,
        conversation_id: currentConversationId.value!,
        ...getRuntimeParams?.()
      }, callbacks)
    } catch (error: any) {
      clearAgentTimer(agentId)
      if (session) {
        session.deltaBuffer = ''
        session.isStreaming = false
        session.sending = false
        session.streamingContent = ''
        session.currentRunId = null
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.role === AiRoleEnum.ASSISTANT && lastMsg.isStreaming) session.messages.pop()
      }
      if (isActiveAgent(agentId)) {
        isStreaming.value = false
        streamingContent.value = ''
        currentRunId.value = null
        ElNotification.error({ message: error.message || t('aiChat.editFailed') })
        messages.value.pop()
      }
    } finally {
      sending.value = false
      if (session) session.sending = false
    }
  }

  onUnmounted(() => { clearAllTimers() })

  return {
    sending,
    isStreaming,
    currentRunId,
    streamingContent,
    send,
    regenerate,
    editAndResend,
    stop
  }
}