import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('pay order api REST contract', () => {
  it('uses Go REST endpoints for admin order management instead of legacy all-post PayOrder routes', () => {
    const source = readFrontendSource('src/api/pay/order.ts')

    expect(source).toContain("import request, { legacyRequest } from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<OrderInitResponse>(`${ADMIN_API_PREFIX}/pay-orders/page-init`)')
    expect(source).toContain('request.get<OrderStatusCountResponse>(`${ADMIN_API_PREFIX}/pay-orders/status-count`')
    expect(source).toContain('request.get<PaginatedResponse<OrderListItem>>(`${ADMIN_API_PREFIX}/pay-orders`')
    expect(source).toContain('request.get<OrderDetailResponse>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}`)')
    expect(source).toContain('request.patch<void, OrderCloseBody>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}/close`')
    expect(source).toContain('request.patch<void, OrderRemarkBody>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}/remark`')
    const legacyPayOrderPrefix = '/api/admin/' + 'PayOrder/'
    expect(source).not.toContain(legacyPayOrderPrefix)
  })

  it('keeps user-side wallet runtime on legacy endpoints until wallet slice migrates', () => {
    const source = readFrontendSource('src/api/pay/order.ts')

    for (const path of [
      '/api/admin/pay/recharge',
      '/api/admin/pay/createPay',
      '/api/admin/pay/cancelOrder',
      '/api/admin/pay/myOrders',
      '/api/admin/pay/queryResult',
      '/api/admin/pay/orderDetail',
      '/api/admin/pay/walletInfo',
      '/api/admin/pay/walletBills',
    ]) {
      expect(source).toContain(`legacyRequest.post`)
      expect(source).toContain(path)
    }
  })

  it('keeps touched pay order files strict without loose TS types', () => {
    const files = [
      'src/api/pay/order.ts',
      'src/views/Main/pay/order/index.vue',
      'src/views/Main/pay/order/composables/usePayOrderPage.ts',
      'tests/shared/pay-order/usePayOrderPage.test.ts',
      'tests/shared/pay-order/pay-order-api.test.ts',
    ]

    for (const file of files) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})
