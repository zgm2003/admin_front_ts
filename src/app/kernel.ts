import { readonly, shallowRef, type ShallowRef } from 'vue'
import { createApiError, type ApiError } from '@/modules/http/error'
import type { AuthEvent, LoginCommand } from '@/modules/auth/types'
import type { Persistence } from '@/modules/persistence/store'
import type {
  RealtimeRecoveryHandler,
} from '@/modules/realtime/client'
import type { RealtimeEventType } from '@/modules/realtime/protocol'
import type { RealtimeHandler } from '@/modules/realtime/subscriptions'
import type { AppEnvironment } from './environment'
import type { BootstrapState, PrincipalSnapshot } from './state'

export type PrincipalRefreshReason =
  | 'bootstrap'
  | 'session-refreshed'
  | 'permission-changed'
  | 'manual'

export interface KernelAuthSession {
  restore(signal: AbortSignal): Promise<{ readonly kind: 'anonymous' | 'authenticated' }>
  login(input: LoginCommand, signal?: AbortSignal): Promise<unknown>
  logout(): Promise<void>
  dispose(): Promise<void>
  subscribe?(listener: (event: AuthEvent) => void): () => void
}

export interface KernelRealtime {
  connect(identity: { readonly userId: number; readonly platform: 'admin' }): void
  disconnect(options?: { readonly purge?: boolean }): Promise<void>
  dispose(): Promise<void>
  subscribe<K extends RealtimeEventType>(type: K, handler: RealtimeHandler<K>): () => void
  retainTopic(topic: string): () => void
  registerRecovery(handler: RealtimeRecoveryHandler): () => void
}

export interface AppKernelDependencies {
  readonly environment: () => AppEnvironment
  readonly auth: KernelAuthSession
  readonly principal: {
    load(signal: AbortSignal, reason: PrincipalRefreshReason): Promise<PrincipalSnapshot>
    clear(): Promise<void>
  }
  readonly routes: {
    install(principal: PrincipalSnapshot, signal: AbortSignal): Promise<void>
    clear(): Promise<void>
  }
  readonly realtime: KernelRealtime
  readonly persistence: Persistence
  readonly adapters: readonly {
    dispose(): Promise<void>
  }[]
}

function toApiError(error: unknown, kind: ApiError['kind'] = 'internal'): ApiError {
  return createApiError({
    kind,
    code: kind === 'contract' ? 'app.environment_invalid' : 'app.bootstrap_failed',
    retryable: false,
    messageKey: kind === 'contract' ? 'app.environmentInvalid' : 'app.bootstrapFailed',
    cause: error,
  })
}

function linkedAbortController(signals: readonly AbortSignal[]) {
  const controller = new AbortController()
  const listeners = new Map<AbortSignal, () => void>()
  for (const signal of signals) {
    const abort = () => controller.abort(signal.reason)
    listeners.set(signal, abort)
    if (signal.aborted) {
      abort()
      break
    }
    signal.addEventListener('abort', abort, { once: true })
  }
  return {
    controller,
    dispose() {
      for (const [signal, listener] of listeners) {
        signal.removeEventListener('abort', listener)
      }
    },
  }
}

export class AppKernel {
  readonly state: Readonly<ShallowRef<BootstrapState>>
  readonly auth: KernelAuthSession
  readonly persistence: Persistence
  readonly realtime: KernelRealtime

  private readonly mutableState = shallowRef<BootstrapState>({ kind: 'cold' })
  private readonly lifecycle = new AbortController()
  private transitionTail: Promise<void> = Promise.resolve()
  private bootstrapFlight: Promise<BootstrapState> | null = null
  private disposeFlight: Promise<void> | null = null
  private logoutFlight: Promise<void> | null = null
  private disposed = false
  private environmentValue: AppEnvironment | null = null
  private realtimeUserId: number | null = null
  private readonly dependencies: AppKernelDependencies
  private readonly unsubscribeAuth: () => void

  constructor(dependencies: AppKernelDependencies) {
    this.dependencies = dependencies
    this.state = readonly(this.mutableState)
    this.auth = dependencies.auth
    this.persistence = dependencies.persistence
    this.realtime = dependencies.realtime
    this.unsubscribeAuth = dependencies.auth.subscribe?.((event) => {
      if (event.type === 'expired') void this.logout()
    }) ?? (() => undefined)
  }

  get environment(): AppEnvironment | null {
    return this.environmentValue
  }

  bootstrap(signal?: AbortSignal): Promise<BootstrapState> {
    if (this.bootstrapFlight) return this.bootstrapFlight
    if (this.disposed) return Promise.resolve(this.mutableState.value)

    this.mutableState.value = { kind: 'restoring-session' }
    this.bootstrapFlight = this.enqueue(() => this.runBootstrap(signal))
    return this.bootstrapFlight
  }

  refreshPrincipal(reason: PrincipalRefreshReason): Promise<void> {
    if (this.disposed) return Promise.resolve()
    return this.enqueue(async () => {
      if (this.mutableState.value.kind !== 'ready') return
      await this.loadPrincipal(reason, this.lifecycle.signal)
    })
  }

  login(input: LoginCommand, signal?: AbortSignal): Promise<BootstrapState> {
    if (this.disposed) return Promise.resolve(this.mutableState.value)
    return this.enqueue(async () => {
      let sessionEstablished = false
      const linked = linkedAbortController([
        this.lifecycle.signal,
        ...(signal ? [signal] : []),
      ])
      try {
        if (!this.environmentValue) this.environmentValue = this.dependencies.environment()
        await this.dependencies.auth.login(input, linked.controller.signal)
        sessionEstablished = true
        await this.loadPrincipal('manual', linked.controller.signal)
        return this.mutableState.value
      } catch (error) {
        if (sessionEstablished) await this.dependencies.auth.logout()
        this.mutableState.value = linked.controller.signal.aborted
          ? { kind: 'cold' }
          : { kind: 'anonymous' }
        throw error
      } finally {
        linked.dispose()
      }
    })
  }

  logout(): Promise<void> {
    if (this.logoutFlight) return this.logoutFlight
    this.logoutFlight = this.enqueue(async () => {
      await this.dependencies.auth.logout()
      this.realtimeUserId = null
      this.bootstrapFlight = null
      this.mutableState.value = { kind: 'anonymous' }
    }).finally(() => {
      this.logoutFlight = null
    })
    return this.logoutFlight
  }

  dispose(): Promise<void> {
    if (this.disposeFlight) return this.disposeFlight
    this.disposed = true
    this.lifecycle.abort(new DOMException('AppKernel disposed', 'AbortError'))
    this.unsubscribeAuth()
    this.disposeFlight = (async () => {
      await this.transitionTail
      await this.dependencies.realtime.dispose()
      this.realtimeUserId = null
      await this.dependencies.routes.clear()
      await this.dependencies.principal.clear()
      await this.dependencies.auth.dispose()
      for (const adapter of this.dependencies.adapters) {
        await adapter.dispose()
      }
      this.environmentValue = null
      this.mutableState.value = { kind: 'cold' }
    })()
    return this.disposeFlight
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.transitionTail.then(operation)
    this.transitionTail = result.then(() => undefined, () => undefined)
    return result
  }

  private async runBootstrap(externalSignal?: AbortSignal): Promise<BootstrapState> {
    const linked = linkedAbortController([
      this.lifecycle.signal,
      ...(externalSignal ? [externalSignal] : []),
    ])
    try {
      try {
        this.environmentValue = this.dependencies.environment()
      } catch (error) {
        this.mutableState.value = { kind: 'failed', error: toApiError(error, 'contract') }
        return this.mutableState.value
      }

      const restored = await this.dependencies.auth.restore(linked.controller.signal)
      if (linked.controller.signal.aborted) {
        this.mutableState.value = { kind: 'cold' }
        return this.mutableState.value
      }
      if (restored.kind === 'anonymous') {
        this.mutableState.value = { kind: 'anonymous' }
        return this.mutableState.value
      }

      await this.loadPrincipal('bootstrap', linked.controller.signal)
      return this.mutableState.value
    } catch (error) {
      if (linked.controller.signal.aborted) {
        this.mutableState.value = { kind: 'cold' }
        return this.mutableState.value
      }
      this.mutableState.value = { kind: 'failed', error: toApiError(error) }
      return this.mutableState.value
    } finally {
      linked.dispose()
    }
  }

  private async loadPrincipal(reason: PrincipalRefreshReason, signal: AbortSignal) {
    this.mutableState.value = { kind: 'loading-principal' }
    const principal = await this.dependencies.principal.load(signal, reason)
    if (signal.aborted) return
    this.mutableState.value = { kind: 'installing-routes' }
    await this.dependencies.routes.install(principal, signal)
    if (signal.aborted) return
    this.mutableState.value = { kind: 'ready', principal }
    if (this.realtimeUserId !== principal.userId) {
      this.realtimeUserId = principal.userId
      this.dependencies.realtime.connect({ userId: principal.userId, platform: 'admin' })
    }
  }
}
