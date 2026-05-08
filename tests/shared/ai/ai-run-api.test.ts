import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI run api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiRuns routes', () => {
    const source = readFrontendSource('src/api/ai/runs.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiRunInitResponse>(`${ADMIN_API_PREFIX}/ai-runs/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiRunItem>>(`${ADMIN_API_PREFIX}/ai-runs`')
    expect(source).toContain('request.get<AiRunDetailResponse>(`${ADMIN_API_PREFIX}/ai-runs/${positiveID(params.id)}`)')
    expect(source).toContain('request.get<AiRunStatsSummaryResponse>(`${ADMIN_API_PREFIX}/ai-runs/stats`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByDateItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-date`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByAgentItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-agent`')
    expect(source).toContain('request.get<PaginatedResponse<AiRunStatsByUserItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-user`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiRuns')
  })

  it('keeps AI run api types strict', () => {
    const source = readFrontendSource('src/api/ai/runs.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
