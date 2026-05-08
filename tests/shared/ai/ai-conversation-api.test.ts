import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI conversation api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiConversations routes', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PaginatedResponse<AiConversationItem>>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.get<AiConversationDetailResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`)')
    expect(source).toContain('request.post<{ id: number }, AiConversationCreateBody>(`${ADMIN_API_PREFIX}/ai-conversations`')
    expect(source).toContain('request.put<void, AiConversationTitleBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`')
    expect(source).toContain('request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(item)}/status`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-conversations/${id}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiConversations')
  })

  it('keeps AI conversation api types strict', () => {
    const source = readFrontendSource('src/api/ai/conversations.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
