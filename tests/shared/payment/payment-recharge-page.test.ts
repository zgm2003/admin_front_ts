import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment recharge page', () => {
  it('splits cashier page into focused components and hides raw payment fields', () => {
    const pageFile = 'src/views/Main/payment/recharge/index.vue'
    const recordsFile = 'src/views/Main/payment/recharge/components/RechargeRecordsTable.vue'
    const composableFile = 'src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts'
    const files = [
      pageFile,
      'src/views/Main/payment/recharge/components/RechargePackageGrid.vue',
      'src/views/Main/payment/recharge/components/RechargeCheckoutPanel.vue',
      'src/views/Main/payment/recharge/components/RechargeRecentRecords.vue',
      recordsFile,
      composableFile,
    ]
    for (const file of files) expect(existsSync(resolve(process.cwd(), file))).toBe(true)

    const page = read(pageFile)
    const records = read(recordsFile)
    const composable = read(composableFile)
    const combined = files.map(read).join('\n')

    expect(page).toContain('class="payment-recharge-page"')
    expect(page).toContain('el-tabs')
    expect(page).toContain('RechargePackageGrid')
    expect(page).toContain('RechargeCheckoutPanel')
    expect(page).toContain('RechargeRecentRecords')
    expect(page).toContain('RechargeRecordsTable')
    expect(records).toContain("userStore.can('payment_recharge_pay')")
    expect(records).toContain("userStore.can('payment_recharge_sync')")
    expect(records).toContain("userStore.can('payment_recharge_close')")
    expect(records).toContain("import { Search } from '@/components/Search'")
    expect(records).toContain("import { AppTable } from '@/components/Table'")
    expect(composable).toContain("const canCreateRecharge = computed(() => userStore.can('payment_recharge_add'))")
    expect(composable).toContain('canCreateRecharge.value')
    expect(composable).toMatch(/async function createRecharge\(\)[\s\S]*if \(!canSubmit\.value\) return/)
    expect(composable).toContain('PaymentRechargeApi.add')
    expect(composable).toContain('return_url: rechargeReturnURL()')
    expect(composable).toContain('syncReturnRecharge')
    expect(page).toContain(':can-create="canCreateRecharge"')
    expect(combined).not.toContain('config_code')
    expect(combined).not.toContain('amount_yuan')
    expect(combined).not.toContain('同步返回地址')
    expect(combined).not.toContain('<el-dialog')
    expect(combined).not.toMatch(loose)
  })

  it('treats the single Alipay channel as cashier state instead of a standalone choice card', () => {
    const page = read('src/views/Main/payment/recharge/index.vue')
    const checkout = read('src/views/Main/payment/recharge/components/RechargeCheckoutPanel.vue')

    expect(existsSync(resolve(process.cwd(), 'src/views/Main/payment/recharge/components/RechargePaymentMethodCard.vue'))).toBe(false)
    expect(page).not.toContain('RechargePaymentMethodCard')
    expect(page).toContain(':payment-method="paymentMethod"')
    expect(checkout).toContain('paymentMethod: RechargePaymentMethod')
    expect(checkout).toContain('recharge-checkout-panel__method')
    expect(checkout).toContain('props.paymentMethod.label')
    expect(checkout).toContain('props.paymentMethod.enabled')
    expect(checkout).toContain('canCreate: boolean')
    expect(checkout).toContain('paymentRecharge.checkout.noCreatePermission')
  })

  it('does not show paid-but-uncredited recharge as final success', () => {
    const recent = read('src/views/Main/payment/recharge/components/RechargeRecentRecords.vue')
    const records = read('src/views/Main/payment/recharge/components/RechargeRecordsTable.vue')

    for (const source of [recent, records]) {
      expect(source).toContain("if (status === 'credited') return 'success'")
      expect(source).toContain("if (status === 'paid') return 'warning'")
      expect(source).not.toContain("status === 'credited' || status === 'paid'")
    }
  })

  it('adds locale menu labels for recharge', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(zh).toContain("payment_recharge: '充值/记录'")
    expect(en).toContain("payment_recharge: 'Recharge'")
  })

  it('keeps payment recharge composable visible copy behind vue-i18n', () => {
    const composable = read('src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts')

    expect(composable).toContain("import { useI18n } from 'vue-i18n'")
    expect(composable).toContain('const { t } = useI18n()')
    expect(composable).not.toMatch(/[\u4e00-\u9fff]/)
  })

  it('keeps payment recharge page and component visible copy behind vue-i18n', () => {
    const files = [
      'src/views/Main/payment/recharge/index.vue',
      'src/views/Main/payment/recharge/components/RechargePackageGrid.vue',
      'src/views/Main/payment/recharge/components/RechargeCheckoutPanel.vue',
      'src/views/Main/payment/recharge/components/RechargeRecentRecords.vue',
      'src/views/Main/payment/recharge/components/RechargeRecordsTable.vue',
    ]
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    for (const file of files) {
      const source = read(file)
      expect(source).toContain("import { useI18n } from 'vue-i18n'")
      expect(source).not.toMatch(/[\u4e00-\u9fff]/)
    }
    expect(zh).toContain('checkout: {')
    expect(en).toContain('checkout: {')
  })

  it('keeps the cashier layout inside the outer page card without nested horizontal scrollbars', () => {
    const page = read('src/views/Main/payment/recharge/index.vue')

    expect(page).toContain('.layout-view.page-card:has(.payment-recharge-page)')
    expect(page).toMatch(/\.payment-recharge-page__tabs\s+:deep\(\.el-tabs__content\)[\s\S]*overflow:\s*hidden;/)
    expect(page).toMatch(/\.payment-recharge-page__cashier[\s\S]*height:\s*100%;[\s\S]*overflow-y:\s*auto;/)
    expect(page).not.toMatch(/\.payment-recharge-page__main,[\s\S]*\.payment-recharge-page__side[\s\S]*overflow-y:\s*auto;/)
  })

  it('uses a compact workbench and keeps recent records out of the checkout column', () => {
    const page = read('src/views/Main/payment/recharge/index.vue')
    const checkout = read('src/views/Main/payment/recharge/components/RechargeCheckoutPanel.vue')
    const packages = read('src/views/Main/payment/recharge/components/RechargePackageGrid.vue')
    const recent = read('src/views/Main/payment/recharge/components/RechargeRecentRecords.vue')

    expect(page).toContain('payment-recharge-page__workbench')
    expect(page).toContain('payment-recharge-page__recent')
    expect(page).toMatch(/<div class="payment-recharge-page__main">[\s\S]*<RechargePackageGrid[\s\S]*<\/div>\s*<div class="payment-recharge-page__side">[\s\S]*<RechargeCheckoutPanel[\s\S]*<\/div>\s*<div class="payment-recharge-page__recent">[\s\S]*<RechargeRecentRecords/)
    expect(page).toMatch(/\.payment-recharge-page__workbench[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(page).toContain('"main side"')
    expect(page).toContain('"recent side"')
    expect(page).toContain('"main"\n      "side"\n      "recent"')
    expect(checkout).toContain('flex: 0 0 auto;')
    expect(checkout).not.toContain('overflow: hidden;')
    expect(packages).toMatch(/min-height:\s*104px;/)
    expect(recent).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/)
  })

  it('auto syncs at most three visible paying recharges on reopen with permission guard', () => {
    const composable = read('src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts')
    const recent = read('src/views/Main/payment/recharge/components/RechargeRecentRecords.vue')

    expect(composable).toContain("import { useUserStore } from '@/store/user'")
    expect(composable).toContain('const userStore = useUserStore()')
    expect(composable).toContain('const autoSyncedRechargeIDs = shallowRef(new Set<number>())')
    expect(composable).toContain('async function autoSyncVisiblePayingRecharges()')
    expect(composable).toContain("userStore.can('payment_recharge_sync')")
    expect(composable).toContain("item.status === 'paying'")
    expect(composable).toContain('.slice(0, 3)')
    expect(composable).toContain('autoSyncedRechargeIDs.value.add(row.id)')
    expect(composable).toContain('await autoSyncVisiblePayingRecharges()')
    expect(composable).toContain('ElNotification.warning')
    expect(recent).toContain("userStore.can('payment_recharge_sync')")
  })
})
