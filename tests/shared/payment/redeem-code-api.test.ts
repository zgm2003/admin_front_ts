import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PaymentRedeemCodeApi } from '@/api/payment/redeem-codes'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('payment redeem code API behavior', () => {
  it('executes the documented management operations with contract-shaped inputs', async () => {
    const harness = installApiClientHarness({ states: [] })
    cleanups.push(harness.uninstall)

    await PaymentRedeemCodeApi.pageInit()
    harness.respondWith({
      list: [],
      page: { current_page: 2, page_size: 30, total: 0, total_page: 0 },
    })
    await PaymentRedeemCodeApi.list({
      current_page: 2,
      page_size: 30,
      batch_no: 'BATCH-20260725',
      state: 'unused',
      used_by: 17,
    })
    harness.respondWith({ item: null })
    await PaymentRedeemCodeApi.lookup({ code: 'FULL-SECRET-CODE' })
    harness.respondWith({
      batch: {
        amount: '10.00',
        batch_no: 'BATCH-20260725',
        created_at: '2026-07-25T00:00:00Z',
        created_by: 1,
        expires_at: '',
        id: 7,
        note: 'campaign',
        quantity: 2,
        replayed: false,
        request_id: 'request-7',
      },
      codes: [],
    })
    await PaymentRedeemCodeApi.generateBatch({
      amount: '10.00',
      quantity: 2,
      note: 'campaign',
      request_id: 'request-7',
    })
    harness.respondWith({ content: 'code\n', filename: 'codes.csv', row_count: 1 })
    await PaymentRedeemCodeApi.export({ batch_no: 'BATCH-20260725', state: 'unused' })
    harness.respondWith({ voided: 2 })
    await PaymentRedeemCodeApi.void({ ids: [11, 12] })

    expect(harness.requests.map(({ method, path, query, body }) => ({ method, path, query, body }))).toEqual([
      { method: 'GET', path: '/api/admin/v1/payment/redeem-codes/page-init', query: undefined, body: undefined },
      {
        method: 'GET',
        path: '/api/admin/v1/payment/redeem-codes',
        query: {
          current_page: 2,
          page_size: 30,
          batch_no: 'BATCH-20260725',
          state: 'unused',
          used_by: 17,
        },
        body: undefined,
      },
      {
        method: 'POST',
        path: '/api/admin/v1/payment/redeem-code-lookups',
        query: undefined,
        body: { code: 'FULL-SECRET-CODE' },
      },
      {
        method: 'POST',
        path: '/api/admin/v1/payment/redeem-code-batches',
        query: undefined,
        body: { amount: '10.00', quantity: 2, note: 'campaign', request_id: 'request-7' },
      },
      {
        method: 'POST',
        path: '/api/admin/v1/payment/redeem-code-exports',
        query: undefined,
        body: { batch_no: 'BATCH-20260725', state: 'unused' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/v1/payment/redeem-codes',
        query: undefined,
        body: { ids: [11, 12] },
      },
    ])
  })

  it('binds adapters to generated operation IDs without handwritten URLs', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/payment/redeem-codes.ts'), 'utf8')
    const operationIds = [
      'get_api_admin_v1_payment_redeem_codes_page_init',
      'get_api_admin_v1_payment_redeem_codes',
      'post_api_admin_v1_payment_redeem_code_lookups',
      'post_api_admin_v1_payment_redeem_code_batches',
      'post_api_admin_v1_payment_redeem_code_exports',
      'patch_api_admin_v1_payment_redeem_codes',
    ]

    for (const operationId of operationIds) {
      expect(source).toContain(`adminOperations.${operationId}`)
    }
    expect(source).not.toContain('/api/admin/v1/')
  })
})
