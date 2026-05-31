import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('export task api REST contract', () => {
  it('uses Go REST endpoints instead of legacy export task routes', () => {
    const source = readFrontendSource('src/api/system/exportTask.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('kind?: string')
    expect(source).toContain('kind: string')
    expect(source).toContain('kind_text: string')
    expect(source).toContain('request.get<ExportTaskStatusItem[]>(`${ADMIN_API_PREFIX}/export-tasks/status-count`, { params })')
    expect(source).toContain('request.get<PaginatedResponse<ExportTaskItem>>(`${ADMIN_API_PREFIX}/export-tasks`, { params })')
    expect(source).toContain('deleteOne: (params: { id: Id }) => {')
    expect(source).toContain('deleteBatch: (params: { ids: Id[] }) => {')
    expect(source).toContain('request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/export-tasks`, { data: { ids: normalizedIDs } })')
    expect(source).toContain('return ExportTaskApi.deleteOne({ id: firstID })')
    expect(source).toContain('return ExportTaskApi.deleteBatch({ ids })')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/ExportTask/statusCount')
    expect(source).not.toContain('/api/admin/ExportTask/list')
    expect(source).not.toContain('/api/admin/ExportTask/del')
  })

  it('refreshes both list and status-count from the toolbar refresh button', () => {
    const source = readFrontendSource('src/views/Main/system/exportTask/index.vue')

    expect(source).toContain('const handleRefresh = async () => {')
    expect(source).toContain('await getList()')
    expect(source).toContain('await refreshStatusCount()')
    expect(source).toContain('@refresh="handleRefresh"')
    expect(source).not.toContain('@refresh="refresh"')
  })
})
