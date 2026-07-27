import { afterEach, describe, expect, it } from 'vitest'
import { PaymentRechargeApi } from '@/api/payment/recharges'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('payment recharge API', () => {
  it('keeps cashier initialization separate from the paginated records API', async () => {
    const pageInit = {
      wallet: {
        available_balance: '12.5',
        balance: '15',
        held_amount: '2.5',
        total_consume: '3',
        total_recharge: '18',
      },
      packages: [],
      payment_method: { provider: 'alipay', label: 'Alipay', enabled: true },
      dict: { status_arr: [] },
    }
    const harness = installApiClientHarness(pageInit)
    cleanups.push(harness.uninstall)

    const initialized = await PaymentRechargeApi.pageInit()
    expect(initialized).toEqual(pageInit)
    expect(initialized).not.toHaveProperty('recent')

    harness.respondWith({
      list: [],
      page: { current_page: 2, page_size: 10, total: 0, total_page: 0 },
    })
    await PaymentRechargeApi.list({
      current_page: 2,
      page_size: 10,
      keyword: 'RECHARGE-9',
      status: 'pending',
      date_start: '2026-07-01',
      date_end: '2026-07-27',
    })

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/payment/recharges/page-init'],
      ['GET', '/api/admin/v1/payment/recharges'],
    ])
    expect(harness.requests[1]?.query).toEqual({
      current_page: 2,
      page_size: 10,
      keyword: 'RECHARGE-9',
      status: 'pending',
      date_start: '2026-07-01',
      date_end: '2026-07-27',
    })
  })
})
