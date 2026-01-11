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
}

export interface StreamCallbacks {
  onContent?: (delta: string) => void
  onConversation?: (conversationId: number) => void
  onRun?: (runId: number, requestId: string) => void
  onDone?: (data: { conversation_id: number; run_id: number }) => void
  onError?: (msg: string) => void
}

// Run 状态枚举
export const RUN_STATUS = {
  RUNNING: 1,
  SUCCESS: 2,
  FAIL: 3,
  CANCELED: 4,
} as const

// 恢复状态
export const RESUME_STATUS = {
  RUNNING: 'running',
  SUCCESS: 'success',
  FAIL: 'fail',
} as const

export interface ResumeResult {
  run_id: number
  conversation_id: number
  status: 'running' | 'success' | 'fail'
  content: string
  content_length: number
  is_complete: boolean
  can_subscribe: boolean
  error_msg: string | null
  result: any
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
          case 'run':
            callbacks.onRun?.(data.run_id, data.request_id)
            break
          case 'done':
            doneReceived = true
            callbacks.onDone?.(data)
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
          callbacks.onDone?.({ conversation_id: 0, run_id: 0 })
        }
      },
    })
  },

  // 恢复/获取流式输出状态（用于会话切换后恢复）
  resume: (runId: number): Promise<ResumeResult> =>
    request.post('/api/admin/AiChat/resume', { run_id: runId }),

  // 续传流式输出（SSE）
  resumeStream: (runId: number, offset: number, callbacks: StreamCallbacks): Promise<void> => {
    let doneReceived = false
    return streamPost('/api/admin/AiChat/resumeStream', { run_id: runId, offset }, {
      onEvent: (event, data) => {
        switch (event) {
          case 'content':
            callbacks.onContent?.(data.delta || '')
            break
          case 'done':
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
}
