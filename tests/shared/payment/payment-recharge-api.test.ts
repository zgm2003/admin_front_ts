import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment recharge api', () => {
  it('uses the cashier recharge contract without raw order fields', () => {
    const source = read('src/api/payment/recharges.ts')

    expect(source).toContain('/payment/recharges/page-init')
    expect(source).toContain('/payment/recharges')
    expect(source).toContain('/pay')
    expect(source).toContain('package_code: string')
    expect(source).toContain('pay_method: PaymentRechargePayMethod')
    expect(source).toContain('return_url: string')
    expect(source).not.toContain('config_code')
    expect(source).not.toContain('amount_yuan')
    expect(source).not.toContain('subject')
    expect(source).not.toContain('refund_')
    expect(source).not.toContain('subscription_')
    expect(source).not.toMatch(loose)
  })
})
