import request, { streamPost } from '@/lib/http'

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
  onToolCall?: (data: { call_id: string; tool_name: string; tool_inputs: Record<string, unknown> }) => void
  onToolResult?: (data: { call_id: string; tool_name: string; tool_result: string }) => void
  onDone?: (data: { conversation_id: number; run_id: number; user_message_id: number; assistant_message_id: number }) => void
  onError?: (msg: string) => void
}

type StreamEventPayload = Record<string, unknown>

function requireStringField(data: StreamEventPayload, field: string): string {
  const value = data[field]
  if (typeof value !== 'string') {
    throw new TypeError(`AiChat stream event missing string field: ${field}`)
  }
  return value
}

function requireNumberField(data: StreamEventPayload, field: string): number {
  const value = data[field]
  if (typeof value !== 'number') {
    throw new TypeError(`AiChat stream event missing number field: ${field}`)
  }
  return value
}

function requireObjectField(data: StreamEventPayload, field: string): Record<string, unknown> {
  const value = data[field]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`AiChat stream event missing object field: ${field}`)
  }
  return value as Record<string, unknown>
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
    let terminalEventReceived = false
    return streamPost('/api/admin/AiChat/stream', params, {
      onEvent: (event, rawData) => {
        const data = rawData as StreamEventPayload
        switch (event) {
          case 'content':
            callbacks.onContent?.(requireStringField(data, 'delta'))
            break
          case 'conversation':
            callbacks.onConversation?.(requireNumberField(data, 'conversation_id'))
            break
          case 'run':
            callbacks.onRun?.(
              requireNumberField(data, 'run_id'),
              requireStringField(data, 'request_id')
            )
            break
          case 'done':
          case 'canceled': {
            terminalEventReceived = true
            callbacks.onDone?.({
              conversation_id: requireNumberField(data, 'conversation_id'),
              run_id: requireNumberField(data, 'run_id'),
              user_message_id: requireNumberField(data, 'user_message_id'),
              assistant_message_id: requireNumberField(data, 'assistant_message_id'),
            })
            return true
          }
          case 'tool_call':
            callbacks.onToolCall?.({
              call_id: requireStringField(data, 'call_id'),
              tool_name: requireStringField(data, 'tool_name'),
              tool_inputs: requireObjectField(data, 'tool_inputs'),
            })
            break
          case 'tool_result':
            callbacks.onToolResult?.({
              call_id: requireStringField(data, 'call_id'),
              tool_name: requireStringField(data, 'tool_name'),
              tool_result: requireStringField(data, 'tool_result'),
            })
            break
          case 'error':
            terminalEventReceived = true
            callbacks.onError?.(requireStringField(data, 'msg'))
            return true
        }
      },
      onError: callbacks.onError,
      onComplete: () => {
        if (!terminalEventReceived) {
          callbacks.onError?.('SSE stream ended without a terminal event')
        }
      },
    })
  },

  // 取消流式输出
  cancel: (runId: number): Promise<{ run_id: number; status: string }> =>
    request.post('/api/admin/AiChat/cancel', { run_id: runId }),
}
