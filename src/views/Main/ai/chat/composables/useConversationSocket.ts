import { getCurrentInstance, onUnmounted } from 'vue'
import type { KernelRealtime } from '@/app/kernel'
import { useAppKernel } from '@/app/injection'
import {
  AI_RESPONSE_EVENTS,
  type AiResponseCanceledPayload,
  type AiResponseCompletedPayload,
  type AiResponseDeltaPayload,
  type AiResponseFailedPayload,
  type AiResponseStartPayload,
} from '@/api/ai/chat-events'

interface SocketHandlers {
  onStart: (payload: AiResponseStartPayload) => void
  onDelta: (payload: AiResponseDeltaPayload) => void
  onCompleted: (payload: AiResponseCompletedPayload) => void
  onFailed: (payload: AiResponseFailedPayload) => void
  onCanceled: (payload: AiResponseCanceledPayload) => void
}

export function useConversationSocket(
  handlers: SocketHandlers,
  realtime: KernelRealtime = useAppKernel().realtime,
) {
  const unsubscribe = [
    realtime.subscribe(AI_RESPONSE_EVENTS.start, ({ data }) => handlers.onStart(data)),
    realtime.subscribe(AI_RESPONSE_EVENTS.delta, ({ data }) => handlers.onDelta(data)),
    realtime.subscribe(AI_RESPONSE_EVENTS.completed, ({ data }) => handlers.onCompleted(data)),
    realtime.subscribe(AI_RESPONSE_EVENTS.failed, ({ data }) => handlers.onFailed(data)),
    realtime.subscribe(AI_RESPONSE_EVENTS.canceled, ({ data }) => handlers.onCanceled(data)),
  ]

  const dispose = () => {
    unsubscribe.forEach((dispose) => dispose())
  }
  if (getCurrentInstance()) onUnmounted(dispose)
  return dispose
}
