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

  it.each([
    ['payment configuration', 'src/views/Main/payment/config/index.vue', 'payment-config-page__actions'],
    ['AI provider', 'src/views/Main/ai/providers/index.vue', 'ai-provider-page__actions'],
    ['recharge record', 'src/views/Main/payment/recharge/components/RechargeRecordsTable.vue', 'recharge-records-table__actions'],
    ['user list', 'src/views/Main/user/userManager/components/UserList/index.vue', 'user-list-actions'],
  ])('renders %s action buttons directly in the centered AppTable column', (_, path, wrapperClass) => {
    const source = read(path)

    expect(source).not.toContain(`class="${wrapperClass}"`)
    expect(source).not.toContain(`.${wrapperClass}`)
  })
})
