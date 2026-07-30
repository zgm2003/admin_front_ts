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
export { createAiRequestId } from './request-id'

export type AiChatCancelResponse = components['schemas']['AIMessageCancelResult']
export type AiChatStoppingAcknowledgment =
  | (AiChatCancelResponse & { status: 'stopped'; assistant_message_id: number })
  | (AiChatCancelResponse & { status: 'already_terminal'; settlement_pending: false })

export function assertAiStoppingAcknowledgment(
  response: AiChatCancelResponse,
  conversationId: number,
  requestId: string,
): AiChatStoppingAcknowledgment {
  if (response.conversation_id !== conversationId
    || response.request_id !== requestId) {
    throw new Error('AI cancel acknowledgment violates the stopping contract')
  }
  if (response.status === 'stopped') {
    if (!Number.isSafeInteger(response.assistant_message_id) || (response.assistant_message_id ?? 0) <= 0) {
      throw new Error('AI cancel acknowledgment violates the stopping contract')
    }
    return response as AiChatStoppingAcknowledgment
  }
  if (response.status === 'already_terminal' && response.settlement_pending === false) {
    if (response.assistant_message_id !== null
      && (!Number.isSafeInteger(response.assistant_message_id) || response.assistant_message_id <= 0)) {
      throw new Error('AI cancel acknowledgment violates the stopping contract')
    }
    return response as AiChatStoppingAcknowledgment
  }
  throw new Error('AI cancel acknowledgment violates the stopping contract')
}

function positiveID(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`)
  return value
}

export const AiChatApi = {
  cancel: (
    params: { conversation_id: number; request_id: string; delivered_seq: number },
    options: ExecuteOptions = {},
  ): Promise<AiChatCancelResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_conversations_id_messages_cancel, {
      path: { id: positiveID(params.conversation_id, 'conversation id') },
      body: { request_id: params.request_id, delivered_seq: params.delivered_seq },
    }, options),
}
