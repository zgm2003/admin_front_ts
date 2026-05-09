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

export function createAiRequestId() {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
