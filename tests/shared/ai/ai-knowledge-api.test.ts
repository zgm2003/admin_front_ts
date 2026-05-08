import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI knowledge api REST contract', () => {
  it('uses Go REST endpoints instead of legacy AiKnowledgeBases routes', () => {
    const source = readFrontendSource('src/api/ai/knowledge.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiKnowledgeInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiKnowledgeBaseItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`')
    expect(source).toContain('request.post<{ id: number }, Omit<AiKnowledgeBaseMutationParams')
    expect(source).toContain('request.get<PaginatedResponse<AiKnowledgeDocumentItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents`')
    expect(source).toContain('request.post<{ chunk_count: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/documents/${positiveID(params.id, \'document id\')}/reindex`)')
    expect(source).toContain('request.post<AiKnowledgeRetrievalResponse, { query: string; top_k?: number }>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${knowledgeBaseID}/retrieval-test`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('/api/admin/AiKnowledgeBases')
  })

  it('keeps AI knowledge api types strict', () => {
    const source = readFrontendSource('src/api/ai/knowledge.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
