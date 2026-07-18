import { describe, expect, it } from 'vitest'
import {
  parseRuntimeRoute,
  validateRuntimeRouteSet,
} from '@/modules/routing/contracts'
import {
  createRuntimeBeforeEachGuard,
  validatedRelativeRedirect,
} from '@/modules/routing/guards'

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

describe('runtime route contracts', () => {
  it('accepts one exact closed route and rejects unapproved metadata', () => {
    expect(parseRuntimeRoute(route())).toMatchObject({
      name: 'menu_settings',
      path: '/system/setting',
      viewKey: 'system/setting',
    })
    expect(() => parseRuntimeRoute(route({
      redirect: 'https://attacker.example',
    }))).toThrow('runtime route contract invalid')
    expect(() => parseRuntimeRoute(route({
      meta: {
        titleKey: 'menu.system_setting',
        showMenu: true,
        pageLayout: 'plain',
      },
    }))).toThrow('runtime route contract invalid')
  })

  it('quarantines duplicate names and paths without discarding the independent route', () => {
    const result = validateRuntimeRouteSet([
      route(),
      route({ name: 'menu_settings', path: '/system/sms', viewKey: 'system/sms', menuId: '42' }),
      route({ name: 'menu_sms', menuId: '43' }),
      route({ name: 'menu_mail', path: '/system/mail', viewKey: 'system/mail', menuId: '44' }),
    ])

    expect(result.valid.map((item) => item.name)).toEqual(['menu_settings', 'menu_mail'])
    expect(result.quarantined.map((item) => item.reason)).toEqual([
      'duplicate-name',
      'duplicate-path',
    ])
  })

  it('quarantines missing parents, cycles, unknown views, and malformed metadata independently', () => {
    const result = validateRuntimeRouteSet([
      route(),
      route({
        name: 'child',
        path: '/child',
        parentName: 'missing-parent',
        viewKey: 'system/sms',
        menuId: '42',
      }),
      route({
        name: 'cycle-a',
        path: '/cycle-a',
        parentName: 'cycle-b',
        viewKey: 'system/mail',
        menuId: '43',
      }),
      route({
        name: 'cycle-b',
        path: '/cycle-b',
        parentName: 'cycle-a',
        viewKey: 'system/sms',
        menuId: '44',
      }),
      route({
        name: 'unknown-view',
        path: '/unknown',
        viewKey: 'system/not-documented',
        menuId: '45',
      }),
      route({
        name: 'bad-meta',
        path: '/bad-meta',
        viewKey: 'system/sms',
        menuId: '46',
        meta: { titleKey: '', showMenu: true, pageLayout: 'card' },
      }),
    ])

    expect(result.valid.map((item) => item.name)).toEqual(['menu_settings'])
    expect(new Set(result.quarantined.map((item) => item.reason))).toEqual(new Set([
      'missing-parent',
      'parent-cycle',
      'schema',
    ]))
  })
})

describe('kernel-owned navigation guard', () => {
  it('accepts only local relative redirects', () => {
    expect(validatedRelativeRedirect('/system/setting?tab=1')).toBe('/system/setting?tab=1')
    expect(validatedRelativeRedirect('https://attacker.example')).toBeNull()
    expect(validatedRelativeRedirect('//attacker.example/path')).toBeNull()
    expect(validatedRelativeRedirect('/\\attacker.example')).toBeNull()
    expect(validatedRelativeRedirect('/login')).toBeNull()
  })

  it('awaits bootstrap and redirects anonymous users without reading cookies or storage', async () => {
    const kernel = {
      state: { value: { kind: 'cold' } as const },
      bootstrap: async () => ({ kind: 'anonymous' } as const),
    }
    const guard = createRuntimeBeforeEachGuard(kernel)

    await expect(guard({ name: 'settings', fullPath: '/system/setting?tab=1' })).resolves.toEqual({
      name: 'login',
      query: { redirect: '/system/setting?tab=1' },
    })
    await expect(guard({ name: 'login', fullPath: '/login' })).resolves.toBe(true)
  })

  it('allows protected navigation only after a ready kernel state', async () => {
    const guard = createRuntimeBeforeEachGuard({
      state: { value: { kind: 'restoring-session' } as const },
      bootstrap: async () => ({
        kind: 'ready',
        principal: {
          userId: 7,
          username: 'admin',
          avatar: '',
          roleName: 'admin',
          buttonCodes: new Set(),
        },
      } as const),
    })

    await expect(guard({ name: 'settings', fullPath: '/system/setting' })).resolves.toBe(true)
  })
})
