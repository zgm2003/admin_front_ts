import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { deviceNamespace, userNamespace } from '@/modules/persistence/namespaces'
import { MenuIdentityPersistence } from '@/modules/persistence/menu-state'
import {
  deviceIdentityCodec,
  userPreferencesCodec,
} from '@/modules/persistence/preferences'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'
import { parseRuntimeRoute } from '@/modules/routing/contracts'
import { useMenuStore } from '@/store/menu'
import { useUserStore } from '@/store/user'

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  keys() { return [...this.values.keys()] }
}

describe('identity-scoped menu persistence', () => {
  it('reconciles compact tabs with current routes and clears only the active user', () => {
    const persistence = new Persistence(new MemoryStorage())
    persistence.write(deviceNamespace, 'identity', deviceIdentityCodec, {
      deviceId: '8d4fc816-0eb7-4b72-a31f-25d8fb98c819',
    })
    persistence.write(userNamespace(7), 'ui', userPreferencesCodec, {
      tabs: [
        { routeName: 'home', path: '/home', menuId: '0' },
        { routeName: 'menu_41', path: '/system/setting', menuId: '41' },
        { routeName: 'stale', path: '/removed', menuId: '99' },
      ],
      selectedMenuId: '41',
      lastRoute: '/system/setting',
      tables: {},
      filters: {},
    })
    const pinia = createPinia()
    const route = parseRuntimeRoute({
      name: 'menu_41',
      path: '/system/setting',
      parentName: null,
      viewKey: 'system/setting',
      menuId: '41',
      meta: { titleKey: 'menu.system_setting', showMenu: true, pageLayout: 'card' },
    })
    useUserStore(pinia).applyPrincipal({
      userId: 7,
      username: 'admin',
      avatar: '',
      roleName: 'administrator',
      menus: [{
        index: '41', label: 'Settings', path: '/system/setting', icon: 'Setting',
        i18n_key: 'menu.system_setting', show_menu: 1, sort: 1, parent_id: 0, children: [],
      }],
      routes: [route],
      buttonCodes: new Set(),
    })
    const controller = new MenuIdentityPersistence(pinia, persistence)

    controller.activate(7, [route], new Set())

    expect(useMenuStore(pinia).tabList.map((item) => item.index)).toEqual(['0', '41'])
    expect(controller.snapshot()).toEqual({
      tabs: [
        { routeName: 'home', path: '/home', menuId: '0' },
        { routeName: 'menu_41', path: '/system/setting', menuId: '41' },
      ],
      selectedMenuId: '41',
      lastRoute: '/system/setting',
    })

    controller.clearActive(true)
    expect(persistence.read(userNamespace(7), 'ui', userPreferencesCodec)).toBeNull()
    expect(persistence.read(deviceNamespace, 'identity', deviceIdentityCodec)).not.toBeNull()
  })
})
