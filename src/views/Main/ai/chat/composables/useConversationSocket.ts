import { onUnmounted } from 'vue'
import { onWsMessage } from '@/lib/realtime/message-bus'
import {
  AI_RESPONSE_EVENTS,
  type AiResponseCompletedPayload,
  type AiResponseDeltaPayload,
  type AiResponseFailedPayload,
  type AiResponseStartPayload,
} from '@/api/ai/chat'
import type { WsMessageData } from '@/lib/realtime/message-bus'

interface SocketHandlers {
  onStart: (payload: AiResponseStartPayload) => void
  onDelta: (payload: AiResponseDeltaPayload) => void
  onCompleted: (payload: AiResponseCompletedPayload) => void
  onFailed: (payload: AiResponseFailedPayload) => void
}

function numberField(data: WsMessageData, key: string): number | null {
  const value = data[key]
  return typeof value === 'number' ? value : null
}

function stringField(data: WsMessageData, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' ? value : null
}

function startPayload(data: WsMessageData): AiResponseStartPayload | null {
  const conversationId = numberField(data, 'conversation_id')
  const requestId = stringField(data, 'request_id')
  const userMessageId = numberField(data, 'user_message_id')
  const agentId = numberField(data, 'agent_id')
  if (conversationId === null || requestId === null || userMessageId === null || agentId === null) return null
  return { conversation_id: conversationId, request_id: requestId, user_message_id: userMessageId, agent_id: agentId }
}

function deltaPayload(data: WsMessageData): AiResponseDeltaPayload | null {
  const conversationId = numberField(data, 'conversation_id')
  const requestId = stringField(data, 'request_id')
  const delta = stringField(data, 'delta')
  if (conversationId === null || requestId === null || delta === null) return null
  return { conversation_id: conversationId, request_id: requestId, delta }
}

function completedPayload(data: WsMessageData): AiResponseCompletedPayload | null {
  const conversationId = numberField(data, 'conversation_id')
  const requestId = stringField(data, 'request_id')
  const assistantMessageId = numberField(data, 'assistant_message_id')
  if (conversationId === null || requestId === null || assistantMessageId === null) return null
  return { conversation_id: conversationId, request_id: requestId, assistant_message_id: assistantMessageId }
}

function failedPayload(data: WsMessageData): AiResponseFailedPayload | null {
  const conversationId = numberField(data, 'conversation_id')
  const requestId = stringField(data, 'request_id')
  const msg = stringField(data, 'msg')
  if (conversationId === null || requestId === null || msg === null) return null
  return { conversation_id: conversationId, request_id: requestId, msg }
}

export function useConversationSocket(handlers: SocketHandlers) {
  const unsubscribe = [
    onWsMessage(AI_RESPONSE_EVENTS.start, ({ data }) => {
      const payload = startPayload(data)
      if (payload) handlers.onStart(payload)
    }),
    onWsMessage(AI_RESPONSE_EVENTS.delta, ({ data }) => {
      const payload = deltaPayload(data)
      if (payload) handlers.onDelta(payload)
    }),
    onWsMessage(AI_RESPONSE_EVENTS.completed, ({ data }) => {
      const payload = completedPayload(data)
      if (payload) handlers.onCompleted(payload)
    }),
    onWsMessage(AI_RESPONSE_EVENTS.failed, ({ data }) => {
      const payload = failedPayload(data)
      if (payload) handlers.onFailed(payload)
    }),
  ]

  onUnmounted(() => {
    unsubscribe.forEach((dispose) => dispose())
  })
}
