import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment order api', () => {
  it('uses new payment order REST paths and no retired routes', () => {
    const source = read('src/api/payment/order.ts')
    expect(source).toContain('request.get<PaymentOrderInitResponse>(`${ADMIN_API_PREFIX}/payment/orders/page-init`)')
    expect(source).toContain('request.post<PaymentCreateOrderResponse, PaymentCreateOrderPayload>(`${ADMIN_API_PREFIX}/payment/orders`')
    expect(source).toContain('request.post<PaymentPayOrderResponse, PaymentPayOrderPayload>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/pay`')
    expect(source).toContain('request.get<PaymentResultResponse>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/result`)')
    expect(source).toContain('request.patch<void>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/close`)')
    expect(source).toContain('const byOrderNo = (orderNo: string) => {')
    expect(source).toContain('const value = orderNo.trim()')
    expect(source).toContain('if (!value) throw new Error(\'payment order_no is required\')')
    expect(source).toContain('return encodeURIComponent(value)')
    expect(source).not.toContain('/recharge-' + 'orders')
    expect(source).not.toContain('/pay-' + 'orders')
    expect(source).not.toContain('/wal' + 'let')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
