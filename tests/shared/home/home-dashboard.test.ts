import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readHomeIndexSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/Main/home/index.vue'), 'utf8')
}

function readHomeNotificationsSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/Main/home/components/HomeNotificationsPanel.vue'), 'utf8')
}

function readHomeDashboardComposableSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/Main/home/composables/useHomeDashboard.ts'), 'utf8')
}

function readHomeHelpersSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/Main/home/composables/helpers.ts'), 'utf8')
}

function existsFrontendPath(relativePath: string) {
  return existsSync(resolve(process.cwd(), relativePath))
}

describe('home dashboard helpers', async () => {
  const { resolveHomeNavigationAction } = await import('../../../src/views/Main/home/composables/helpers')

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
  it('keeps the home view as a notification dashboard after quick-entry removal', () => {
    const source = readHomeIndexSource()

    expect(source).toContain('display: flex;')
    expect(source).toContain('flex-direction: column;')
    expect(source).toContain('height: 100%;')
    expect(source).toContain('overflow: hidden;')
    expect(source).toContain('<HomeNotificationsPanel')
    expect(source).toContain('class="home-dashboard__card home-dashboard__card--notifications"')
    expect(source).not.toContain('HomeQuickEntryPanel')
    expect(source).not.toContain('home-dashboard__card--quick-entry')
    expect(source).not.toContain('quickEntry')
    expect(source).not.toContain('QuickEntry')
  })

  it('deletes quick-entry local components and API client', () => {
    expect(existsFrontendPath('src/api/user/usersQuickEntry.ts')).toBe(false)
    expect(existsFrontendPath('src/views/Main/home/components/HomeQuickEntryPanel.vue')).toBe(false)
    expect(existsFrontendPath('src/views/Main/home/components/HomeQuickEntryManagerDialog.vue')).toBe(false)
  })
})

describe('home dashboard content contract', () => {
  it('keeps unread notification count in the title row instead of a separate metric block', () => {
    const source = readHomeNotificationsSource()

    expect(source).toContain('card-title-row')
    expect(source).toContain('card-count-badge')
    expect(source).toContain(`$emit('open')`)
    expect(source).toContain(`notification.page.viewAll`)
    expect(source).not.toContain('card-metric')
    expect(source).not.toContain('home.unreadNotifications')
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

  it('removes quick-entry state, API calls, and helper exports from the home feature', () => {
    const composable = readHomeDashboardComposableSource()
    const helpers = readHomeHelpersSource()

    for (const forbidden of [
      'UsersQuickEntryApi',
      'quickEntry',
      'QuickEntry',
      'HOME_QUICK_ENTRY_LIMIT',
      'buildQuickEntryDraft',
      'buildQuickEntryManagerOptions',
      'moveQuickEntryDraftItem',
      'isQuickEntryLimitReached',
    ]) {
      expect(composable).not.toContain(forbidden)
      expect(helpers).not.toContain(forbidden)
    }
  })
})
