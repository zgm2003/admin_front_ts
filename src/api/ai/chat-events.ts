import type {
  AICanceledPayload,
  AICompletedPayload,
  AIDeltaPayload,
  AIFailedPayload,
  AIStartPayload,
  RealtimeEventType,
} from '@/modules/realtime/protocol'

export const AI_RESPONSE_EVENTS = {
  start: 'ai.response.start.v1',
  delta: 'ai.response.delta.v1',
  completed: 'ai.response.completed.v1',
  failed: 'ai.response.failed.v1',
  canceled: 'ai.response.canceled.v1',
} as const satisfies Readonly<Record<string, RealtimeEventType>>

export type AiResponseEventType = typeof AI_RESPONSE_EVENTS[keyof typeof AI_RESPONSE_EVENTS]
export type AiResponseStartPayload = AIStartPayload
export type AiResponseDeltaPayload = AIDeltaPayload
export type AiResponseCompletedPayload = AICompletedPayload
export type AiResponseFailedPayload = AIFailedPayload
export type AiResponseCanceledPayload = AICanceledPayload
