import { readonly, shallowRef, type ShallowRef } from 'vue'
import type { AppEnvironment } from './environment'
import type { ApiError, BootstrapState, PrincipalSnapshot } from './state'

export type PrincipalRefreshReason =
  | 'bootstrap'
  | 'session-refreshed'
  | 'permission-changed'
  | 'manual'

export interface KernelAuthSession {
  restore(signal: AbortSignal): Promise<{ readonly kind: 'anonymous' | 'authenticated' }>
  dispose(): Promise<void>
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
  readonly realtime: {
    disconnect(): Promise<void>
  }
  readonly adapters: readonly {
    dispose(): Promise<void>
  }[]
}

function toApiError(error: unknown, kind: ApiError['kind'] = 'internal'): ApiError {
  return {
    kind,
    code: kind === 'contract' ? 'app.environment_invalid' : 'app.bootstrap_failed',
    retryable: false,
    messageKey: kind === 'contract' ? 'app.environmentInvalid' : 'app.bootstrapFailed',
    cause: error,
  }
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

  private readonly mutableState = shallowRef<BootstrapState>({ kind: 'cold' })
  private readonly lifecycle = new AbortController()
  private transitionTail: Promise<void> = Promise.resolve()
  private bootstrapFlight: Promise<BootstrapState> | null = null
  private disposeFlight: Promise<void> | null = null
  private disposed = false
  private environmentValue: AppEnvironment | null = null
  private readonly dependencies: AppKernelDependencies

  constructor(dependencies: AppKernelDependencies) {
    this.dependencies = dependencies
    this.state = readonly(this.mutableState)
    this.auth = dependencies.auth
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

  dispose(): Promise<void> {
    if (this.disposeFlight) return this.disposeFlight
    this.disposed = true
    this.lifecycle.abort(new DOMException('AppKernel disposed', 'AbortError'))
    this.disposeFlight = (async () => {
      await this.transitionTail
      await this.dependencies.realtime.disconnect()
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
  }
}
