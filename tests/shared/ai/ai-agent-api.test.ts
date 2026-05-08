import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI agent api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiAgents routes', () => {
    const source = readFrontendSource('src/api/ai/agents.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiAgentInitResponse>(`${ADMIN_API_PREFIX}/ai-agents/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiAgentItem>>(`${ADMIN_API_PREFIX}/ai-agents`')
    expect(source).toContain('request.post<{ id: number }, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents`')
    expect(source).toContain('request.put<void, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents/${id}`')
    expect(source).toContain('request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id)}/status`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-agents/${id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiAgents')
  })

  it('keeps AI agent api types strict', () => {
    const source = readFrontendSource('src/api/ai/agents.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
