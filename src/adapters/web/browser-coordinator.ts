import type { RefreshCoordinator } from '@/modules/auth/types'

export interface RefreshResultMessage {
  readonly type: 'refresh-result'
  readonly nonce: string
  readonly outcome: 'success' | 'failure'
  readonly issuedAt: number
  readonly expiresAt?: number
}

interface RefreshChannel {
  postMessage(message: RefreshResultMessage): void
  setMessageHandler(handler: (message: unknown) => void): void
  close(): void
}

interface LockManager {
  request<T>(
    name: string,
    options: { readonly mode: 'exclusive'; readonly signal: AbortSignal },
    callback: () => Promise<T>,
  ): Promise<T>
}

interface BrowserRefreshCoordinatorOptions {
  readonly lockManager: LockManager | null
  readonly channel: RefreshChannel
  readonly now?: () => number
  readonly randomNonce?: () => string
}

function isRefreshResultMessage(value: unknown): value is RefreshResultMessage {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  const allowedKeys = new Set(['type', 'nonce', 'outcome', 'issuedAt', 'expiresAt'])
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) return false
  return record.type === 'refresh-result'
    && typeof record.nonce === 'string'
    && (record.outcome === 'success' || record.outcome === 'failure')
    && typeof record.issuedAt === 'number'
    && (record.expiresAt === undefined || typeof record.expiresAt === 'number')
}

export class BrowserRefreshCoordinator implements RefreshCoordinator {
  private readonly listeners = new Set<(message: RefreshResultMessage) => void>()
  private readonly lockManager: LockManager | null
  private readonly channel: RefreshChannel
  private readonly now: () => number
  private readonly randomNonce: () => string
  private latestIssuedAt: number

  constructor(options: BrowserRefreshCoordinatorOptions) {
    this.lockManager = options.lockManager
    this.channel = options.channel
    this.now = options.now ?? Date.now
    this.randomNonce = options.randomNonce ?? (() => crypto.randomUUID())
    this.latestIssuedAt = this.now()
    this.channel.setMessageHandler((message) => this.acceptExternalMessage(message))
  }

  run<T extends { readonly expiresAt: number }>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
    const execute = async () => {
      const issuedAt = this.now()
      const nonce = this.randomNonce()
      try {
        const result = await operation()
        this.latestIssuedAt = Math.max(this.latestIssuedAt, issuedAt)
        this.channel.postMessage({
          type: 'refresh-result',
          nonce,
          outcome: 'success',
          issuedAt,
          expiresAt: result.expiresAt,
        })
        return result
      } catch (error) {
        this.channel.postMessage({ type: 'refresh-result', nonce, outcome: 'failure', issuedAt })
        throw error
      }
    }
    if (!this.lockManager) return execute()
    return this.lockManager.request('admin-auth-refresh', { mode: 'exclusive', signal }, execute)
  }

  subscribe(listener: (message: RefreshResultMessage) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose() {
    this.listeners.clear()
    this.channel.close()
  }

  private acceptExternalMessage(value: unknown) {
    if (!isRefreshResultMessage(value) || value.issuedAt <= this.latestIssuedAt) return
    this.latestIssuedAt = value.issuedAt
    for (const listener of this.listeners) listener(value)
  }
}

function createRefreshChannel(): RefreshChannel {
  if (typeof BroadcastChannel === 'undefined') {
    return {
      postMessage() {},
      setMessageHandler() {},
      close() {},
    }
  }
  const channel = new BroadcastChannel('admin-auth-refresh')
  return {
    postMessage(message) {
      channel.postMessage(message)
    },
    setMessageHandler(handler) {
      channel.onmessage = (event) => handler(event.data)
    },
    close() {
      channel.close()
    },
  }
}

export function createBrowserRefreshCoordinator(): BrowserRefreshCoordinator {
  const runtimeNavigator = typeof navigator === 'undefined'
    ? undefined
    : navigator as Navigator & { readonly locks?: LockManager }
  return new BrowserRefreshCoordinator({
    lockManager: runtimeNavigator?.locks ?? null,
    channel: createRefreshChannel(),
  })
}
