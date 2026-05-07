import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('pay reconcile api REST contract', () => {
  it('uses Go REST endpoints instead of legacy all-post pay reconcile routes', () => {
    const source = readFrontendSource('src/api/pay/reconcile.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PayReconcileInitResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<PayReconcileTaskItem>>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks`')
    expect(source).toContain('request.get<PayReconcileDetailResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}`)')
    expect(source).toContain('request.patch<void>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}/retry`)')
    expect(source).toContain('request.get<PayReconcileDownloadResponse>(`${ADMIN_API_PREFIX}/pay-reconcile-tasks/${params.id}/files/${params.type}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/PayReconcile/')
  })

  it('keeps touched pay reconcile api types strict without loose TS types', () => {
    const source = readFrontendSource('src/api/pay/reconcile.ts')

    expect(source).not.toMatch(forbiddenLooseTypePattern)
    expect(source).not.toContain('extends Record<string, unknown>')
    expect(source).not.toContain('params?: Record<string, unknown>')
  })
})
