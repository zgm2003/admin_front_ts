import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readHomeIndexSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/home/index.vue'),
    'utf8',
  )
}

function readHomeHeroSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/home/components/HomeHeroPanel.vue'),
    'utf8',
  )
}


function readHomeNotificationsSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/home/components/HomeNotificationsPanel.vue'),
    'utf8',
  )
}

function readHomeQuickEntrySource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/home/components/HomeQuickEntryPanel.vue'),
    'utf8',
  )
}

function readHomeDashboardComposableSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/views/Main/home/composables/useHomeDashboard.ts'),
    'utf8',
  )
}

function readUsersQuickEntryApiSource() {
  return readFileSync(
    resolve(process.cwd(), 'src/api/user/usersQuickEntry.ts'),
    'utf8',
  )
}

describe('home dashboard helpers', async () => {
  const {
    HOME_QUICK_ENTRY_LIMIT,
    buildAddressLabel,
    buildQuickEntryDraft,
    buildQuickEntryManagerOptions,
    resolveHomeNavigationAction,
    isQuickEntryLimitReached,
    moveQuickEntryDraftItem,
  } = await import('../../../src/views/Main/home/composables/helpers')

  it('locks quick entries to a small fixed limit', () => {
    expect(HOME_QUICK_ENTRY_LIMIT).toBe(6)
    expect(isQuickEntryLimitReached(5)).toBe(false)
    expect(isQuickEntryLimitReached(6)).toBe(true)
  })


  it('derives quick entry options only from actual route pages with menu ids', () => {
    const permissionMap = new Map([
      ['12', { index: '12', label: '用户管理', path: '/user/userManager', icon: 'User' }],
      ['13', { index: '13', label: '登录日志', path: '/user/usersLoginLog', icon: 'Tickets' }],
      ['0', { index: '0', label: '首页', path: '/home', icon: 'HomeFilled' }],
    ])

    const routes = [
      { path: '/user/userManager', name: 'menu_12', view_key: 'user/userManager', meta: { menuId: '12' } },
      { path: '/user/usersLoginLog', name: 'menu_13', view_key: 'user/usersLoginLog', meta: { menuId: '13' } },
      { path: '/home', name: 'menu_0', view_key: 'home', meta: { menuId: '0' } },
      { path: '/weird', name: 'menu_x', view_key: 'weird', meta: {} },
    ]

    expect(buildQuickEntryManagerOptions({
      routes,
      permissionMap,
      selectedPermissionIds: new Set([13]),
    })).toEqual([
      {
        permissionId: 12,
        label: '用户管理',
        path: '/user/userManager',
        icon: 'User',
      },
    ])
  })

  it('creates draft entries from the current quick entry list and supports move operations', () => {
    const permissionMap = new Map([
      ['12', { index: '12', label: '用户管理', path: '/user/userManager', icon: 'User' }],
      ['13', { index: '13', label: '登录日志', path: '/user/usersLoginLog', icon: 'Tickets' }],
    ])

    const routes = [
      { path: '/user/userManager', name: 'menu_12', view_key: 'user/userManager', meta: { menuId: '12' } },
      { path: '/user/usersLoginLog', name: 'menu_13', view_key: 'user/usersLoginLog', meta: { menuId: '13' } },
    ]

    const draft = buildQuickEntryDraft({
      quickEntries: [
        { id: 100, permission_id: 12 },
        { id: 101, permission_id: 13 },
      ],
      routes,
      permissionMap,
    })

    expect(draft.map((item) => item.permissionId)).toEqual([12, 13])
    expect(moveQuickEntryDraftItem(draft, 1, -1).map((item) => item.permissionId)).toEqual([13, 12])
    expect(moveQuickEntryDraftItem(draft, 0, -1).map((item) => item.permissionId)).toEqual([12, 13])
  })

  it('builds a full address path from the cascader tree', () => {
    const tree = [
      {
        label: '河南省',
        value: 1,
        children: [
          {
            label: '洛阳市',
            value: 2,
            children: [
              { label: '伊川县', value: 3 },
            ],
          },
        ],
      },
    ]

    expect(buildAddressLabel(tree, 3)).toBe('河南省 / 洛阳市 / 伊川县')
    expect(buildAddressLabel(tree, 999)).toBe('')
  })

  it('distinguishes internal routes from external notification links', () => {
    expect(resolveHomeNavigationAction('')).toEqual({ type: 'none' })
    expect(resolveHomeNavigationAction('/notification')).toEqual({ type: 'internal', value: '/notification' })
    expect(resolveHomeNavigationAction('https://example.com/notice')).toEqual({
      type: 'external',
      value: 'https://example.com/notice',
    })
  })
})

describe('home dashboard layout contract', () => {
  it('uses a direct 2x2 card grid instead of main/side column wrappers', () => {
    const source = readHomeIndexSource()

    expect(source).toContain('display: flex;')
    expect(source).toContain('flex-direction: column;')
    expect(source).toContain('height: 100%;')
    expect(source).toContain('overflow: hidden;')
    expect(source).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(source).toContain('grid-template-rows: minmax(0, 1fr);')
    expect(source).toContain('class="home-dashboard__card home-dashboard__card--hero"')
    expect(source).toContain('class="home-dashboard__card home-dashboard__card--notifications"')
    expect(source).not.toContain('HomeWalletPanel')
    expect(source).toContain('<div class="home-dashboard__card home-dashboard__card--quick-entry">')
    expect(source).not.toContain('home-dashboard__main')
    expect(source).not.toContain('home-dashboard__side')
  })

  it('wraps the multi-root quick-entry component before applying grid placement classes', () => {
    const indexSource = readHomeIndexSource()
    const quickEntrySource = readHomeQuickEntrySource()

    expect(indexSource).not.toContain('<HomeQuickEntryPanel\n        class=')
    expect(indexSource).toContain('<div class="home-dashboard__card home-dashboard__card--quick-entry">')
    expect(quickEntrySource).toContain('<HomeQuickEntryManagerDialog')
  })

  it('keeps the profile card inside the 2x2 grid instead of placing it above the grid', () => {
    const source = readHomeIndexSource()
    const gridIndex = source.indexOf('<div class="home-dashboard__grid">')
    const heroIndex = source.indexOf('<HomeHeroPanel')

    expect(gridIndex).toBeGreaterThan(-1)
    expect(heroIndex).toBeGreaterThan(gridIndex)
  })
})

describe('home quadrant content contract', () => {
  it('does not render the date label in the profile quadrant', () => {
    const heroSource = readHomeHeroSource()
    const indexSource = readHomeIndexSource()

    expect(heroSource).not.toContain('dateLabel')
    expect(heroSource).not.toContain('hero-eyebrow')
    expect(indexSource).not.toContain(':date-label=')
  })

  it('keeps the first quadrant focused on profile summary instead of signal cards', () => {
    const source = readHomeHeroSource()
    const indexSource = readHomeIndexSource()

    expect(source).toContain(`$emit('personal')`)
    expect(source).toContain('profile-details')
    expect(source).not.toContain('profile-bio')
    expect(source).not.toContain('profileBio')
    expect(source).not.toContain('hero-signals')
    expect(source).not.toContain('security-strip')
    expect(source).toContain(':title="item.value"')
    expect(indexSource).not.toContain(':profile-bio=')
    expect(indexSource).not.toContain(':signals=')
    expect(indexSource).not.toContain(':security-items=')
  })


  it('keeps unread notification count in the title row instead of a separate metric block', () => {
    const source = readHomeNotificationsSource()

    expect(source).toContain('card-title-row')
    expect(source).toContain('card-count-badge')
    expect(source).toContain(`$emit('open')`)
    expect(source).toContain(`notification.page.viewAll`)
    expect(source).not.toContain('card-metric')
    expect(source).not.toContain("home.unreadNotifications")
  })

  it('marks unread notifications in the card and hides native scrollbars while preserving scrolling', () => {
    const source = readHomeNotificationsSource()

    expect(source).toContain('CommonEnum.NO')
    expect(source).toContain('isUnread(item)')
    expect(source).toContain('notification-item--unread')
    expect(source).toContain('scrollbar-width: none;')
    expect(source).toContain('::-webkit-scrollbar')
  })

  it('does not block notification navigation on the read request', () => {
    const source = readHomeDashboardComposableSource()

    expect(source).not.toContain('await NotificationApi.read')
  })

  it('saves quick entries through a single backend save call', () => {
    const source = readHomeDashboardComposableSource()

    expect(source).toContain('UsersQuickEntryApi.save')
    expect(source).not.toContain('await UsersQuickEntryApi.del')
    expect(source).not.toContain('await UsersQuickEntryApi.add')
    expect(source).not.toContain('await UsersQuickEntryApi.sort')
  })


  it('keeps the quick entry manager as a home-local component instead of a shared app component', () => {
    const quickEntrySource = readHomeQuickEntrySource()

    expect(quickEntrySource).toContain("import HomeQuickEntryManagerDialog from './HomeQuickEntryManagerDialog.vue'")
    expect(quickEntrySource).not.toContain("@/components/QuickEntryManager")
  })

  it('keeps the quick-entry client API write contract to save only', () => {
    const source = readUsersQuickEntryApiSource()

    expect(source).toContain('save: (params: { permission_ids: number[] }) =>')
    expect(source).not.toContain('add: (params:')
    expect(source).not.toContain('del: (params:')
    expect(source).not.toContain('sort: (params:')
  })
})
