import { z } from 'zod'
import { backendViewKeys, type BackendViewKey } from './generated/views'
import { permissionCodes, type PermissionCode } from './generated/permissions'

declare const runtimeRouteNameBrand: unique symbol
declare const runtimeRoutePathBrand: unique symbol

export type RuntimeRouteName = string & { readonly [runtimeRouteNameBrand]: true }
export type RuntimeRoutePath = `/${string}` & { readonly [runtimeRoutePathBrand]: true }

export interface RuntimeRoute {
  readonly name: RuntimeRouteName
  readonly path: RuntimeRoutePath
  readonly parentName: RuntimeRouteName | null
  readonly viewKey: BackendViewKey
  readonly menuId: string
  readonly permission?: PermissionCode
  readonly meta: {
    readonly titleKey: string
    readonly showMenu: boolean
    readonly pageLayout: 'card' | 'full' | 'centered'
  }
}

export type RouteQuarantineReason =
  | 'schema'
  | 'duplicate-name'
  | 'duplicate-path'
  | 'missing-parent'
  | 'parent-cycle'
  | 'unknown-local-view'

export interface QuarantinedRuntimeRoute {
  readonly index: number
  readonly name?: string
  readonly reason: RouteQuarantineReason
}

export interface RuntimeRouteSetValidation {
  readonly valid: readonly RuntimeRoute[]
  readonly quarantined: readonly QuarantinedRuntimeRoute[]
}

const routeNameSchema = z.string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/)

const routePathSchema = z.string()
  .min(2)
  .max(512)
  .superRefine((value, context) => {
    if (
      !value.startsWith('/')
      || value.startsWith('//')
      || value.includes('\\')
      || value.includes('?')
      || value.includes('#')
      || value.split('/').some((segment) => segment === '.' || segment === '..')
    ) {
      context.addIssue({ code: 'custom', message: 'route path must be a safe absolute application path' })
    }
  })

export const runtimeRouteSchema = z.object({
  name: routeNameSchema,
  path: routePathSchema,
  parentName: routeNameSchema.nullable(),
  viewKey: z.enum(backendViewKeys),
  menuId: z.string().min(1).max(128),
  permission: z.enum(permissionCodes).optional(),
  meta: z.object({
    titleKey: z.string().min(1).max(256).regex(/^[A-Za-z0-9_.:-]+$/),
    showMenu: z.boolean(),
    pageLayout: z.enum(['card', 'full', 'centered']),
  }).strict(),
}).strict()

function routeName(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('name' in value)) return undefined
  return typeof value.name === 'string' ? value.name : undefined
}

export function parseRuntimeRoute(value: unknown): RuntimeRoute {
  const parsed = runtimeRouteSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error('runtime route contract invalid')
  }
  return parsed.data as RuntimeRoute
}

function cycleNames(routes: ReadonlyMap<string, RuntimeRoute>): ReadonlySet<string> {
  const cycles = new Set<string>()
  const state = new Map<string, 'visiting' | 'visited'>()
  const stack: string[] = []

  const visit = (name: string) => {
    const current = state.get(name)
    if (current === 'visited') return
    if (current === 'visiting') {
      const start = stack.lastIndexOf(name)
      for (const cycleName of stack.slice(Math.max(0, start))) cycles.add(cycleName)
      return
    }
    state.set(name, 'visiting')
    stack.push(name)
    const parentName = routes.get(name)?.parentName
    if (parentName && routes.has(parentName)) visit(parentName)
    stack.pop()
    state.set(name, 'visited')
  }

  for (const name of routes.keys()) visit(name)
  return cycles
}

export function validateRuntimeRouteSet(values: readonly unknown[]): RuntimeRouteSetValidation {
  const accepted: Array<{ readonly index: number; readonly route: RuntimeRoute }> = []
  const quarantined: QuarantinedRuntimeRoute[] = []
  const names = new Set<string>()
  const paths = new Set<string>()

  values.forEach((value, index) => {
    let route: RuntimeRoute
    try {
      route = parseRuntimeRoute(value)
    } catch {
      quarantined.push({ index, name: routeName(value), reason: 'schema' })
      return
    }
    if (names.has(route.name)) {
      quarantined.push({ index, name: route.name, reason: 'duplicate-name' })
      return
    }
    if (paths.has(route.path)) {
      quarantined.push({ index, name: route.name, reason: 'duplicate-path' })
      return
    }
    names.add(route.name)
    paths.add(route.path)
    accepted.push({ index, route })
  })

  const active = new Map(accepted.map((entry) => [entry.route.name as string, entry]))
  let changed = true
  while (changed) {
    changed = false
    for (const [name, entry] of active) {
      const parentName = entry.route.parentName
      if (parentName !== null && !active.has(parentName)) {
        quarantined.push({ index: entry.index, name, reason: 'missing-parent' })
        active.delete(name)
        changed = true
      }
    }
  }

  const routeMap = new Map([...active].map(([name, entry]) => [name, entry.route]))
  for (const name of cycleNames(routeMap)) {
    const entry = active.get(name)
    if (!entry) continue
    quarantined.push({ index: entry.index, name, reason: 'parent-cycle' })
    active.delete(name)
  }

  changed = true
  while (changed) {
    changed = false
    for (const [name, entry] of active) {
      const parentName = entry.route.parentName
      if (parentName !== null && !active.has(parentName)) {
        quarantined.push({ index: entry.index, name, reason: 'missing-parent' })
        active.delete(name)
        changed = true
      }
    }
  }

  const valid = accepted
    .filter((entry) => active.has(entry.route.name))
    .map((entry) => entry.route)
  quarantined.sort((left, right) => left.index - right.index)
  return { valid, quarantined }
}
