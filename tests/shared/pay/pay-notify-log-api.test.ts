import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('pay notify log api REST contract', () => {
  it('uses Go REST endpoints instead of legacy all-post pay notify log routes', () => {
    const source = readFrontendSource('src/api/pay/notify.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PayNotifyLogInitResponse>(`${ADMIN_API_PREFIX}/pay-notify-logs/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<PayNotifyLogItem>>(`${ADMIN_API_PREFIX}/pay-notify-logs`')
    expect(source).toContain('request.get<PayNotifyLogDetailResponse>(`${ADMIN_API_PREFIX}/pay-notify-logs/${params.id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/PayNotifyLog/')
  })

  it('keeps touched pay notify files strict and read-only', () => {
    const apiSource = readFrontendSource('src/api/pay/notify.ts')
    const viewSource = readFrontendSource('src/views/Main/pay/notify/index.vue')
    const composableSource = readFrontendSource('src/views/Main/pay/notify/composables/usePayNotifyLogPage.ts')

    expect(apiSource).not.toMatch(forbiddenLooseTypePattern)
    expect(viewSource).not.toMatch(forbiddenLooseTypePattern)
    expect(composableSource).not.toMatch(forbiddenLooseTypePattern)
    expect(apiSource).not.toContain('add:')
    expect(apiSource).not.toContain('edit:')
    expect(apiSource).not.toContain('del:')
    expect(viewSource).not.toContain('useCrudTable')
    expect(composableSource).not.toContain('useCrudTable')
    expect(composableSource).toContain("import { useTable } from '@/components/Table'")
  })
})
