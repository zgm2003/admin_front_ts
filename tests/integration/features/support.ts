import type { KernelRealtime } from '@/app/kernel'
import type {
  Envelope,
  RealtimeEventType,
  ServerEnvelope,
} from '@/modules/realtime/protocol'
import type {
  RealtimeRecoveryContext,
  RealtimeRecoveryHandler,
} from '@/modules/realtime/policy'
import type { RealtimeHandler } from '@/modules/realtime/subscriptions'

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

type AnyHandler = (envelope: ServerEnvelope) => void | Promise<void>

export class FakeFeatureRealtime implements KernelRealtime {
  private readonly handlers = new Map<RealtimeEventType, Set<AnyHandler>>()
  private readonly recoveries = new Set<RealtimeRecoveryHandler>()

  connect(): void {}
  async disconnect(): Promise<void> {}
  async dispose(): Promise<void> {}

  subscribe<K extends RealtimeEventType>(type: K, handler: RealtimeHandler<K>): () => void {
    const handlers = this.handlers.get(type) ?? new Set<AnyHandler>()
    handlers.add(handler as AnyHandler)
    this.handlers.set(type, handlers)
    return () => handlers.delete(handler as AnyHandler)
  }

  retainTopic(): () => void {
    return () => undefined
  }

  registerRecovery(handler: RealtimeRecoveryHandler): () => void {
    this.recoveries.add(handler)
    return () => this.recoveries.delete(handler)
  }

  async emit<K extends RealtimeEventType>(envelope: Envelope<K>): Promise<void> {
    const handlers = [...(this.handlers.get(envelope.type) ?? [])]
    await Promise.all(handlers.map((handler) => handler(envelope as ServerEnvelope)))
  }

  async recover(latestSequence: number, signal = new AbortController().signal): Promise<void> {
    const context: RealtimeRecoveryContext = { latestSequence, signal }
    await Promise.all([...this.recoveries].map((handler) => handler(context)))
  }
}

export const page = (currentPage = 1, total = 1) => ({
  current_page: currentPage,
  page_size: 20,
  total,
  total_page: total === 0 ? 0 : Math.max(currentPage, 1),
})

export const eventBase = {
  occurred_at: '2026-07-19T00:00:00Z',
} as const
