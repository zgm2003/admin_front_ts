import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'

export const AI_RESPONSE_EVENTS = {
  start: 'ai.response.start.v1',
  delta: 'ai.response.delta.v1',
  completed: 'ai.response.completed.v1',
  failed: 'ai.response.failed.v1',
} as const

export type AiResponseEventType = typeof AI_RESPONSE_EVENTS[keyof typeof AI_RESPONSE_EVENTS]

export interface AiResponseStartPayload {
  conversation_id: number
  request_id: string
  user_message_id: number
  agent_id: number
}

export interface AiResponseDeltaPayload {
  conversation_id: number
  request_id: string
  delta: string
}

export interface AiResponseCompletedPayload {
  conversation_id: number
  request_id: string
  assistant_message_id: number
}

export interface AiResponseFailedPayload {
  conversation_id: number
  request_id: string
  msg: string
}

export interface AiChatCancelResponse {
  conversation_id: number
  request_id: string
  status: 'canceled'
}

export function createAiRequestId() {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function positiveID(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`)
  return value
}

export const AiChatApi = {
  cancel: (params: { conversation_id: number; request_id: string }) => request.post<AiChatCancelResponse, { request_id: string }>(
    `${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, 'conversation id')}/messages/cancel`,
    { request_id: params.request_id }
  ),
}
