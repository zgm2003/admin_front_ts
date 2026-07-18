import type { PermissionCode } from '@/modules/routing/generated/permissions'

export interface PrincipalSnapshot {
  readonly userId: number
  readonly username: string
  readonly avatar: string
  readonly roleName: string
  readonly buttonCodes: ReadonlySet<PermissionCode>
}

export type ApiErrorKind =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'business'
  | 'rate-limit'
  | 'network'
  | 'timeout'
  | 'dependency'
  | 'contract'
  | 'canceled'
  | 'internal'

export interface ApiError {
  readonly kind: ApiErrorKind
  readonly code?: string
  readonly retryable: boolean
  readonly messageKey: string
  readonly messageData?: Readonly<Record<string, string | number>>
  readonly requestId?: string
  readonly traceId?: string
  readonly status?: number
  readonly cause?: unknown
}

export type BootstrapState =
  | { readonly kind: 'cold' }
  | { readonly kind: 'restoring-session' }
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'loading-principal' }
  | { readonly kind: 'installing-routes' }
  | { readonly kind: 'ready'; readonly principal: PrincipalSnapshot }
  | { readonly kind: 'failed'; readonly error: ApiError }

export function isProtectedContentVisible(
  state: BootstrapState,
): state is Extract<BootstrapState, { kind: 'ready' }> {
  return state.kind === 'ready'
}
