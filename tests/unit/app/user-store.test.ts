import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { parseRuntimeRoute } from '@/modules/routing/contracts'
import { useUserStore } from '@/store/user'

describe('user store principal projection', () => {
  it('projects the validated kernel principal and clears it without fetching', () => {
    const store = useUserStore(createPinia())
    const route = parseRuntimeRoute({
      name: 'menu_41',
      path: '/system/setting',
      parentName: null,
      viewKey: 'system/setting',
      menuId: '41',
      meta: { titleKey: 'menu.system_setting', showMenu: true, pageLayout: 'card' },
    })
    store.applyPrincipal({
      userId: 7,
      username: 'admin',
      avatar: '',
      roleName: 'administrator',
      menus: [{
        index: '41',
        label: 'Settings',
        path: '/system/setting',
        icon: 'Setting',
        i18n_key: 'menu.system_setting',
        show_menu: 1,
        sort: 1,
        parent_id: 0,
        children: [],
      }],
      routes: [route],
      buttonCodes: new Set(['system_setting_edit']),
    })

    expect(store.user_id).toBe(7)
    expect(store.permissions.map((item) => item.index)).toEqual(['0', '41'])
    expect(store.routes).toEqual([route])
    expect(store.can('system_setting_edit')).toBe(true)

    store.clearPrincipal()
    expect(store.user_id).toBe('')
    expect(store.permissions).toEqual([])
    expect(store.routes).toEqual([])
    expect(store.can('system_setting_edit')).toBe(false)
  })
})
