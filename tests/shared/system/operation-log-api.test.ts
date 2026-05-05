import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('operation log api and page REST contract', () => {
  it('uses Go REST endpoints instead of legacy operation log routes', () => {
    const source = readFrontendSource('src/api/system/operationLog.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<OperationLogInitResponse>(`${BASE}/init`)')
    expect(source).toContain('request.get<OperationLogListResponse>(BASE, { params: normalizeOperationLogListParams(params) })')
    expect(source).toContain('request.delete<void>(`${BASE}/${ids[0]}`)')
    expect(source).toContain('request.delete<void, { ids: number[] }>(BASE, { data: { ids } })')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/OperationLog/')
  })

  it('keeps the system operation log page typed and delete-aware', () => {
    const pageSource = readFrontendSource('src/views/Main/system/operationLog/index.vue')
    const personalSource = readFrontendSource('src/views/Main/personal/components/OperationLog/index.vue')

    expect(pageSource).toContain("type OperationLogSearchForm = Omit<OperationLogListParams, 'current_page' | 'page_size'>")
    expect(pageSource).toContain('const searchForm = ref<OperationLogSearchForm>({')
    expect(pageSource).toContain("userStore.can('devTools_operationLog_del')")
    expect(pageSource).toContain("summarizePayload(row.request_data, 'request')")
    expect(pageSource).toContain("summarizePayload(row.response_data, 'response')")
    expect(pageSource).toContain('formatOperationLogPayload(detailRow.request_data, \'request\')')
    expect(pageSource).toContain('formatOperationLogPayload(detailRow.response_data, \'response\')')
    expect(pageSource).not.toContain('legacyRequest')
    expect(pageSource).not.toMatch(forbiddenLooseTypePattern)

    expect(personalSource).toContain('const logList = ref<OperationLogItem[]>([])')
    expect(personalSource).toContain('const response = await OperationLogApi.list({')
    expect(personalSource).not.toContain('any[]')
    expect(personalSource).not.toContain('data: any')
    expect(personalSource).not.toMatch(forbiddenLooseTypePattern)
  })
})
