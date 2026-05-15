import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)
const oldPageKey = `payment_${'order'}_${'page'}`
const oldCreateKey = `payment_${'order'}_${'create'}`
const oldPrefix = `payment_${'orders'}_`

describe('payment order page', () => {
  it('keeps raw order page read/operation-only and removes manual create UX', () => {
    const page = read('src/views/Main/payment/orders/index.vue')
    const composable = read('src/views/Main/payment/orders/composables/usePaymentOrderPage.ts')
    const detail = read('src/views/Main/payment/orders/components/PaymentOrderDetailDialog.vue')
    const combined = `${page}\n${composable}\n${detail}`

    expect(page).toContain('class="payment-order-page"')
    expect(page).toContain("import { Search } from '@/components/Search'")
    expect(page).toContain("import { AppTable } from '@/components/Table'")
    expect(page).toContain("import { AppDialog } from '@/components/AppDialog'")
    expect(page).toContain(':height="detailDialogLayout.height"')
    expect(page).toContain(':top="detailDialogLayout.top"')
    expect(page).toContain("userStore.can('payment_order_pay')")
    expect(page).toContain("userStore.can('payment_order_sync')")
    expect(page).toContain("userStore.can('payment_order_close')")
    expect(page).not.toContain("userStore.can('payment_order_add')")
    expect(page).not.toContain('PaymentOrderFormDialog')
    expect(page).not.toContain('新增订单')
    expect(page).not.toContain('<el-dialog')
    expect(existsSync(resolve(process.cwd(), 'src/views/Main/payment/orders/components/PaymentOrderFormDialog.vue'))).toBe(false)

    expect(composable).toContain("from '@/api/payment/orders'")
    expect(composable).toContain('PaymentOrderApi.init()')
    expect(composable).toContain('PaymentOrderApi.detail(row.id)')
    expect(composable).toContain('PaymentOrderApi.pay(row.id)')
    expect(composable).toContain('PaymentOrderApi.sync(row.id)')
    expect(composable).toContain('PaymentOrderApi.close(row.id)')
    expect(composable).not.toContain('PaymentOrderApi.add(buildCreatePayload')
    expect(composable).not.toContain('amount_cents: yuanToCents(model.amount_yuan)')
    expect(composable).toContain("row.status === 'pending' || row.status === 'failed' || (row.status === 'paying' && row.pay_url !== '')")
    expect(composable).toContain("row.status === 'pending' || row.status === 'failed' || row.status === 'paying'")

    expect(detail).toContain('pay_url')
    expect(detail).toContain('alipay_trade_no')
    expect(detail).toContain('expired_at')
    expect(detail).toContain('paid_at')
    expect(detail).toContain('closed_at')
    expect(detail).toContain('failure_reason')

    expect(combined).not.toMatch(loose)
    expect(combined).not.toContain(oldPageKey)
    expect(combined).not.toContain(oldCreateKey)
    expect(combined).not.toContain(oldPrefix)
    expect(combined).not.toContain('amount_yuan')
    expect(combined).not.toContain('同步返回地址')
    expect(combined).not.toContain(`business_`)
    expect(combined).not.toContain(`refund_`)
    expect(combined).not.toContain(`extra_`)
  })

  it('keeps locale menu labels for payment orders', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(zh).toContain("payment_order: '支付订单'")
    expect(en).toContain("payment_order: 'Payment Orders'")
  })
})
