import type { RouteLocationRaw, RouteRecordName } from 'vue-router'
import type { BootstrapState } from '@/app/state'

export interface RoutingKernel {
  readonly state: { readonly value: BootstrapState }
  bootstrap(): Promise<BootstrapState>
}

export interface GuardTarget {
  readonly name: RouteRecordName | null | undefined
  readonly fullPath: string
}

const publicRouteNames = new Set<RouteRecordName>(['login', '404'])

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }
  return false
}

export function validatedRelativeRedirect(value: string): string | null {
  if (
    !value
    || value !== value.trim()
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || containsControlCharacter(value)
  ) {
    return null
  }
  try {
    const parsed = new URL(value, 'https://admin.invalid')
    if (parsed.origin !== 'https://admin.invalid' || parsed.pathname === '/login') return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

function anonymousTarget(to: GuardTarget): RouteLocationRaw {
  const redirect = validatedRelativeRedirect(to.fullPath)
  return redirect
    ? { name: 'login', query: { redirect } }
    : { name: 'login' }
}

export function createRuntimeBeforeEachGuard(kernel: RoutingKernel) {
  return async (to: GuardTarget): Promise<true | false | RouteLocationRaw> => {
    if (to.name !== null && to.name !== undefined && publicRouteNames.has(to.name)) return true
    let state = kernel.state.value
    if (state.kind === 'installing-routes') return true
    if (
      state.kind === 'cold'
      || state.kind === 'restoring-session'
      || state.kind === 'loading-principal'
    ) {
      state = await kernel.bootstrap()
    }
    if (state.kind === 'ready') return true
    if (state.kind === 'anonymous') return anonymousTarget(to)
    return false
  }
}
