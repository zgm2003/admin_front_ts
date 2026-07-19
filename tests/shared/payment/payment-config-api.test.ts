import { afterEach, describe, expect, it } from 'vitest'
import { PaymentConfigApi } from '@/api/payment/config'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('payment configuration API behavior', () => {
  it('executes the documented payment configuration operations', async () => {
    const harness = installApiClientHarness({
      dict: {
        certificate_type_arr: [],
        common_status_arr: [],
        enabled_method_arr: [],
        environment_arr: [],
        provider_arr: [],
      },
    })
    cleanups.push(harness.uninstall)
    await PaymentConfigApi.pageInit()
    harness.respondWith({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    await PaymentConfigApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({ id: 4 })
    const payload = {
      provider: 'alipay' as const,
      code: 'alipay-main',
      name: 'Alipay main',
      app_id: 'app-id',
      app_cert_path: '/certs/app.pem',
      platform_cert_path: '/certs/platform.pem',
      root_cert_path: '/certs/root.pem',
      notify_url: 'https://example.test/payment/callback',
      environment: 'sandbox' as const,
      enabled_methods: ['web'] as const,
      status: 1 as const,
    }
    await PaymentConfigApi.create(payload)
    harness.respondWith({})
    await PaymentConfigApi.update({ id: 4, ...payload })
    await PaymentConfigApi.changeStatus(4, 1)
    harness.respondWith({ checks: [], message: 'ok', ok: true })
    await PaymentConfigApi.test(4)
    harness.respondWith({})
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
    await expect(PaymentConfigApi.deleteOne(0)).rejects.toThrow(/positive/i)
    expect(harness.requests).toEqual([])
  })
})
