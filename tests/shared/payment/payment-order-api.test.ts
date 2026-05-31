import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('payment order api', () => {
  it('retires the product-facing payment order API surface', () => {
    expect(existsSync(resolve(process.cwd(), 'src/api/payment/orders.ts'))).toBe(false)

    const paymentConfig = read('src/api/payment/config.ts')
    const paymentRecharge = read('src/api/payment/recharges.ts')
    const combined = `${paymentConfig}
${paymentRecharge}`

    expect(combined).not.toContain('/payment/orders')
    expect(combined).not.toContain('PaymentOrderApi')
    expect(combined).not.toContain('PaymentOrderCreatePayload')
    expect(combined).not.toContain('/payment/channels')
    expect(combined).not.toContain('/payment/events')
  })
})
