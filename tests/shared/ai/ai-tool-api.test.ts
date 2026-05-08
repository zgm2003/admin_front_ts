import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI tool api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiTools routes', () => {
    const source = readFrontendSource('src/api/ai/tools.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiToolInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiToolItem>>(`${ADMIN_API_PREFIX}/ai-tools`')
    expect(source).toContain('request.post<AiToolCreateResponse, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools`')
    expect(source).toContain('request.put<void, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}`')
    expect(source).toContain('request.patch<void, AiToolStatusBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}/status`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-tools/${id}`)')
    expect(source).toContain('request.get<AiAgentToolsResponse>(`${ADMIN_API_PREFIX}/ai-tools/agent-options`')
    expect(source).toContain('request.put<void, AiAgentToolBindingBody>(`${ADMIN_API_PREFIX}/ai-tools/agent-bindings/${agentID}`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiTools')
    expect(source).not.toContain('cine_generate_keyframe')
  })

  it('keeps AI tool api types strict', () => {
    const source = readFrontendSource('src/api/ai/tools.ts')

    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
