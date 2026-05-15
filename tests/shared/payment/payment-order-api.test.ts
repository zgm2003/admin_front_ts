import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const loose = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('payment order api', () => {
  it('uses canonical orders REST paths and strict payloads', () => {
    const source = read('src/api/payment/orders.ts')
    expect(source).toContain('request.get<PaymentOrderInitResponse>(`${ADMIN_API_PREFIX}/payment/orders/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<PaymentOrderListItem>>(`${ADMIN_API_PREFIX}/payment/orders`')
    expect(source).toContain('request.get<PaymentOrderDetail>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}`)')
    expect(source).toContain('request.post<PaymentOrderPayResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/pay`)')
    expect(source).toContain('request.post<PaymentOrderStatusResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/sync`)')
    expect(source).toContain('request.patch<PaymentOrderStatusResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/close`)')
    expect(source).not.toContain('PaymentOrderCreatePayload')
    expect(source).not.toContain('PaymentOrderCreateResponse')
    expect(source).not.toContain('PaymentOrderApi.add')
    expect(source).not.toContain('request.post<PaymentOrderCreate')
    expect(source).not.toContain(`/payment/${'order'}\``)
    expect(source).not.toContain('/payment/channels')
    expect(source).not.toContain('/payment/events')
    expect(source).toContain("export type PaymentOrderProvider = 'alipay'")
    expect(source).toContain("export type PaymentOrderPayMethod = 'web' | 'h5'")
    expect(source).toContain("export type PaymentOrderStatus = 'pending' | 'paying' | 'paid' | 'closed' | 'failed'")
    expect(source).toContain('amount_cents: number')
    expect(source).toContain('pay_url: string')
    expect(source).toContain('return_url: string')
    expect(source).not.toContain('business_type')
    expect(source).not.toContain('refund_status')
    expect(source).not.toContain('extra_json')
    expect(source).not.toMatch(loose)
  })
})
