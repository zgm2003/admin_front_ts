import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('cron task API REST contract', () => {
  it('uses Go REST endpoints instead of legacy CronTask all-post routes', () => {
    const source = readFrontendSource('src/api/system/cronTask.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/CronTask/')
    expect(source).toContain('request.get<CronTaskInitResponse>(`${ADMIN_API_PREFIX}/cron-tasks/init`)')
    expect(source).toContain('request.get<PaginatedResponse<CronTaskItem>>(`${ADMIN_API_PREFIX}/cron-tasks`')
    expect(source).toContain('request.post<CronTaskItem, CronTaskForm>(`${ADMIN_API_PREFIX}/cron-tasks`, params)')
    expect(source).toContain('request.put<void, CronTaskForm>(`${ADMIN_API_PREFIX}/cron-tasks/${params.id}`, params)')
    expect(source).toContain('request.patch<void, CronTaskStatusBody>(`${ADMIN_API_PREFIX}/cron-tasks/${params.id}/status`')
    expect(source).toContain('request.get<PaginatedResponse<CronTaskLogItem>>(`${ADMIN_API_PREFIX}/cron-tasks/${params.task_id}/logs`')
  })

  it('does not introduce loose TS types in touched files', () => {
    for (const file of [
      'src/api/system/cronTask.ts',
      'src/views/Main/system/cronTask/index.vue',
      'src/views/Main/system/cronTask/composables/useCronTaskLogs.ts',
    ]) {
      expect(readFrontendSource(file)).not.toMatch(forbiddenLooseTypePattern)
    }
  })

  it('keeps cron log list on a list-only composable instead of a CRUD hook in the route view', () => {
    const viewSource = readFrontendSource('src/views/Main/system/cronTask/index.vue')
    const logsComposableSource = readFrontendSource('src/views/Main/system/cronTask/composables/useCronTaskLogs.ts')

    expect(viewSource.match(/useCrudTable\(/g)?.length ?? 0).toBe(1)
    expect(viewSource).toContain("import { useCronTaskLogs } from './composables/useCronTaskLogs'")
    expect(logsComposableSource).toContain("import { useTable } from '@/components/Table'")
    expect(logsComposableSource).not.toContain('useCrudTable')
  })
})
