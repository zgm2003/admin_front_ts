import request, { streamPost } from '@/utils/request'

export interface Attachment {
  type: 'image'
  url: string
  name: string
  size: number
}

export interface StreamParams {
  content: string
  conversation_id?: number
  agent_id?: number
  max_history?: number
  attachments?: Attachment[]
  temperature?: number
  max_tokens?: number
}

export interface StreamCallbacks {
  onContent?: (delta: string) => void
  onConversation?: (conversationId: number) => void
  onRun?: (runId: number, requestId: string) => void
  onDone?: (data: { conversation_id: number; run_id: number; user_message_id: number; assistant_message_id: number }) => void
  onError?: (msg: string) => void
}

export const AiChatApi = {
  // 发送消息并获取 AI 回复（非流式）
  send: (params: {
    content: string
    conversation_id?: number
    agent_id?: number
    max_history?: number
    temperature?: number
    max_tokens?: number
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
          case 'run':
            callbacks.onRun?.(data.run_id, data.request_id)
            break
          case 'done':
            doneReceived = true
            callbacks.onDone?.(data)
            return true
          case 'canceled':
            doneReceived = true
            callbacks.onDone?.(data)
            return true
          case 'error':
            callbacks.onError?.(data.msg || '未知错误')
            return true
        }
      },
      onError: callbacks.onError,
      onComplete: () => {
        if (!doneReceived) {
          callbacks.onDone?.({ conversation_id: 0, run_id: 0 })
        }
      },
    })
  },

  // 取消流式输出
  cancel: (runId: number): Promise<{ run_id: number; status: string }> =>
    request.post('/api/admin/AiChat/cancel', { run_id: runId }),
}
