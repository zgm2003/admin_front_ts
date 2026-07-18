import { afterEach, describe, expect, it } from 'vitest'
import { PaymentConfigApi } from '@/api/payment/config'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('payment configuration API behavior', () => {
  it('executes the documented payment configuration operations', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)
    await PaymentConfigApi.pageInit()
    await PaymentConfigApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({ id: 4 })
    await PaymentConfigApi.create({ provider: 'alipay' } as never)
    harness.respondWith({})
    await PaymentConfigApi.update({ id: 4, provider: 'alipay' } as never)
    await PaymentConfigApi.changeStatus(4, 1)
    await PaymentConfigApi.test(4)
    await PaymentConfigApi.deleteOne(4)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/payment/configs/page-init'],
      ['GET', '/api/admin/v1/payment/configs'],
      ['POST', '/api/admin/v1/payment/configs'],
      ['PUT', '/api/admin/v1/payment/configs/4'],
      ['PATCH', '/api/admin/v1/payment/configs/4/status'],
      ['POST', '/api/admin/v1/payment/configs/4/test'],
      ['DELETE', '/api/admin/v1/payment/configs/4'],
    ])
  })

  it('rejects invalid resource identities without an HTTP request', async () => {
    const harness = installApiClientHarness()
    cleanups.push(harness.uninstall)
    expect(() => PaymentConfigApi.deleteOne(0)).toThrow(/positive/i)
    expect(harness.requests).toEqual([])
  })
})
