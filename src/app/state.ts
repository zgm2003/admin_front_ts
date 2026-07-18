import type { PermissionCode } from '@/modules/routing/generated/permissions'
import type { RuntimeRoute } from '@/modules/routing/contracts'
import type { ApiError } from '@/modules/http/error'
import type { PrincipalMenuItem } from '@/modules/http/schema'

export interface PrincipalSnapshot {
  readonly userId: number
  readonly username: string
  readonly avatar: string
  readonly roleName: string
  readonly menus: readonly PrincipalMenuItem[]
  readonly routes: readonly RuntimeRoute[]
  readonly buttonCodes: ReadonlySet<PermissionCode>
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
