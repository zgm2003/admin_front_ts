import { describe, expect, it, vi } from 'vitest'
import type { RouteRecordName, RouteRecordRaw } from 'vue-router'
import {
  RuntimeRouteRegistry,
  type RuntimeRouteRouter,
  type RuntimeRouteUiSnapshot,
  type RuntimeRouteUiState,
} from '@/modules/routing/registry'
import type { LocalViewLoader } from '@/modules/routing/generated/local-views'
import type { BackendViewKey } from '@/modules/routing/generated/views'

function route(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    name: 'menu_settings',
    path: '/system/setting',
    parentName: null,
    viewKey: 'system/setting',
    menuId: '41',
    permission: 'system_setting_edit',
    meta: {
      titleKey: 'menu.system_setting',
      showMenu: true,
      pageLayout: 'card',
    },
    ...overrides,
  }
}

class FakeRouter implements RuntimeRouteRouter {
  readonly routes = new Map<RouteRecordName, RouteRecordRaw>()
  readonly additions: RouteRecordName[] = []
  readonly removals: RouteRecordName[] = []
  readonly replace = vi.fn(async () => undefined)

  addRoute(_parentName: RouteRecordName, routeRecord: RouteRecordRaw): () => void {
    if (routeRecord.name === undefined) throw new Error('test route must have a name')
    const name = routeRecord.name
    if (this.routes.has(name)) throw new Error(`duplicate route ${String(name)}`)
    this.routes.set(name, routeRecord)
    this.additions.push(name)
    return () => {
      if (this.routes.delete(name)) this.removals.push(name)
    }
  }
}

class MemoryUiState implements RuntimeRouteUiState {
  value: RuntimeRouteUiSnapshot

  constructor(value: RuntimeRouteUiSnapshot) {
    this.value = value
  }

  snapshot(): RuntimeRouteUiSnapshot {
    return this.value
  }

  replace(value: RuntimeRouteUiSnapshot): void {
    this.value = value
  }
}

const loader = vi.fn(async () => ({ default: {} })) as LocalViewLoader

function registry(options: {
  readonly views?: Partial<Record<BackendViewKey, LocalViewLoader>>
  readonly ui?: RuntimeRouteUiSnapshot
} = {}) {
  const router = new FakeRouter()
  const uiState = new MemoryUiState(options.ui ?? {
    tabs: [{ routeName: 'home', path: '/home', menuId: '0' }],
    selectedMenuId: '0',
    lastRoute: '/home',
  })
  const value = new RuntimeRouteRegistry({
    router,
    views: options.views ?? {
      'system/setting': loader,
      'system/sms': loader,
      'system/mail': loader,
    },
    uiState,
    rootRouteName: 'HomeView',
  })
  return { registry: value, router, uiState }
}

describe('RuntimeRouteRegistry', () => {
  it('installs only a fully validated plan and quarantines unknown local views', async () => {
    const { registry: value, router } = registry({ views: { 'system/setting': loader } })

    const result = await value.install([
      route(),
      route({ name: 'menu_sms', path: '/system/sms', viewKey: 'system/sms', menuId: '42' }),
      route({ name: 'bad', path: '/bad', viewKey: 'not/in/backend-contract', menuId: '43' }),
    ], new Set(['system_setting_edit']))

    expect(result.installed.map((item) => item.name)).toEqual(['menu_settings'])
    expect(result.quarantined.map((item) => item.reason)).toEqual([
      'unknown-local-view',
      'schema',
    ])
    expect([...router.routes.keys()]).toEqual(['menu_settings'])
    expect(router.routes.get('menu_settings')?.component).toBe(loader)
  })

  it('removes the complete previous identity before installing the replacement', async () => {
    const { registry: value, router } = registry()
    await value.install([route()], new Set(['system_setting_edit']))

    await value.install([
      route({
        name: 'menu_sms',
        path: '/system/sms',
        viewKey: 'system/sms',
        menuId: '42',
        permission: undefined,
      }),
    ], new Set())

    expect(router.removals).toEqual(['menu_settings'])
    expect(router.additions).toEqual(['menu_settings', 'menu_sms'])
    expect([...router.routes.keys()]).toEqual(['menu_sms'])
  })

  it('quarantines children when their contract-valid parent has no local view', async () => {
    const { registry: value, router } = registry({ views: { 'system/sms': loader } })

    const result = await value.install([
      route({ permission: undefined }),
      route({
        name: 'menu_sms',
        path: '/system/sms',
        parentName: 'menu_settings',
        viewKey: 'system/sms',
        menuId: '42',
        permission: undefined,
      }),
    ], new Set())

    expect(result.installed).toEqual([])
    expect(result.quarantined.map((item) => item.reason)).toEqual([
      'unknown-local-view',
      'missing-parent',
    ])
    expect(router.routes.size).toBe(0)
  })

  it('repeated installation produces exactly one runtime route', async () => {
    const { registry: value, router } = registry()

    await value.install([route()], new Set(['system_setting_edit']))
    await value.install([route()], new Set(['system_setting_edit']))

    expect(router.routes.size).toBe(1)
    expect(router.additions).toEqual(['menu_settings', 'menu_settings'])
    expect(router.removals).toEqual(['menu_settings'])
  })

  it('filters denied presentation routes and reconciles tabs, menu, last route, and restore target', async () => {
    const { registry: value, router, uiState } = registry({
      ui: {
        tabs: [
          { routeName: 'home', path: '/home', menuId: '0' },
          { routeName: 'menu_settings', path: '/system/setting', menuId: '41' },
          { routeName: 'removed', path: '/removed', menuId: '99' },
        ],
        selectedMenuId: '99',
        lastRoute: '/system/setting',
      },
    })

    const result = await value.install([
      route(),
      route({
        name: 'menu_mail',
        path: '/system/mail',
        viewKey: 'system/mail',
        menuId: '44',
        permission: 'system_mail',
      }),
    ], new Set(['system_setting_edit']), { requestedPath: 'https://attacker.example' })

    expect(result.denied.map((item) => item.name)).toEqual(['menu_mail'])
    expect(result.restorePath).toBe('/system/setting')
    expect(router.replace).toHaveBeenCalledWith('/system/setting')
    expect(uiState.value).toEqual({
      tabs: [
        { routeName: 'home', path: '/home', menuId: '0' },
        { routeName: 'menu_settings', path: '/system/setting', menuId: '41' },
      ],
      selectedMenuId: '0',
      lastRoute: '/system/setting',
    })
  })

  it('rolls back a partial router write when installation throws', async () => {
    const { registry: value, router } = registry()
    await value.install([route()], new Set(['system_setting_edit']))
    const originalAdd = router.addRoute.bind(router)
    let attempts = 0
    router.addRoute = (parent, record) => {
      attempts += 1
      if (attempts === 2) throw new Error('router write failed')
      return originalAdd(parent, record)
    }

    await expect(value.install([
      route({ name: 'menu_sms', path: '/system/sms', viewKey: 'system/sms', menuId: '42', permission: undefined }),
      route({ name: 'menu_mail', path: '/system/mail', viewKey: 'system/mail', menuId: '43', permission: undefined }),
    ], new Set())).rejects.toThrow('router write failed')

    expect([...router.routes.keys()]).toEqual(['menu_settings'])
  })
})
