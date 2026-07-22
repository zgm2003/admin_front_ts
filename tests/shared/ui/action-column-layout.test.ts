import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('affected table and dashboard layout contracts', () => {
  it('uses the home locale for the home notification link', () => {
    const source = read('src/views/Main/home/components/HomeNotificationsPanel.vue')

    expect(source).toContain("$t('home.viewAllNotifications')")
    expect(source).not.toContain("$t('notification.page.viewAll')")
  })

  it('keeps the user action column visible and wide enough for its controls', () => {
    const source = read('src/views/Main/user/userManager/components/UserList/index.vue')

    expect(source).toMatch(/key:\s*'actions',\s*label:.*?width:\s*220,\s*fixed:\s*'right'/s)
  })

  it('keeps all payment configuration actions visible', () => {
    const source = read('src/views/Main/payment/config/composables/usePaymentConfigPage.ts')

    expect(source).toMatch(/key:\s*'actions',\s*label:.*?width:\s*340,\s*fixed:\s*'right'/s)
  })
})
