import { z } from 'zod'
import { defineCodec } from './codec'
import { deviceNamespace } from './namespaces'
import type { Persistence } from './store'

const sensitivePreferenceKeys = new Set([
  'accesstoken',
  'refreshtoken',
  'credential',
  'credentials',
  'principal',
  'permission',
  'permissions',
  'runtimeroute',
  'runtimeroutes',
])

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSensitiveKey)
  if (typeof value !== 'object' || value === null) return false
  return Object.entries(value).some(([key, child]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    return sensitivePreferenceKeys.has(normalized) || containsSensitiveKey(child)
  })
}

const safePreferenceMapSchema = z.record(z.string().min(1), z.json()).superRefine((value, context) => {
  if (containsSensitiveKey(value)) {
    context.addIssue({
      code: 'custom',
      message: 'preference data contains a forbidden security field',
    })
  }
})

const routeTabSchema = z.object({
  routeName: z.string().min(1),
  path: z.string().regex(/^\/(?!\/)/),
  menuId: z.string().min(1),
}).strict()

const userPreferencesSchema = z.object({
  tabs: z.array(routeTabSchema).max(64),
  selectedMenuId: z.string().min(1),
  lastRoute: z.string().regex(/^\/(?!\/)/).nullable(),
  tables: safePreferenceMapSchema,
  filters: safePreferenceMapSchema,
}).strict()

export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type PersistedRouteTab = z.infer<typeof routeTabSchema>

export const userPreferencesCodec = defineCodec({
  version: 1,
  maxBytes: 128 * 1024,
  schema: userPreferencesSchema,
})

const deviceIdentitySchema = z.object({
  deviceId: z.uuid(),
}).strict()

export const deviceIdentityCodec = defineCodec({
  version: 1,
  maxBytes: 512,
  schema: deviceIdentitySchema,
})

const devicePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['zh-CN', 'en-US']).optional(),
  rememberedLogin: z.object({
    account: z.string().max(320),
    type: z.enum(['password', 'email', 'phone']),
  }).strict().optional(),
}).strict()

export type DevicePreferences = z.infer<typeof devicePreferencesSchema>

export const devicePreferencesCodec = defineCodec({
  version: 2,
  maxBytes: 8 * 1024,
  schema: devicePreferencesSchema,
  migrate(version, value) {
    if (version !== 1 || typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const source = value as Record<string, unknown>
    return {
      ...(source.theme === undefined ? {} : { theme: source.theme }),
      ...(source.language === undefined ? {} : { language: source.language }),
      ...(source.rememberedLogin === undefined ? {} : { rememberedLogin: source.rememberedLogin }),
    }
  },
})

export function readDevicePreferences(persistence: Persistence): DevicePreferences {
  return persistence.read(deviceNamespace, 'preferences', devicePreferencesCodec) ?? {}
}

export function writeDevicePreferences(
  persistence: Persistence,
  value: DevicePreferences,
): DevicePreferences {
  const validated = devicePreferencesCodec.decode(value)
  persistence.write(deviceNamespace, 'preferences', devicePreferencesCodec, validated)
  return validated
}

const menuUiPreferencesSchema = z.object({
  systemColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  breadcrumb: z.boolean(),
  hamburger: z.boolean(),
  tabtag: z.boolean(),
  uniqueOpen: z.boolean(),
  footer: z.boolean(),
  pageTransition: z.boolean(),
  transitionName: z.string().min(1).max(64),
  layoutMode: z.enum(['single', 'double']),
}).strict()

export type MenuUiPreferences = z.infer<typeof menuUiPreferencesSchema>

export const menuUiPreferencesCodec = defineCodec({
  version: 1,
  maxBytes: 4 * 1024,
  schema: menuUiPreferencesSchema,
})

const aiChatPreferencesSchema = z.object({
  selectedAgentId: z.number().int().positive(),
}).strict()

export const aiChatPreferencesCodec = defineCodec({
  version: 1,
  maxBytes: 512,
  schema: aiChatPreferencesSchema,
})

export interface CurrentRoutePreference {
  readonly name: string
  readonly path: string
  readonly menuId: string
  readonly permission?: string
}

export function reconcileUserPreferences(
  restored: UserPreferences,
  currentRoutes: readonly CurrentRoutePreference[],
  permissions: ReadonlySet<string>,
): UserPreferences {
  const allowedRoutes = new Map<string, CurrentRoutePreference>()
  for (const route of currentRoutes) {
    if (route.permission === undefined || permissions.has(route.permission)) {
      allowedRoutes.set(route.name, route)
    }
  }

  const tabs: PersistedRouteTab[] = []
  const seen = new Set<string>()
  for (const tab of restored.tabs) {
    const isHome = tab.routeName === 'home' && tab.path === '/home' && tab.menuId === '0'
    const route = allowedRoutes.get(tab.routeName)
    const isAllowedRoute = route?.path === tab.path && route.menuId === tab.menuId
    if ((isHome || isAllowedRoute) && !seen.has(tab.routeName)) {
      tabs.push(tab)
      seen.add(tab.routeName)
    }
  }
  if (!seen.has('home')) {
    tabs.unshift({ routeName: 'home', path: '/home', menuId: '0' })
  }

  const allowedMenuIds = new Set(['0', ...[...allowedRoutes.values()].map((route) => route.menuId)])
  const allowedPaths = new Set(['/home', ...[...allowedRoutes.values()].map((route) => route.path)])
  return {
    tabs,
    selectedMenuId: allowedMenuIds.has(restored.selectedMenuId) ? restored.selectedMenuId : '0',
    lastRoute: restored.lastRoute !== null && allowedPaths.has(restored.lastRoute)
      ? restored.lastRoute
      : '/home',
    tables: restored.tables,
    filters: restored.filters,
  }
}
