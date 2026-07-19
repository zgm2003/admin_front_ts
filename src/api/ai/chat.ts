import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import { adminOperations } from '@/modules/http/generated/operations'
export {
  AI_RESPONSE_EVENTS,
  type AiResponseCanceledPayload,
  type AiResponseCompletedPayload,
  type AiResponseDeltaPayload,
  type AiResponseEventType,
  type AiResponseFailedPayload,
  type AiResponseStartPayload,
} from './chat-events'

export type AiChatCancelResponse = components['schemas']['AIMessageCancelResult']

export function createAiRequestId() {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function positiveID(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`)
  return value
}

export const AiChatApi = {
  cancel: (params: { conversation_id: number; request_id: string }, options: ExecuteOptions = {}): Promise<AiChatCancelResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_conversations_id_messages_cancel, {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      body: { request_id: params.request_id },
    }, options),
}
