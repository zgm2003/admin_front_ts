import request from '@/lib/http'
import type { MessageBlock } from './messages'

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
  onImageGenerating?: (data: { prompt: string }) => void
  onImageDone?: (data: { url: string; block: MessageBlock }) => void
  onDone?: (data: { conversation_id: number; run_id: number; user_message_id: number; assistant_message_id: number | null }) => void
  onError?: (msg: string) => void
}

type StreamEventPayload = Record<string, unknown>

interface StreamStartResponse {
  conversation_id: number
  run_id: number
  request_id: string
  user_message_id: number
  agent_id: number
  is_new: boolean
}

interface StreamEventItem {
  id: string
  event: string
  data: StreamEventPayload
}

interface StreamEventsResponse {
  events: StreamEventItem[]
  last_id: string
  run_status: number
  terminal: boolean
  error_msg: string
}

const RUN_STATUS_FAIL = 3
const STREAM_POLL_INTERVAL = 80
const STREAM_TERMINAL_GRACE_POLLS = 3

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

function optionalNumberField(data: StreamEventPayload, field: string): number | null {
  const value = data[field]
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'number') {
    throw new TypeError(`AiChat stream event missing number field: ${field}`)
  }
  return value
}

function optionalStringField(data: StreamEventPayload, field: string): string {
  const value = data[field]
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value !== 'string') {
    throw new TypeError(`AiChat stream event missing string field: ${field}`)
  }
  return value
}

function requireMessageBlockField(data: StreamEventPayload, field: string): MessageBlock {
  const value = data[field]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`AiChat stream event missing object field: ${field}`)
  }
  return value as MessageBlock
}

function dispatchStreamEvent(
  event: string,
  data: StreamEventPayload,
  callbacks: StreamCallbacks
): boolean {
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
    case 'run_started':
      break
    case 'done':
    case 'canceled':
      callbacks.onDone?.({
        conversation_id: requireNumberField(data, 'conversation_id'),
        run_id: requireNumberField(data, 'run_id'),
        user_message_id: requireNumberField(data, 'user_message_id'),
        assistant_message_id: optionalNumberField(data, 'assistant_message_id'),
      })
      return true
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
    case 'image_generating':
      callbacks.onImageGenerating?.({
        prompt: optionalStringField(data, 'prompt'),
      })
      break
    case 'image_done':
      callbacks.onImageDone?.({
        url: optionalStringField(data, 'url'),
        block: requireMessageBlockField(data, 'block'),
      })
      break
    case 'error':
      callbacks.onError?.(requireStringField(data, 'msg'))
      return true
  }

  return false
}

async function streamByPolling(params: StreamParams, callbacks: StreamCallbacks): Promise<void> {
  const start = await request.post<StreamStartResponse>('/api/admin/AiChat/start', params)
  callbacks.onConversation?.(start.conversation_id)
  callbacks.onRun?.(start.run_id, start.request_id)

  let lastId = '0-0'
  let terminalEventReceived = false
  let emptyTerminalPolls = 0

  while (!terminalEventReceived) {
    const result = await request.post<StreamEventsResponse>('/api/admin/AiChat/events', {
      run_id: start.run_id,
      last_id: lastId,
      timeout_ms: 50,
    })

    lastId = result.last_id || lastId

    for (const item of result.events) {
      lastId = item.id || lastId
      terminalEventReceived = dispatchStreamEvent(item.event, item.data, callbacks)
      if (terminalEventReceived) {
        return
      }
    }

    if (result.terminal) {
      if (result.events.length === 0 && emptyTerminalPolls < STREAM_TERMINAL_GRACE_POLLS) {
        emptyTerminalPolls += 1
        await delay(STREAM_POLL_INTERVAL)
        continue
      }

      if (result.run_status === RUN_STATUS_FAIL && result.error_msg) {
        callbacks.onError?.(result.error_msg)
      } else {
        callbacks.onError?.('AI stream ended without a terminal event')
      }
      return
    }

    emptyTerminalPolls = 0
    if (result.events.length === 0) {
      await delay(STREAM_POLL_INTERVAL)
    }
  }
}

export const AiChatApi = {
  // 发送消息并获取 AI 回复（非流式）
  send: (params: {
    content: string
    conversation_id?: number
    agent_id?: number
    max_history?: number
  }) => request.post('/api/admin/AiChat/send', params),

  // 发送消息并获取 AI 回复（streamable 短轮询，避免 Windows 本地 SSE 单 worker 阻塞）
  stream: (params: StreamParams, callbacks: StreamCallbacks): Promise<void> => {
    return streamByPolling(params, callbacks)
  },

  // 取消流式输出
  cancel: (runId: number): Promise<{ run_id: number; status: string }> =>
    request.post('/api/admin/AiChat/cancel', { run_id: runId }),
}
