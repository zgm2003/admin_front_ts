import { readonly, shallowRef, type ShallowRef } from 'vue'
import { AuthEventBus } from './events'
import { localRefreshCoordinator } from './refresh-coordinator'
import {
  AuthSessionError,
  type AccessCredential,
  type AuthEvent,
  type AuthState,
  type Connectivity,
  type CredentialAdapter,
  type LoginCommand,
  type LogoutHooks,
  type RefreshCoordinator,
} from './types'

const noOpLogoutHooks: LogoutHooks = {
  async disconnectRealtime() {},
  async abortAuthenticatedRequests() {},
  async removeRoutes() {},
  async clearPrincipal() {},
  async clearIdentityPersistence() {},
  async navigateToLogin() {},
}

const browserConnectivity: Connectivity = {
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  waitUntilOnline(signal) {
    if (typeof window === 'undefined') {
      return Promise.reject(new AuthSessionError('auth.offline', 'browser is offline', { retryable: true }))
    }
    return new Promise((resolve, reject) => {
      const online = () => {
        cleanup()
        resolve()
      }
      const aborted = () => {
        cleanup()
        reject(signal.reason)
      }
      const cleanup = () => {
        window.removeEventListener('online', online)
        signal.removeEventListener('abort', aborted)
      }
      window.addEventListener('online', online, { once: true })
      signal.addEventListener('abort', aborted, { once: true })
    })
  },
}

export interface AuthSessionOptions {
  readonly adapter: CredentialAdapter
  readonly coordinator?: RefreshCoordinator
  readonly connectivity?: Connectivity
  readonly logoutHooks?: LogoutHooks
  readonly refreshTimeoutMs?: number
  readonly now?: () => number
}

function waitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise<T>((resolve, reject) => {
    const aborted = () => {
      cleanup()
      reject(signal.reason)
    }
    const cleanup = () => signal.removeEventListener('abort', aborted)
    signal.addEventListener('abort', aborted, { once: true })
    promise.then(
      (value) => {
        cleanup()
        resolve(value)
      },
      (error) => {
        cleanup()
        reject(error)
      },
    )
  })
}

function timeoutError() {
  return new DOMException('authentication refresh timed out', 'TimeoutError')
}

export class AuthSession {
  readonly state: Readonly<ShallowRef<AuthState>>

  private readonly mutableState = shallowRef<AuthState>({ kind: 'unknown' })
  private readonly adapter: CredentialAdapter
  private readonly coordinator: RefreshCoordinator
  private readonly connectivity: Connectivity
  private readonly logoutHooks: LogoutHooks
  private readonly refreshTimeoutMs: number
  private readonly now: () => number
  private readonly events = new AuthEventBus()
  private readonly lifecycle = new AbortController()
  private credential: AccessCredential | null = null
  private refreshFlight: Promise<AuthState> | null = null
  private logoutFlight: Promise<void> | null = null
  private frozen = false

  constructor(options: AuthSessionOptions) {
    this.adapter = options.adapter
    this.coordinator = options.coordinator ?? localRefreshCoordinator
    this.connectivity = options.connectivity ?? browserConnectivity
    this.logoutHooks = options.logoutHooks ?? noOpLogoutHooks
    this.refreshTimeoutMs = options.refreshTimeoutMs ?? 15_000
    this.now = options.now ?? Date.now
    this.state = readonly(this.mutableState)
  }

  subscribe(listener: (event: AuthEvent) => void) {
    return this.events.subscribe(listener)
  }

  async restore(signal: AbortSignal = this.lifecycle.signal): Promise<{ kind: 'anonymous' | 'authenticated' }> {
    if (this.mutableState.value.kind !== 'unknown') {
      return { kind: this.credential ? 'authenticated' : 'anonymous' }
    }
    const restored = await waitWithSignal(this.adapter.restore(signal), signal)
    if (!restored) {
      this.credential = null
      this.mutableState.value = { kind: 'anonymous' }
      return { kind: 'anonymous' }
    }
    this.acceptCredential(restored, 'authenticated')
    return { kind: 'authenticated' }
  }

  async login(input: LoginCommand, signal: AbortSignal = this.lifecycle.signal): Promise<AuthState> {
    if (this.frozen && this.mutableState.value.kind !== 'anonymous') {
      throw new AuthSessionError('auth.session_frozen', 'authentication session is frozen')
    }
    this.frozen = false
    this.logoutFlight = null
    this.mutableState.value = { kind: 'authenticating' }
    try {
      const next = await waitWithSignal(this.adapter.login(input, signal), signal)
      this.acceptCredential(next, 'authenticated')
      return this.mutableState.value
    } catch (error) {
      this.credential = null
      this.mutableState.value = { kind: 'anonymous' }
      throw error
    }
  }

  refresh(signal?: AbortSignal): Promise<AuthState> {
    if (this.frozen) {
      return Promise.reject(new AuthSessionError('auth.session_frozen', 'authentication session is frozen'))
    }
    if (!this.credential) {
      return Promise.reject(new AuthSessionError('auth.session_missing', 'no authenticated session'))
    }
    if (!this.refreshFlight) {
      this.mutableState.value = { kind: 'refreshing', expiresAt: this.credential.expiresAt }
      this.refreshFlight = this.runRefresh().finally(() => {
        this.refreshFlight = null
      })
    }
    return waitWithSignal(this.refreshFlight, signal)
  }

  async withAccessToken<T>(
    operation: (accessToken: string, signal: AbortSignal) => Promise<T> | T,
    signal: AbortSignal = this.lifecycle.signal,
  ): Promise<T> {
    if (this.frozen || this.mutableState.value.kind === 'logging-out') {
      throw new AuthSessionError('auth.session_frozen', 'authentication session is frozen')
    }
    if (this.refreshFlight) {
      await waitWithSignal(this.refreshFlight, signal)
    }
    if (!this.credential) {
      throw new AuthSessionError('auth.session_missing', 'no authenticated session')
    }
    if (this.credential.expiresAt <= this.now()) {
      await this.refresh(signal)
    }
    if (!this.credential) {
      throw new AuthSessionError('auth.session_missing', 'no authenticated session')
    }
    return waitWithSignal(Promise.resolve(operation(this.credential.accessToken, signal)), signal)
  }

  logout(): Promise<void> {
    if (this.logoutFlight) return this.logoutFlight
    this.frozen = true
    this.mutableState.value = { kind: 'logging-out' }
    this.logoutFlight = this.runLogout()
    return this.logoutFlight
  }

  async dispose(): Promise<void> {
    this.frozen = true
    this.lifecycle.abort(new DOMException('AuthSession disposed', 'AbortError'))
    if (this.refreshFlight) {
      await this.refreshFlight.catch(() => undefined)
    }
    this.coordinator.dispose?.()
    await this.adapter.clear()
    this.credential = null
    this.mutableState.value = { kind: 'anonymous' }
    this.events.clear()
  }

  private async runRefresh(): Promise<AuthState> {
    if (!this.connectivity.isOnline()) {
      await waitWithSignal(this.connectivity.waitUntilOnline(this.lifecycle.signal), this.lifecycle.signal)
    }

    const refreshController = new AbortController()
    const lifecycleAbort = () => refreshController.abort(this.lifecycle.signal.reason)
    this.lifecycle.signal.addEventListener('abort', lifecycleAbort, { once: true })
    const timeout = setTimeout(() => refreshController.abort(timeoutError()), this.refreshTimeoutMs)
    try {
      const next = await this.coordinator.run(
        () => waitWithSignal(this.adapter.refresh(refreshController.signal), refreshController.signal),
        refreshController.signal,
      )
      this.acceptCredential(next, 'refreshed')
      return this.mutableState.value
    } catch (error) {
      const reason = refreshController.signal.aborted ? refreshController.signal.reason : error
      const expiredReason = reason instanceof DOMException && reason.name === 'TimeoutError'
        ? 'timeout'
        : reason instanceof AuthSessionError && reason.code === 'auth.revoked'
          ? 'revoked'
          : 'rotation-failed'
      this.credential = null
      this.mutableState.value = { kind: 'expired', reason: expiredReason }
      this.events.emit({ type: 'expired', reason: expiredReason })
      await this.adapter.clear()
      throw reason
    } finally {
      clearTimeout(timeout)
      this.lifecycle.signal.removeEventListener('abort', lifecycleAbort)
    }
  }

  private async runLogout() {
    const accessToken = this.credential?.accessToken ?? null
    const revokeController = new AbortController()
    try {
      await this.adapter.revoke(accessToken, revokeController.signal)
    } catch {
      // Revocation is best effort; local cleanup must still finish in order.
    }
    await this.logoutHooks.disconnectRealtime()
    await this.logoutHooks.abortAuthenticatedRequests()
    await this.logoutHooks.removeRoutes()
    await this.logoutHooks.clearPrincipal()
    await this.logoutHooks.clearIdentityPersistence()
    await this.adapter.clear()
    this.credential = null
    this.mutableState.value = { kind: 'anonymous' }
    this.events.emit({ type: 'logged-out' })
    await this.logoutHooks.navigateToLogin()
  }

  private acceptCredential(credential: AccessCredential, event: 'authenticated' | 'refreshed') {
    if (!credential.accessToken || !Number.isFinite(credential.expiresAt) || credential.expiresAt <= this.now()) {
      throw new AuthSessionError('auth.credential_invalid', 'credential response is invalid')
    }
    this.credential = credential
    this.mutableState.value = { kind: 'authenticated', expiresAt: credential.expiresAt }
    this.events.emit({ type: event, expiresAt: credential.expiresAt })
  }
}
