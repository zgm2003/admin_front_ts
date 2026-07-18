import { describe, expect, it } from 'vitest'
import { mapPrincipalRoutes } from '@/modules/routing/principal'

describe('users/me route mapping', () => {
  it('maps each formally documented field once and uses the generated view descriptor', () => {
    expect(mapPrincipalRoutes([{
      name: 'menu_41',
      path: '/system/setting',
      view_key: 'system/setting',
      meta: { menuId: '41', code: '' },
    }])).toEqual([{
      name: 'menu_41',
      path: '/system/setting',
      parentName: null,
      viewKey: 'system/setting',
      menuId: '41',
      meta: {
        titleKey: 'menu.system_setting',
        showMenu: true,
        pageLayout: 'card',
      },
    }])
  })

  it('fails closed when menuId is missing or route path conflicts with the view contract', () => {
    expect(() => mapPrincipalRoutes([{
      name: 'menu_41',
      path: '/system/setting',
      view_key: 'system/setting',
      meta: {},
    }])).toThrow('users/me route menu_41 is missing meta.menuId')

    expect(() => mapPrincipalRoutes([{
      name: 'menu_41',
      path: '/system/sms',
      view_key: 'system/setting',
      meta: { menuId: '41' },
    }])).toThrow('users/me route menu_41 path conflicts with view_key system/setting')
  })
})
