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

    expect(apiSource).not.toMatch(forbiddenLooseTypePattern)
    expect(viewSource).not.toMatch(forbiddenLooseTypePattern)
    expect(apiSource).not.toContain('add:')
    expect(apiSource).not.toContain('edit:')
    expect(apiSource).not.toContain('del:')
    expect(viewSource).not.toContain('useCrudTable')
    expect(viewSource).toContain("import { AppTable, useTable } from '@/components/Table'")
  })
})
