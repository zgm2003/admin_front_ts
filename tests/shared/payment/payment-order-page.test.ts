import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('payment order page retirement', () => {
  it('removes the visible payment order page and keeps recharge as the only user payment flow', () => {
    expect(existsSync(resolve(process.cwd(), 'src/views/Main/payment/orders/index.vue'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/views/Main/payment/orders'))).toBe(false)

    const rechargePage = read('src/views/Main/payment/recharge/index.vue')
    const rechargeComposable = read('src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts')
    const combined = `${rechargePage}
${rechargeComposable}`

    expect(combined).toContain("from '@/api/payment/recharges'")
    expect(combined).toContain('PaymentRechargeApi.add')
    expect(combined).toContain('PaymentRechargeApi.pay')
    expect(combined).not.toContain('PaymentOrderApi')
    expect(combined).not.toContain('PaymentRechargeApi.sync')
    expect(combined).not.toContain('PaymentRechargeApi.close')
    expect(combined).not.toContain('manualSync')
  })

  it('removes stale payment order locale keys', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(zh).not.toContain("payment_order: '支付订单'")
    expect(en).not.toContain("payment_order: 'Payment Orders'")
    expect(zh).not.toContain('paymentOrder:')
    expect(en).not.toContain('paymentOrder:')
  })
})
