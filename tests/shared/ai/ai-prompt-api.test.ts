import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI prompt api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiPrompts routes', () => {
    const source = readFrontendSource('src/api/ai/prompts.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PaginatedResponse<AiPromptItem>>(`${ADMIN_API_PREFIX}/ai-prompts`')
    expect(source).toContain('request.get<AiPromptDetailResponse>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`)')
    expect(source).toContain('request.post<AiPromptCreateResponse, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts`')
    expect(source).toContain('request.put<void, AiPromptMutationBody>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-prompts/${id}`)')
    expect(source).toContain('request.patch<{ is_favorite: number }>(`${ADMIN_API_PREFIX}/ai-prompts/${id}/favorite`)')
    expect(source).toContain('request.post<{ content: string }>(`${ADMIN_API_PREFIX}/ai-prompts/${id}/use`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiPrompts')
  })

  it('keeps AI prompt api types strict', () => {
    const source = readFrontendSource('src/api/ai/prompts.ts')

    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
