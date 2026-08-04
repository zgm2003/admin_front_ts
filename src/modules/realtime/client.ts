import { readonly, shallowRef } from 'vue'
import { buildRealtimeWebSocketURL } from '@/adapters/web/websocket'
import { PersistenceError } from '@/modules/persistence/store'
import { RealtimeCursorStore } from './cursor'
import {
  createClientEnvelope,
  isDurableEnvelope,
  parseServerEnvelope,
  type RealtimeEventType,
  type ServerEnvelope,
} from './protocol'
import {
  EventIdLRU,
  RecoveryRegistry,
  RealtimeControlChannel,
  RealtimeHandlerError,
  RealtimeSubscriptions,
  sendRealtimeTopics,
  SubscriptionRegistry,
  type RealtimeHandler,
} from './subscriptions'
import {
  browserAvailability,
  browserClock,
  permanentAuthenticationError,
  ReconnectController,
  sameIdentity,
  shouldRestartAfterFlight,
  validIdentity,
  type RealtimeClientOptions,
  type RealtimeIdentity,
  type RealtimeRecoveryContext,
  type RealtimeRecoveryHandler,
  type RealtimeState,
  type RealtimeStateRef,
} from './policy'
import type { RealtimeConnection, RealtimeTransport } from './transport'

const realtimeLimits = { controlBuffer: 32, dedupe: 512 } as const

export * from './public'

export class RealtimeClient {
  readonly state: RealtimeStateRef

  private readonly mutableState = shallowRef<RealtimeState>({ kind: 'idle' })
  private readonly endpoint: () => URL
  private readonly transport: RealtimeTransport
  private readonly cursorStore: RealtimeCursorStore
  private readonly issueTicket: (signal: AbortSignal) => Promise<string>
  private readonly recover?: (context: RealtimeRecoveryContext) => Promise<number>
  private readonly reconnect: ReconnectController
  private readonly maxPermanentAuthAttempts: number
  private readonly onProtocolError: (error: unknown) => void
  private readonly eventSubscriptions: RealtimeSubscriptions
  private readonly topicRegistry: SubscriptionRegistry
  private readonly controls: RealtimeControlChannel
  private readonly deduplicatedEventIds = new EventIdLRU(realtimeLimits.dedupe)
  private readonly recoveryHandlers = new RecoveryRegistry()
  private readonly authenticatedConnections = new WeakSet<RealtimeConnection>()

  private identity: RealtimeIdentity | null = null
  private connection: RealtimeConnection | null = null
  private attemptController: AbortController | null = null
  private identityController: AbortController | null = null
  private connectFlight: Promise<void> | null = null
  private permanentAuthAttempts = 0
  private generation = 0
  private messageTail: Promise<void> = Promise.resolve()
  private disposed = false
  private readonly sendCurrentTopics = () => sendRealtimeTopics(this.controls, this.topicRegistry.topics(), this.identity, this.mutableState.value.kind === 'ready')

  constructor(options: RealtimeClientOptions) {
    if (!Number.isSafeInteger(options.maxPermanentAuthAttempts ?? 3)
      || (options.maxPermanentAuthAttempts ?? 3) < 1) {
      throw new TypeError('maxPermanentAuthAttempts must be a positive safe integer')
    }
    const endpoint = options.endpoint
    this.endpoint = typeof endpoint === 'function'
      ? endpoint
      : () => new URL(endpoint.href)
    this.transport = options.transport
    this.cursorStore = new RealtimeCursorStore(options.persistence)
    this.issueTicket = options.issueTicket
    this.recover = options.recover
    this.maxPermanentAuthAttempts = options.maxPermanentAuthAttempts ?? 3
    this.onProtocolError = options.onProtocolError ?? (() => undefined)
    this.controls = new RealtimeControlChannel(realtimeLimits.controlBuffer, this.onProtocolError)
    this.eventSubscriptions = new RealtimeSubscriptions(this.onProtocolError)
    this.topicRegistry = new SubscriptionRegistry(() => this.sendCurrentTopics())
    this.state = readonly(this.mutableState)
    this.reconnect = new ReconnectController({
      clock: options.clock ?? browserClock,
      availability: options.availability ?? browserAvailability,
      random: options.random ?? Math.random,
      updateState: (state) => { this.mutableState.value = state },
      canConnect: () => Boolean(this.identity && this.mutableState.value.kind !== 'failed'
        && !this.disposed && !this.connection && !this.connectFlight),
      connect: () => { void this.startAttempt() },
    })
  }

  subscribe<K extends RealtimeEventType>(type: K, handler: RealtimeHandler<K>): () => void {
    return this.eventSubscriptions.subscribe(type, handler)
  }

  retainTopic(topic: string): () => void {
    return this.topicRegistry.retain(topic)
  }

  registerRecovery(handler: RealtimeRecoveryHandler): () => void {
    return this.recoveryHandlers.register(handler)
  }

  async connect(identity: RealtimeIdentity): Promise<void> {
    if (this.disposed) throw new DOMException('RealtimeClient is disposed', 'InvalidStateError')
    if (!validIdentity(identity)) throw new TypeError('authenticated Admin realtime identity is invalid')
    if (sameIdentity(this.identity, identity)) {
      await (this.connectFlight ?? Promise.resolve())
      return
    }
    if (this.identity) await this.disconnect({ purge: true })

    this.identity = { ...identity }
    this.identityController = new AbortController()
    try {
      this.cursorStore.activate(identity.userId)
    } catch (error) {
      this.identityController.abort(error)
      this.identityController = null
      this.identity = null
      this.cursorStore.reset(false)
      this.mutableState.value = { kind: 'failed', error }
      this.onProtocolError(error)
      return
    }
    this.mutableState.value = { kind: 'idle' }
    await this.startAttemptWhenAvailable()
  }

  ping(requestId?: string): void {
    this.controls.send(createClientEnvelope('realtime.ping.v1', {}, requestId))
  }

  async disconnect(options: { readonly purge?: boolean } = {}): Promise<void> {
    this.generation++
    this.messageTail = Promise.resolve()
    this.reconnect.reset()
    this.attemptController?.abort(new DOMException('realtime disconnected', 'AbortError'))
    this.attemptController = null
    this.identityController?.abort(new DOMException('realtime identity ended', 'AbortError'))
    this.identityController = null
    this.controls.close(this.connection)
    this.connection = null
    this.controls.clear()
    this.identity = null
    this.permanentAuthAttempts = 0
    try {
      this.cursorStore.reset(options.purge === true)
    } catch (error) {
      this.onProtocolError(error)
    }
    this.deduplicatedEventIds.clear()
    if (options.purge) {
      this.topicRegistry.clear()
      this.eventSubscriptions.clear()
      this.recoveryHandlers.clear()
    }
    this.mutableState.value = { kind: 'idle' }
    await Promise.resolve()
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    await this.disconnect()
    this.topicRegistry.clear()
    this.eventSubscriptions.clear()
    this.recoveryHandlers.clear()
    this.reconnect.dispose()
    this.mutableState.value = { kind: 'closed' }
  }

  private async startAttemptWhenAvailable(): Promise<void> {
    if (!this.identity || this.disposed) return
    if (!this.reconnect.available) {
      this.mutableState.value = { kind: 'waiting', attempt: this.reconnect.nextAttempt }
      return
    }
    await this.startAttempt()
  }

  private async startAttempt(): Promise<void> {
    if (!this.identity || this.disposed || this.connection || this.connectFlight) return
    const generation = this.generation
    const controller = new AbortController()
    this.attemptController = controller
    this.mutableState.value = { kind: 'connecting', attempt: this.reconnect.nextAttempt }

    const flight = (async () => {
      try {
        const ticket = await this.issueTicket(controller.signal)
        if (!ticket) throw new TypeError('realtime ticket response is empty')
        if (generation !== this.generation || controller.signal.aborted || !this.identity) return
        if (!this.reconnect.available) {
          this.mutableState.value = { kind: 'waiting', attempt: this.reconnect.nextAttempt }
          return
        }
        const holder: { connection: RealtimeConnection | null } = { connection: null }
        const connection = this.transport.connect(
          buildRealtimeWebSocketURL(this.endpoint(), ticket),
          {
            open: () => holder.connection && this.handleOpen(holder.connection, generation),
            message: (payload) => holder.connection && this.handleMessage(payload, generation, holder.connection),
            close: () => holder.connection && this.handleClose(holder.connection, generation),
            error: (error) => this.onProtocolError(error),
          },
        )
        holder.connection = connection
        if (generation !== this.generation || controller.signal.aborted) {
          connection.close()
          return
        }
        this.connection = connection
        this.controls.attach(connection)
      } catch (error) {
        if (generation !== this.generation || controller.signal.aborted) return
        if (permanentAuthenticationError(error)) {
          this.permanentAuthAttempts++
          if (this.permanentAuthAttempts >= this.maxPermanentAuthAttempts) {
            this.mutableState.value = { kind: 'failed', error }
            return
          }
        }
        if (permanentAuthenticationError(error)) this.onProtocolError(error)
        this.reconnect.schedule()
      } finally {
        if (this.attemptController === controller) this.attemptController = null
      }
    })()
    this.connectFlight = flight
    try {
      await flight
    } finally {
      if (this.connectFlight === flight) this.connectFlight = null
      if (shouldRestartAfterFlight(this.identity, this.mutableState.value, this.reconnect.available, Boolean(this.connection), this.reconnect.hasTimer)) void this.startAttempt()
    }
  }

  private handleOpen(connection: RealtimeConnection, generation: number): void {
    if (generation !== this.generation || this.connection !== connection) return
    this.mutableState.value = { kind: 'authenticating', attempt: this.reconnect.nextAttempt }
  }

  private handleMessage(payload: string, generation: number, connection: RealtimeConnection): void {
    this.messageTail = this.messageTail.then(async () => {
      if (!this.isCurrentConnection(connection, generation)) return
      try {
        const decoded: unknown = JSON.parse(payload)
        const envelope = parseServerEnvelope(decoded)
        await this.processEnvelope(envelope, generation, connection)
      } catch (error) {
        if (error instanceof PersistenceError) {
          if (this.dropCurrentConnection(connection, generation)) {
            this.mutableState.value = { kind: 'failed', error }
          }
        }
        if (!(error instanceof RealtimeHandlerError)) this.onProtocolError(error)
      }
    })
  }

  private async processEnvelope(
    envelope: ServerEnvelope,
    generation: number,
    connection: RealtimeConnection,
  ): Promise<void> {
    if (!this.isCurrentConnection(connection, generation) || !this.identity) return
    if (envelope.type !== 'realtime.connected.v1' && !this.authenticatedConnections.has(connection)) {
      throw new TypeError('realtime domain events require a completed connected handshake')
    }
    if (this.deduplicatedEventIds.has(envelope.event_id)) return

    if (envelope.type === 'realtime.connected.v1') {
      if (envelope.data.user_id !== this.identity.userId || envelope.data.platform !== this.identity.platform) {
        throw new TypeError('realtime connected identity does not match authenticated context')
      }
      this.authenticatedConnections.add(connection)
      this.reconnect.resetFailures()
      this.permanentAuthAttempts = 0
      this.mutableState.value = {
        kind: 'ready',
        userId: envelope.data.user_id,
        heartbeatIntervalMs: envelope.data.heartbeat_interval_ms,
      }
      this.controls.markReady()
      this.sendCurrentTopics()
      this.controls.sendImmediate(createClientEnvelope('realtime.resume.v1', {
        after_sequence: this.cursorStore.current,
      }))
      this.controls.flush()
      await this.eventSubscriptions.publish(envelope)
      if (!this.isCurrentConnection(connection, generation)) return
      this.deduplicatedEventIds.remember(envelope.event_id)
      return
    }

    if (envelope.type === 'realtime.error.v1') {
      await this.eventSubscriptions.publish(envelope)
      if (!this.isCurrentConnection(connection, generation)) return
      this.deduplicatedEventIds.remember(envelope.event_id)
      return
    }

    if (envelope.type === 'realtime.resync_required.v1') {
      const recoveryContext = {
        latestSequence: envelope.data.latest_sequence,
        signal: this.identityController?.signal ?? new AbortController().signal,
      }
      let recoveredCursor: number
      try {
        recoveredCursor = this.recover ? await this.recover(recoveryContext) : await this.recoveryHandlers.recover(recoveryContext)
        if (!this.isCurrentConnection(connection, generation) || recoveryContext.signal.aborted) return
        if (!Number.isSafeInteger(recoveredCursor)
          || recoveredCursor < this.cursorStore.current
          || recoveredCursor > envelope.data.latest_sequence) {
          throw new TypeError('authoritative realtime recovery returned an invalid cursor')
        }
      } catch (error) {
        if (this.dropCurrentConnection(connection, generation)) this.reconnect.schedule()
        throw error
      }
      this.cursorStore.set(recoveredCursor)
      await this.eventSubscriptions.publish(envelope)
      if (!this.isCurrentConnection(connection, generation)) return
      this.deduplicatedEventIds.remember(envelope.event_id)
      return
    }

    if (isDurableEnvelope(envelope)) {
      if (envelope.sequence <= this.cursorStore.current) return
      try {
        await this.eventSubscriptions.publish(envelope)
      } catch (error) {
        if (this.dropCurrentConnection(connection, generation)) this.reconnect.schedule()
        throw error
      }
      if (!this.isCurrentConnection(connection, generation)) return
      this.cursorStore.set(envelope.sequence)
      this.deduplicatedEventIds.remember(envelope.event_id)
      return
    }

    await this.eventSubscriptions.publish(envelope)
    if (!this.isCurrentConnection(connection, generation)) return
    this.deduplicatedEventIds.remember(envelope.event_id)
  }

  private handleClose(connection: RealtimeConnection, generation: number): void {
    if (generation !== this.generation || this.connection !== connection) return
    this.connection = null
    this.controls.detach()
    this.messageTail = Promise.resolve()
    this.reconnect.schedule()
  }

  private isCurrentConnection(connection: RealtimeConnection, generation: number): boolean {
    return generation === this.generation && this.connection === connection
  }

  private dropCurrentConnection(connection: RealtimeConnection, generation: number): boolean {
    if (!this.isCurrentConnection(connection, generation)) return false
    this.connection = null
    this.controls.close(connection)
    this.messageTail = Promise.resolve()
    return true
  }

}
