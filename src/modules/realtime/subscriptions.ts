import {
  createClientEnvelope,
  type ClientControlType,
  type ClientEnvelope,
  type Envelope,
  type RealtimeEventMap,
  type RealtimeEventType,
  type ServerEnvelope,
} from './protocol'
import type {
  RealtimeIdentity,
  RealtimeRecoveryContext,
  RealtimeRecoveryHandler,
} from './policy'
import type { RealtimeConnection } from './transport'

export type RealtimeHandler<K extends RealtimeEventType> = (
  envelope: Envelope<K>,
) => void | Promise<void>

type AnyRealtimeHandler = (envelope: ServerEnvelope) => void | Promise<void>

export class RealtimeHandlerError extends Error {
  readonly errors: readonly unknown[]

  constructor(errors: readonly unknown[]) {
    super('realtime handler failed')
    this.name = 'RealtimeHandlerError'
    this.errors = [...errors]
  }
}

export class RealtimeSubscriptions {
  private readonly handlers = new Map<RealtimeEventType, Set<AnyRealtimeHandler>>()
  private readonly onHandlerError: (error: unknown) => void

  constructor(onHandlerError: (error: unknown) => void = () => undefined) {
    this.onHandlerError = onHandlerError
  }

  subscribe<K extends RealtimeEventType>(type: K, handler: RealtimeHandler<K>): () => void {
    let eventHandlers = this.handlers.get(type)
    if (!eventHandlers) {
      eventHandlers = new Set()
      this.handlers.set(type, eventHandlers)
    }
    eventHandlers.add(handler as AnyRealtimeHandler)
    return () => {
      const current = this.handlers.get(type)
      current?.delete(handler as AnyRealtimeHandler)
      if (current?.size === 0) this.handlers.delete(type)
    }
  }

  async publish<K extends RealtimeEventType>(envelope: Envelope<K>): Promise<void> {
    const handlers = [...(this.handlers.get(envelope.type) ?? [])]
    if (handlers.length === 0) return
    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve().then(() => handler(envelope as ServerEnvelope))),
    )
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason as unknown)
    for (const error of errors) this.onHandlerError(error)
    if (errors.length > 0) throw new RealtimeHandlerError(errors)
  }

  clear(): void {
    this.handlers.clear()
  }
}

function validateTopic(topic: string): string {
  if (!/\S/.test(topic) || [...topic].length > 128) {
    throw new TypeError('realtime topic must contain 1-128 non-whitespace characters')
  }
  return topic
}

export class SubscriptionRegistry {
  private readonly references = new Map<string, number>()
  private readonly onChange: () => void

  constructor(onChange: () => void = () => undefined) {
    this.onChange = onChange
  }

  retain(topic: string): () => void {
    const exactTopic = validateTopic(topic)
    this.references.set(exactTopic, (this.references.get(exactTopic) ?? 0) + 1)
    this.onChange()
    let released = false
    return () => {
      if (released) return
      released = true
      const references = this.references.get(exactTopic)
      if (references === undefined) return
      if (references === 1) this.references.delete(exactTopic)
      else this.references.set(exactTopic, references - 1)
      this.onChange()
    }
  }

  topics(): readonly string[] {
    return [...this.references.keys()].sort()
  }

  clear(): void {
    if (this.references.size === 0) return
    this.references.clear()
    this.onChange()
  }
}

export function identityTopics(
  retainedTopics: readonly string[],
  identity: { readonly userId: number; readonly platform: 'admin' } | null,
): readonly string[] {
  if (!identity) return retainedTopics
  return [...new Set([
    ...retainedTopics,
    `platform:${identity.platform}`,
    `user:${identity.userId}`,
  ])].sort()
}

export class ControlBuffer {
  private readonly values: ClientEnvelope<ClientControlType>[] = []
  private readonly limit: number

  constructor(limit: number) {
    this.limit = limit
  }

  push(value: ClientEnvelope<ClientControlType>): void {
    if (this.values.length === this.limit) this.values.shift()
    this.values.push(value)
  }

  drain(): readonly ClientEnvelope<ClientControlType>[] {
    return this.values.splice(0)
  }

  clear(): void {
    this.values.splice(0)
  }
}

export class RealtimeControlChannel {
  private readonly buffer: ControlBuffer
  private readonly onError: (error: unknown) => void
  private connection: RealtimeConnection | null = null
  private ready = false

  constructor(limit: number, onError: (error: unknown) => void) {
    this.buffer = new ControlBuffer(limit)
    this.onError = onError
  }

  attach(connection: RealtimeConnection): void {
    this.connection = connection
    this.ready = false
  }

  detach(): void {
    this.connection = null
    this.ready = false
  }

  close(connection: RealtimeConnection | null): void {
    this.detach()
    connection?.close()
  }

  markReady(): void {
    this.ready = true
  }

  send(envelope: ClientEnvelope<ClientControlType>): void {
    if (this.ready && this.connection) this.sendImmediate(envelope)
    else this.buffer.push(envelope)
  }

  sendImmediate(envelope: ClientEnvelope<ClientControlType>): void {
    if (!this.connection) return
    try {
      this.connection.send(JSON.stringify(envelope))
    } catch (error) {
      this.onError(error)
    }
  }

  flush(): void {
    for (const envelope of this.buffer.drain()) this.sendImmediate(envelope)
  }

  clear(): void {
    this.detach()
    this.buffer.clear()
  }
}

export function sendRealtimeTopics(
  controls: RealtimeControlChannel,
  registeredTopics: readonly string[],
  identity: RealtimeIdentity | null,
  ready: boolean,
): void {
  if (!ready) return
  const topics = identityTopics(registeredTopics, identity)
  if (topics.length === 0) return
  controls.sendImmediate(createClientEnvelope('realtime.subscribe.v1', { topics }))
}

export class EventIdLRU {
  private readonly values = new Map<string, true>()
  private readonly limit: number

  constructor(limit: number) {
    this.limit = limit
  }

  get size(): number {
    return this.values.size
  }

  has(eventId: string): boolean {
    return this.values.has(eventId)
  }

  remember(eventId: string): void {
    if (this.values.has(eventId)) return
    this.values.set(eventId, true)
    if (this.values.size > this.limit) {
      const oldest = this.values.keys().next().value
      if (oldest !== undefined) this.values.delete(oldest)
    }
  }

  clear(): void {
    this.values.clear()
  }
}

export class RecoveryRegistry {
  private readonly handlers = new Set<RealtimeRecoveryHandler>()

  register(handler: RealtimeRecoveryHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  clear(): void {
    this.handlers.clear()
  }

  async recover(context: RealtimeRecoveryContext): Promise<number> {
    const handlers = [...this.handlers]
    if (handlers.length === 0) {
      throw new Error('realtime resync requires an authoritative feature recovery handler')
    }
    await Promise.all(handlers.map((handler) => handler(context)))
    return context.latestSequence
  }
}

export type { RealtimeEventMap }
