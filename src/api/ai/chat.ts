import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
export {
  AI_RESPONSE_EVENTS,
  type AiResponseCompletedPayload,
  type AiResponseDeltaPayload,
  type AiResponseEventType,
  type AiResponseFailedPayload,
  type AiResponseStartPayload,
} from './chat-events'

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
