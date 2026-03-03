import request, { streamPost } from '@/utils/request'

export interface GenAiStreamParams {
  content: string
  conversation_id?: number
  allow_overwrite?: boolean
  enable_review?: boolean
  enable_test?: boolean
}

export interface GenAiStreamCallbacks {
  onPhase?: (phase: string, msg: string) => void
  onContent?: (delta: string) => void
  onConversation?: (conversationId: number) => void
  onToolCall?: (data: { call_id: string; tool_name: string; tool_inputs: Record<string, any> }) => void
  onToolResult?: (data: { call_id: string; tool_name: string; tool_result: string }) => void
  onTableCreated?: (data: { table_name: string; success: boolean; error?: string }) => void
  onTableAltered?: (data: { table_name: string; success: boolean; error?: string }) => void
  onFileWritten?: (data: { path: string; success: boolean; error?: string; is_new?: boolean; original?: string | null; content?: string }) => void
  onReview?: (delta: string) => void
  onTest?: (delta: string) => void
  onDone?: (data: { conversation_id: number; msg: string }) => void
  onError?: (msg: string) => void
}

export interface ConversationItem {
  id: number
  title: string
  last_message_at: string
  created_at: string
}

export interface MessageItem {
  id: number
  role: 'user' | 'assistant'
  content: string
  meta?: any
}

export const GenAiApi = {
  init: (params?: any) => request.post('/api/admin/DevTools/GenAi/init', params),

  conversations: (params?: { current_page?: number; page_size?: number }) =>
    request.post('/api/admin/DevTools/GenAi/conversations', params),

  messages: (params: { conversation_id: number }) =>
    request.post('/api/admin/DevTools/GenAi/messages', params),

  deleteConversation: (params: { id: number }) =>
    request.post('/api/admin/DevTools/GenAi/deleteConversation', params),

  stream: (params: GenAiStreamParams, callbacks: GenAiStreamCallbacks): Promise<void> => {
    return streamPost('/api/admin/DevTools/GenAi/stream', params, {
      onEvent: (event, data) => {
        switch (event) {
          case 'phase':
            callbacks.onPhase?.(data.phase, data.msg)
            break
          case 'content':
            callbacks.onContent?.(data.delta || '')
            break
          case 'conversation':
            callbacks.onConversation?.(data.conversation_id)
            break
          case 'tool_call':
            callbacks.onToolCall?.(data)
            break
          case 'tool_result':
            callbacks.onToolResult?.(data)
            break
          case 'table_created':
            callbacks.onTableCreated?.(data)
            break
          case 'table_altered':
            callbacks.onTableAltered?.(data)
            break
          case 'file_written':
            callbacks.onFileWritten?.(data)
            break
          case 'review':
            callbacks.onReview?.(data.delta || '')
            break
          case 'test':
            callbacks.onTest?.(data.delta || '')
            break
          case 'done':
            callbacks.onDone?.(data)
            return true
          case 'error':
            callbacks.onError?.(data.msg || '未知错误')
            return true
        }
      },
      onError: callbacks.onError,
    })
  },
}
