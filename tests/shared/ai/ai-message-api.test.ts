import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI message api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiMessages routes', () => {
    const source = readFrontendSource('src/api/ai/messages.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PaginatedResponse<AiMessageItem>>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, \'conversation id\')}/messages`')
    expect(source).toContain('request.patch<{ deleted_count: number }, { content: string }>(`${ADMIN_API_PREFIX}/ai-messages/${positiveID(params.id, \'message id\')}/content`')
    expect(source).toContain('request.patch<void, { feedback: number | null }>(`${ADMIN_API_PREFIX}/ai-messages/${positiveID(params.id, \'message id\')}/feedback`')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-messages/${ids[0]}`)')
    expect(source).toContain('request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/ai-messages`, { data: { ids } })')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiMessages')
  })

  it('keeps AI message api types strict', () => {
    const source = readFrontendSource('src/api/ai/messages.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
