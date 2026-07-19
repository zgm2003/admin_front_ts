import type { ShallowRef } from 'vue'

export interface AccessCredential {
  readonly accessToken: string
  readonly expiresAt: number
}

export type LoginCommand =
  | {
    readonly login_type: 'password'
    readonly login_account: string
    readonly password: string
  }
  | {
    readonly login_type: 'email' | 'phone'
    readonly login_account: string
    readonly code: string
  }

export type AuthState =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'authenticating' }
  | { readonly kind: 'authenticated'; readonly expiresAt: number }
  | { readonly kind: 'refreshing'; readonly expiresAt?: number }
  | { readonly kind: 'logging-out' }
  | { readonly kind: 'expired'; readonly reason: 'revoked' | 'rotation-failed' | 'timeout' }

export interface CredentialAdapter {
  restore(signal: AbortSignal): Promise<AccessCredential | null>
  login(input: LoginCommand, signal: AbortSignal): Promise<AccessCredential>
  refresh(signal: AbortSignal): Promise<AccessCredential>
  revoke(accessToken: string | null, signal: AbortSignal): Promise<void>
  clear(): Promise<void>
}

export interface Connectivity {
  isOnline(): boolean
  waitUntilOnline(signal: AbortSignal): Promise<void>
}

export interface LogoutHooks {
  disconnectRealtime(): Promise<void>
  abortAuthenticatedRequests(): Promise<void>
  removeRoutes(): Promise<void>
  clearPrincipal(): Promise<void>
  clearIdentityPersistence(): Promise<void>
  navigateToLogin(): Promise<void>
}

export interface RefreshCoordinator {
  run<T extends { readonly expiresAt: number }>(
    operation: () => Promise<T>,
    signal: AbortSignal,
  ): Promise<T>
  dispose?(): void
}

export type AuthEvent =
  | { readonly type: 'authenticated'; readonly expiresAt: number }
  | { readonly type: 'refreshed'; readonly expiresAt: number }
  | { readonly type: 'expired'; readonly reason: 'revoked' | 'rotation-failed' | 'timeout' }
  | { readonly type: 'logged-out' }

export interface AuthSessionSnapshot {
  readonly state: Readonly<ShallowRef<AuthState>>
  subscribe(listener: (event: AuthEvent) => void): () => void
}

export class AuthSessionError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly status?: number

  constructor(
    code: string,
    message: string,
    options: { readonly retryable?: boolean; readonly status?: number } = {},
  ) {
    super(message)
    this.name = 'AuthSessionError'
    this.code = code
    this.retryable = options.retryable ?? false
    this.status = options.status
  }
}
