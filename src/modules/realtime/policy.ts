import type { ShallowRef } from 'vue'
import { isApiError } from '@/modules/http/error'
import type { Persistence } from '@/modules/persistence/store'
import type { RealtimeTransport } from './transport'

export type RealtimeState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'connecting'; readonly attempt: number }
  | { readonly kind: 'authenticating'; readonly attempt: number }
  | { readonly kind: 'ready'; readonly userId: number; readonly heartbeatIntervalMs: number }
  | { readonly kind: 'waiting'; readonly attempt: number; readonly delayMs?: number }
  | { readonly kind: 'failed'; readonly error: unknown }
  | { readonly kind: 'closed' }

export interface RealtimeClock {
  setTimeout(run: () => void, delayMs: number): number
  clearTimeout(id: number): void
}

export interface RealtimeAvailability {
  isOnline(): boolean
  isVisible(): boolean
  subscribe(listener: () => void): () => void
}

export interface RealtimeIdentity {
  readonly userId: number
  readonly platform: 'admin'
}

export interface RealtimeRecoveryContext {
  readonly latestSequence: number
  readonly signal: AbortSignal
}

export type RealtimeRecoveryHandler = (context: RealtimeRecoveryContext) => Promise<void>

export interface RealtimeClientOptions {
  readonly endpoint: URL | (() => URL)
  readonly transport: RealtimeTransport
  readonly persistence: Persistence
  readonly issueTicket: (signal: AbortSignal) => Promise<string>
  readonly recover?: (context: RealtimeRecoveryContext) => Promise<number>
  readonly clock?: RealtimeClock
  readonly availability?: RealtimeAvailability
  readonly random?: () => number
  readonly maxPermanentAuthAttempts?: number
  readonly onProtocolError?: (error: unknown) => void
}

export const browserClock: RealtimeClock = {
  setTimeout(run, delayMs) {
    return globalThis.setTimeout(run, delayMs) as unknown as number
  },
  clearTimeout(id) {
    globalThis.clearTimeout(id)
  },
}

export const browserAvailability: RealtimeAvailability = {
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  isVisible: () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  subscribe(listener) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined
    window.addEventListener('online', listener)
    window.addEventListener('offline', listener)
    document.addEventListener('visibilitychange', listener)
    return () => {
      window.removeEventListener('online', listener)
      window.removeEventListener('offline', listener)
      document.removeEventListener('visibilitychange', listener)
    }
  },
}

export function computeReconnectDelay(attempt: number, random: () => number = Math.random): number {
  if (!Number.isSafeInteger(attempt) || attempt < 0) {
    throw new TypeError('realtime reconnect attempt must be a non-negative safe integer')
  }
  const jitter = random()
  if (!Number.isFinite(jitter) || jitter < 0 || jitter > 1) {
    throw new TypeError('realtime jitter source must return a number between 0 and 1')
  }
  const base = Math.min(30_000, 500 * (2 ** attempt))
  return Math.round(base + base * 0.25 * jitter)
}

export function validIdentity(identity: RealtimeIdentity): boolean {
  return identity.platform === 'admin'
    && Number.isSafeInteger(identity.userId)
    && identity.userId > 0
}

export function sameIdentity(left: RealtimeIdentity | null, right: RealtimeIdentity): boolean {
  return left?.userId === right.userId && left.platform === right.platform
}

export function permanentAuthenticationError(error: unknown): boolean {
  return isApiError(error)
    && (error.kind === 'authentication' || error.kind === 'authorization')
    && !error.retryable
}

export function shouldRestartAfterFlight(
  identity: RealtimeIdentity | null,
  state: RealtimeState,
  available: boolean,
  hasConnection: boolean,
  hasTimer: boolean,
): boolean {
  return Boolean(identity && state.kind !== 'failed' && available && !hasConnection && !hasTimer)
}

export interface ReconnectControllerOptions {
  readonly clock: RealtimeClock
  readonly availability: RealtimeAvailability
  readonly random: () => number
  readonly updateState: (state: RealtimeState) => void
  readonly canConnect: () => boolean
  readonly connect: () => void
}

export class ReconnectController {
  private readonly options: ReconnectControllerOptions
  private readonly unsubscribeAvailability: () => void
  private timer: number | null = null
  private failures = 0

  constructor(options: ReconnectControllerOptions) {
    this.options = options
    this.unsubscribeAvailability = options.availability.subscribe(() => this.availabilityChanged())
  }

  get nextAttempt(): number {
    return this.failures + 1
  }

  get hasTimer(): boolean {
    return this.timer !== null
  }

  get available(): boolean {
    return this.options.availability.isOnline() && this.options.availability.isVisible()
  }

  resetFailures(): void {
    this.failures = 0
  }

  reset(): void {
    this.cancelTimer()
    this.failures = 0
  }

  schedule(): void {
    if (this.timer !== null) return
    if (!this.available) {
      this.options.updateState({ kind: 'waiting', attempt: this.nextAttempt })
      return
    }
    try {
      const delayMs = computeReconnectDelay(this.failures, this.options.random)
      this.failures++
      this.options.updateState({ kind: 'waiting', attempt: this.failures, delayMs })
      this.timer = this.options.clock.setTimeout(() => {
        this.timer = null
        if (!this.available) {
          this.options.updateState({ kind: 'waiting', attempt: this.nextAttempt })
          return
        }
        this.options.connect()
      }, delayMs)
    } catch (error) {
      this.options.updateState({ kind: 'failed', error })
    }
  }

  dispose(): void {
    this.reset()
    this.unsubscribeAvailability()
  }

  private availabilityChanged(): void {
    if (!this.available) {
      this.cancelTimer()
      if (this.options.canConnect()) {
        this.options.updateState({ kind: 'waiting', attempt: this.nextAttempt })
      }
      return
    }
    if (this.options.canConnect() && this.timer === null) this.options.connect()
  }

  private cancelTimer(): void {
    if (this.timer === null) return
    this.options.clock.clearTimeout(this.timer)
    this.timer = null
  }
}

export type RealtimeStateRef = Readonly<ShallowRef<RealtimeState>>
