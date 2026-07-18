import type { Pinia } from 'pinia'
import type { RuntimeRoute } from '@/modules/routing/contracts'
import type {
  RuntimeRouteTab,
  RuntimeRouteUiSnapshot,
  RuntimeRouteUiState,
} from '@/modules/routing/registry'
import { HOME_MENU_ITEM, useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'
import { userNamespace, type UserNamespace } from './namespaces'
import {
  reconcileUserPreferences,
  userPreferencesCodec,
  type UserPreferences,
} from './preferences'
import type { Persistence } from './store'

const PREFERENCE_KEY = 'ui'

function defaultPreferences(): UserPreferences {
  return {
    tabs: [{ routeName: 'home', path: '/home', menuId: '0' }],
    selectedMenuId: '0',
    lastRoute: '/home',
    tables: {},
    filters: {},
  }
}

export class MenuIdentityPersistence implements RuntimeRouteUiState {
  private readonly pinia: Pinia
  private readonly persistence: Persistence
  private namespace: UserNamespace | null = null
  private routes: readonly RuntimeRoute[] = []
  private permissions: ReadonlySet<string> = new Set()
  private preferences: UserPreferences = defaultPreferences()
  private unsubscribe: (() => void) | null = null
  private applying = false

  constructor(pinia: Pinia, persistence: Persistence) {
    this.pinia = pinia
    this.persistence = persistence
  }

  activate(
    userId: number,
    routes: readonly RuntimeRoute[],
    permissions: ReadonlySet<string>,
  ): void {
    this.clearActive(false)
    this.namespace = userNamespace(userId)
    this.routes = routes
    this.permissions = permissions
    const restored = this.persistence.read(this.namespace, PREFERENCE_KEY, userPreferencesCodec)
      ?? defaultPreferences()
    this.preferences = reconcileUserPreferences(
      restored,
      routes.map((route) => ({
        name: String(route.name),
        path: String(route.path),
        menuId: route.menuId,
        ...(route.permission ? { permission: route.permission } : {}),
      })),
      permissions,
    )
    this.applyPreferences(this.preferences)
    this.write()
    const store = useMenuStore(this.pinia)
    this.unsubscribe = store.$subscribe(() => {
      if (!this.applying) this.persistStoreState()
    }, { detached: true, flush: 'sync' })
  }

  snapshot(): RuntimeRouteUiSnapshot {
    if (!this.namespace) {
      return {
        tabs: [{ routeName: 'home', path: '/home', menuId: '0' }],
        selectedMenuId: '0',
        lastRoute: '/home',
      }
    }
    return {
      tabs: this.tabsFromStore(),
      selectedMenuId: useMenuStore(this.pinia).selectedMenu,
      lastRoute: this.preferences.lastRoute,
    }
  }

  replace(value: RuntimeRouteUiSnapshot): void {
    if (!this.namespace) return
    this.preferences = reconcileUserPreferences({
      ...this.preferences,
      tabs: [...value.tabs],
      selectedMenuId: value.selectedMenuId,
      lastRoute: value.lastRoute,
    }, this.routes.map((route) => ({
      name: String(route.name),
      path: String(route.path),
      menuId: route.menuId,
      ...(route.permission ? { permission: route.permission } : {}),
    })), this.permissions)
    this.applyPreferences(this.preferences)
    this.write()
  }

  setLastRoute(path: string): void {
    if (!this.namespace) return
    this.preferences = { ...this.preferences, lastRoute: path }
    this.write()
  }

  clearActive(clearStorage: boolean): void {
    const activeNamespace = this.namespace
    this.unsubscribe?.()
    this.unsubscribe = null
    this.namespace = null
    this.routes = []
    this.permissions = new Set()
    this.preferences = defaultPreferences()
    useMenuStore(this.pinia).reset()
    if (clearStorage && activeNamespace) this.persistence.clearNamespace(activeNamespace)
  }

  private tabsFromStore(): readonly RuntimeRouteTab[] {
    const routesByMenu = new Map(this.routes.map((route) => [route.menuId, route]))
    const tabs: RuntimeRouteTab[] = []
    for (const item of useMenuStore(this.pinia).tabList) {
      if (item.index === '0' && item.path === '/home') {
        tabs.push({ routeName: 'home', path: '/home', menuId: '0' })
        continue
      }
      const route = routesByMenu.get(item.index)
      if (route && route.path === item.path) {
        tabs.push({ routeName: String(route.name), path: String(route.path), menuId: route.menuId })
      }
    }
    return tabs
  }

  private persistStoreState(): void {
    const menu = useMenuStore(this.pinia)
    this.preferences = {
      ...this.preferences,
      tabs: [...this.tabsFromStore()],
      selectedMenuId: menu.selectedMenu,
    }
    this.write()
  }

  private applyPreferences(value: UserPreferences): void {
    const menu = useMenuStore(this.pinia)
    const user = useUserStore(this.pinia)
    const routeByName = new Map(this.routes.map((route) => [String(route.name), route]))
    const tabs = value.tabs.flatMap((tab) => {
      if (tab.routeName === 'home') return [HOME_MENU_ITEM]
      const route = routeByName.get(tab.routeName)
      const item = user.permissionMap.get(tab.menuId)
      return route
        && route.path === tab.path
        && route.menuId === tab.menuId
        && item?.path === tab.path
        ? [item]
        : []
    })
    this.applying = true
    menu.$patch({
      tabList: tabs.some((tab) => tab.index === '0') ? tabs : [HOME_MENU_ITEM, ...tabs],
      selectedMenu: value.selectedMenuId,
    })
    this.applying = false
  }

  private write(): void {
    if (!this.namespace) return
    this.persistence.write(this.namespace, PREFERENCE_KEY, userPreferencesCodec, this.preferences)
  }
}
