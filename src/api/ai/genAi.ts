import request, { streamPost } from '@/lib/http'
import type { RequestPayload } from '@/types/common'

export interface GenAiStreamParams {
  content: string
  conversation_id?: number
  allow_overwrite?: boolean
  enable_review?: boolean
  enable_test?: boolean
}

export type GenAiPhase = 'idle' | 'researching' | 'generating' | 'reviewing' | 'testing' | 'done'

export interface GenAiStreamCallbacks {
  onPhase?: (phase: GenAiPhase, msg: string) => void
  onContent?: (delta: string) => void
  onConversation?: (conversationId: number) => void
  onToolCall?: (data: { call_id: string; tool_name: string; tool_inputs: Record<string, unknown> }) => void
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
  meta?: Record<string, unknown> | null
}

export interface GenAiInitResponse {
  agents: Array<{
    id: number
    name: string
    scene: string
  }>
}

export interface GenAiConversationListResponse {
  list: ConversationItem[]
  total: number
}

export interface GenAiMessageListResponse {
  list: MessageItem[]
}

type StreamEventPayload = Record<string, unknown>

function requireStringField(data: StreamEventPayload, field: string): string {
  const value = data[field]
  if (typeof value !== 'string') {
    throw new TypeError(`GenAi stream event missing string field: ${field}`)
  }
  return value
}

function requireNumberField(data: StreamEventPayload, field: string): number {
  const value = data[field]
  if (typeof value !== 'number') {
    throw new TypeError(`GenAi stream event missing number field: ${field}`)
  }
  return value
}

function requireBooleanField(data: StreamEventPayload, field: string): boolean {
  const value = data[field]
  if (typeof value !== 'boolean') {
    throw new TypeError(`GenAi stream event missing boolean field: ${field}`)
  }
  return value
}

function requireObjectField(data: StreamEventPayload, field: string): Record<string, unknown> {
  const value = data[field]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`GenAi stream event missing object field: ${field}`)
  }
  return value as Record<string, unknown>
}

function optionalStringField(data: StreamEventPayload, field: string): string | undefined {
  const value = data[field]
  if (value == null) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new TypeError(`GenAi stream event has invalid string field: ${field}`)
  }
  return value
}

function optionalBooleanField(data: StreamEventPayload, field: string): boolean | undefined {
  const value = data[field]
  if (value == null) {
    return undefined
  }
  if (typeof value !== 'boolean') {
    throw new TypeError(`GenAi stream event has invalid boolean field: ${field}`)
  }
  return value
}

function optionalNullableStringField(data: StreamEventPayload, field: string): string | null | undefined {
  const value = data[field]
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value !== 'string') {
    throw new TypeError(`GenAi stream event has invalid nullable string field: ${field}`)
  }
  return value
}

function requirePhaseField(data: StreamEventPayload, field: string): GenAiPhase {
  const value = requireStringField(data, field)
  if (
    value !== 'idle' &&
    value !== 'researching' &&
    value !== 'generating' &&
    value !== 'reviewing' &&
    value !== 'testing' &&
    value !== 'done'
  ) {
    throw new TypeError(`GenAi stream event has invalid phase value: ${value}`)
  }
  return value
}

export const GenAiApi = {
  init: (params?: RequestPayload) => request.post<GenAiInitResponse>('/api/admin/Ai/GenAi/init', params),

  conversations: (params?: { current_page?: number; page_size?: number }) =>
    request.post<GenAiConversationListResponse>('/api/admin/Ai/GenAi/conversations', params),

  messages: (params: { conversation_id: number }) =>
    request.post<GenAiMessageListResponse>('/api/admin/Ai/GenAi/messages', params),

  deleteConversation: (params: { id: number }) =>
    request.post('/api/admin/Ai/GenAi/deleteConversation', params),

  stream: (params: GenAiStreamParams, callbacks: GenAiStreamCallbacks): Promise<void> => {
    let terminalEventReceived = false
    return streamPost('/api/admin/Ai/GenAi/stream', params, {
      onEvent: (event, rawData) => {
        const data = rawData as StreamEventPayload
        switch (event) {
          case 'phase':
            callbacks.onPhase?.(
              requirePhaseField(data, 'phase'),
              requireStringField(data, 'msg')
            )
            break
          case 'content':
            callbacks.onContent?.(requireStringField(data, 'delta'))
            break
          case 'conversation':
            callbacks.onConversation?.(requireNumberField(data, 'conversation_id'))
            break
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
          case 'table_created':
            callbacks.onTableCreated?.({
              table_name: requireStringField(data, 'table_name'),
              success: requireBooleanField(data, 'success'),
              error: optionalStringField(data, 'error'),
            })
            break
          case 'table_altered':
            callbacks.onTableAltered?.({
              table_name: requireStringField(data, 'table_name'),
              success: requireBooleanField(data, 'success'),
              error: optionalStringField(data, 'error'),
            })
            break
          case 'file_written':
            callbacks.onFileWritten?.({
              path: requireStringField(data, 'path'),
              success: requireBooleanField(data, 'success'),
              error: optionalStringField(data, 'error'),
              is_new: optionalBooleanField(data, 'is_new'),
              original: optionalNullableStringField(data, 'original'),
              content: optionalStringField(data, 'content'),
            })
            break
          case 'review':
            callbacks.onReview?.(requireStringField(data, 'delta'))
            break
          case 'test':
            callbacks.onTest?.(requireStringField(data, 'delta'))
            break
          case 'done':
            terminalEventReceived = true
            callbacks.onDone?.({
              conversation_id: requireNumberField(data, 'conversation_id'),
              msg: requireStringField(data, 'msg'),
            })
            return true
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
}
