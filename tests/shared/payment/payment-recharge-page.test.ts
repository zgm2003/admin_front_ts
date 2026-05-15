import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment recharge page', () => {
  it('splits cashier page into focused components and hides raw payment fields', () => {
    const files = [
      'src/views/Main/payment/recharge/index.vue',
      'src/views/Main/payment/recharge/components/RechargePackageGrid.vue',
      'src/views/Main/payment/recharge/components/RechargePaymentMethodCard.vue',
      'src/views/Main/payment/recharge/components/RechargeCheckoutPanel.vue',
      'src/views/Main/payment/recharge/components/RechargeRecentRecords.vue',
      'src/views/Main/payment/recharge/components/RechargeRecordsTable.vue',
      'src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts',
    ]
    for (const file of files) expect(existsSync(resolve(process.cwd(), file))).toBe(true)

    const page = read(files[0])
    const records = read(files[5])
    const composable = read(files[6])
    const combined = files.map(read).join('\n')

    expect(page).toContain('class="payment-recharge-page"')
    expect(page).toContain('el-tabs')
    expect(page).toContain('RechargePackageGrid')
    expect(page).toContain('RechargePaymentMethodCard')
    expect(page).toContain('RechargeCheckoutPanel')
    expect(page).toContain('RechargeRecentRecords')
    expect(page).toContain('RechargeRecordsTable')
    expect(records).toContain("userStore.can('payment_recharge_pay')")
    expect(records).toContain("userStore.can('payment_recharge_sync')")
    expect(records).toContain("userStore.can('payment_recharge_close')")
    expect(records).toContain("import { Search } from '@/components/Search'")
    expect(records).toContain("import { AppTable } from '@/components/Table'")
    expect(composable).toContain('PaymentRechargeApi.add')
    expect(composable).toContain('return_url: rechargeReturnURL()')
    expect(composable).toContain('syncReturnRecharge')
    expect(combined).not.toContain('config_code')
    expect(combined).not.toContain('amount_yuan')
    expect(combined).not.toContain('同步返回地址')
    expect(combined).not.toContain('<el-dialog')
    expect(combined).not.toMatch(loose)
  })

  it('adds locale menu labels for recharge', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(zh).toContain("payment_recharge: '充值/记录'")
    expect(en).toContain("payment_recharge: 'Recharge'")
  })
})
