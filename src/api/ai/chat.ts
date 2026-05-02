import request from '@/lib/http'
import { onWsMessage } from '@/lib/realtime/message-bus'
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

interface RunEventWsData extends Record<string, unknown> {
  run_id: number
  event_id: string
  event: string
  payload: StreamEventPayload
}

const RUN_STATUS_FAIL = 3
const STREAM_POLL_INTERVAL = 80
const STREAM_REALTIME_POLL_INTERVAL = 500
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

function normalizeWsRunEvent(data: Record<string, unknown>, runId: number): StreamEventItem | null {
  if (data.run_id !== runId) {
    return null
  }

  if (typeof data.event_id !== 'string' || typeof data.event !== 'string') {
    return null
  }

  const payload = data.payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  return {
    id: data.event_id,
    event: data.event,
    data: payload as StreamEventPayload,
  }
}

function isNewerStreamId(candidate: string, current: string): boolean {
  const candidateParts = parseStreamId(candidate)
  if (!candidateParts) {
    return false
  }

  const currentParts = parseStreamId(current)
  if (!currentParts) {
    return true
  }

  const [candidateMs, candidateSeq] = candidateParts
  const [currentMs, currentSeq] = currentParts
  return candidateMs > currentMs || (candidateMs === currentMs && candidateSeq > currentSeq)
}

function parseStreamId(value: string): [number, number] | null {
  const parts = value.split('-')
  if (parts.length !== 2) {
    return null
  }

  const ms = Number(parts[0])
  const seq = Number(parts[1])
  if (!Number.isFinite(ms) || !Number.isFinite(seq)) {
    return null
  }

  return [ms, seq]
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

async function streamByRunEvents(params: StreamParams, callbacks: StreamCallbacks): Promise<void> {
  const start = await request.post<StreamStartResponse>('/api/admin/AiChat/start', params)
  callbacks.onConversation?.(start.conversation_id)
  callbacks.onRun?.(start.run_id, start.request_id)

  let lastId = '0-0'
  let terminalEventReceived = false
  let emptyTerminalPolls = 0
  let realtimeEventReceived = false
  const seenEventIds = new Set<string>()

  const dispatchUniqueEvent = (item: StreamEventItem) => {
    if (terminalEventReceived) {
      return true
    }

    if (item.id) {
      if (seenEventIds.has(item.id)) {
        return false
      }
      seenEventIds.add(item.id)
      if (isNewerStreamId(item.id, lastId)) {
        lastId = item.id
      }
    }

    terminalEventReceived = dispatchStreamEvent(item.event, item.data, callbacks)
    return terminalEventReceived
  }

  const unsubscribeRunEvent = onWsMessage<RunEventWsData>('ai_run_event', (message) => {
    const item = normalizeWsRunEvent(message.data, start.run_id)
    if (!item) {
      return
    }

    realtimeEventReceived = true
    dispatchUniqueEvent(item)
  })

  try {
    while (!terminalEventReceived) {
      const result = await request.post<StreamEventsResponse>('/api/admin/AiChat/events', {
        run_id: start.run_id,
        last_id: lastId,
        timeout_ms: 50,
      })

      if (terminalEventReceived) {
        return
      }

      if (result.last_id && isNewerStreamId(result.last_id, lastId)) {
        lastId = result.last_id
      }

      for (const item of result.events) {
        if (dispatchUniqueEvent(item)) {
          return
        }
      }

      if (result.terminal) {
        if (result.events.length === 0 && emptyTerminalPolls < STREAM_TERMINAL_GRACE_POLLS) {
          emptyTerminalPolls += 1
          await delay(realtimeEventReceived ? STREAM_REALTIME_POLL_INTERVAL : STREAM_POLL_INTERVAL)
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
        await delay(realtimeEventReceived ? STREAM_REALTIME_POLL_INTERVAL : STREAM_POLL_INTERVAL)
      }
    }
  } finally {
    unsubscribeRunEvent()
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

  // 发送消息并获取 AI 回复（WebSocket 实时推送 + streamable events 补拉）
  stream: (params: StreamParams, callbacks: StreamCallbacks): Promise<void> => {
    return streamByRunEvents(params, callbacks)
  },

  // 取消流式输出
  cancel: (runId: number): Promise<{ run_id: number; status: string }> =>
    request.post('/api/admin/AiChat/cancel', { run_id: runId }),
}
