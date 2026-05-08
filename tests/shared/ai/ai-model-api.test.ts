import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI model api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiModels routes', () => {
    const source = readFrontendSource('src/api/ai/models.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiModelInitResponse>(`${ADMIN_API_PREFIX}/ai-models/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiModelItem>>(`${ADMIN_API_PREFIX}/ai-models`')
    expect(source).toContain('request.post<AiModelCreateResponse, AiModelMutationBody>(`${ADMIN_API_PREFIX}/ai-models`')
    expect(source).toContain('request.put<void, AiModelMutationBody>(`${ADMIN_API_PREFIX}/ai-models/${id}`')
    expect(source).toContain('request.patch<void, AiModelStatusBody>(`${ADMIN_API_PREFIX}/ai-models/${id}/status`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-models/${id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiModels')
  })

  it('keeps AI model api types strict', () => {
    const source = readFrontendSource('src/api/ai/models.ts')

    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
