import request, { streamPost } from '@/utils/request'
import type { SSECallbacks } from '@/utils/request'

export interface StreamParams {
  content: string
  conversation_id?: number
  agent_id?: number
  max_history?: number
}

export interface StreamCallbacks {
  onContent?: (delta: string) => void
  onConversation?: (conversationId: number) => void
  onDone?: (conversationId: number) => void
  onError?: (msg: string) => void
}

export const AiChatApi = {
  // 发送消息并获取 AI 回复（非流式）
  send: (params: {
    content: string
    conversation_id?: number
    agent_id?: number
    max_history?: number
  }) => request.post('/api/admin/AiChat/send', params),

  // 发送消息并获取 AI 回复（流式 SSE）
  stream: (params: StreamParams, callbacks: StreamCallbacks): Promise<void> => {
    let doneReceived = false
    return streamPost('/api/admin/AiChat/stream', params, {
      onEvent: (event, data) => {
        switch (event) {
          case 'content':
            callbacks.onContent?.(data.delta || '')
            break
          case 'conversation':
            callbacks.onConversation?.(data.conversation_id)
            break
          case 'done':
            doneReceived = true
            callbacks.onDone?.(data.conversation_id)
            return true  // 返回 true 主动中断连接
          case 'error':
            callbacks.onError?.(data.msg || '未知错误')
            return true  // 错误也中断
        }
      },
      onError: callbacks.onError,
      onComplete: () => {
        // 如果没收到 done 事件，流结束时也要触发 onDone
        if (!doneReceived) {
          callbacks.onDone?.(0)
        }
      },
    })
  },
}
