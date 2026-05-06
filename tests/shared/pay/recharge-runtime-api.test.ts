import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('recharge runtime api REST contract', () => {
  it('creates recharge orders and pay attempts through Go admin REST endpoints', () => {
    const source = readFrontendSource('src/api/pay/order.ts')

    expect(source).toContain('request.post<RechargeOrderCreateResponse, RechargeCreateParams>(`${ADMIN_API_PREFIX}/recharge-orders`, params)')
    expect(source).toContain('request.post<CreatePayResponse, CreatePayPayload>(`${ADMIN_API_PREFIX}/recharge-orders/${params.order_no}/pay-attempts`')
    expect(source).not.toContain("legacyRequest.post<RechargeOrderCreateResponse>('/api/admin/pay/recharge'")
    expect(source).not.toContain("legacyRequest.post<CreatePayResponse>('/api/admin/pay/createPay'")
  })

  it('keeps unmigrated wallet runtime endpoints on legacy client for this slice', () => {
    const source = readFrontendSource('src/api/pay/order.ts')

    for (const path of [
      '/api/admin/pay/cancelOrder',
      '/api/admin/pay/myOrders',
      '/api/admin/pay/queryResult',
      '/api/admin/pay/orderDetail',
      '/api/admin/pay/walletInfo',
      '/api/admin/pay/walletBills',
    ]) {
      expect(source).toContain(path)
    }
  })

  it('keeps touched recharge runtime files strict without loose TS types', () => {
    for (const file of [
      'src/api/pay/order.ts',
      'src/views/Main/wallet/useRechargePayment.ts',
      'tests/shared/pay/recharge-runtime-api.test.ts',
    ]) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})
