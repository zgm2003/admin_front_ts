import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('pay transaction api REST contract', () => {
  it('uses Go REST endpoints instead of legacy all-post pay transaction routes', () => {
    const source = readFrontendSource('src/api/pay/transaction.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PayTransactionInitResponse>(`${ADMIN_API_PREFIX}/pay-transactions/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<PayTransactionItem>>(`${ADMIN_API_PREFIX}/pay-transactions`')
    expect(source).toContain('request.get<PayTransactionDetailResponse>(`${ADMIN_API_PREFIX}/pay-transactions/${params.id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/PayTransaction/')
  })

  it('keeps touched pay transaction files strict and read-only', () => {
    const apiSource = readFrontendSource('src/api/pay/transaction.ts')
    const viewSource = readFrontendSource('src/views/Main/pay/transaction/index.vue')
    const composableSource = readFrontendSource('src/views/Main/pay/transaction/composables/usePayTransactionPage.ts')

    expect(apiSource).not.toMatch(forbiddenLooseTypePattern)
    expect(viewSource).not.toMatch(forbiddenLooseTypePattern)
    expect(composableSource).not.toMatch(forbiddenLooseTypePattern)
    expect(apiSource).not.toContain('add:')
    expect(apiSource).not.toContain('edit:')
    expect(apiSource).not.toContain('del:')
    expect(viewSource).not.toContain('useCrudTable')
    expect(composableSource).not.toContain('useCrudTable')
    expect(composableSource).toContain("import { useTable } from '@/components/Table'")
    expect(viewSource).toContain("import { usePayTransactionPage } from './composables/usePayTransactionPage'")
  })

  it('keeps date-range UI state out of the API contract and sends Go start/end query fields', async () => {
    const apiSource = readFrontendSource('src/api/pay/transaction.ts')
    const viewSource = readFrontendSource('src/views/Main/pay/transaction/index.vue')
    const composableSource = readFrontendSource('src/views/Main/pay/transaction/composables/usePayTransactionPage.ts')

    expect(apiSource).not.toMatch(/\n\s+date\?:/)
    expect(viewSource).toContain("import { usePayTransactionPage } from './composables/usePayTransactionPage'")
    expect(composableSource).toContain("type: 'date-range'")

    const { toPayTransactionListQuery } = await import('../../../src/views/Main/pay/transaction/helpers')

    expect(toPayTransactionListQuery({
      current_page: 2,
      page_size: 20,
      order_no: ' ORD-1 ',
      transaction_no: ' TXN-1 ',
      user_id: 7,
      channel: 2,
      status: 3,
      date: ['2026-05-01', '2026-05-07'],
    })).toEqual({
      current_page: 2,
      page_size: 20,
      order_no: 'ORD-1',
      transaction_no: 'TXN-1',
      user_id: 7,
      channel: 2,
      status: 3,
      start_date: '2026-05-01',
      end_date: '2026-05-07',
    })
  })
})
