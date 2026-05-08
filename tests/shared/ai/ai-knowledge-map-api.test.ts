import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI knowledge map api contract', () => {
  it('uses Dify sidecar map/document endpoints instead of old knowledge bases as main path', () => {
    const source = readFrontendSource('src/api/ai/knowledgeMaps.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiKnowledgeMapInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiKnowledgeMapItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-maps`')
    expect(source).toContain('request.post<AiKnowledgeMapCreateResponse, AiKnowledgeMapMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-maps`')
    expect(source).toContain('request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.id, \'AI knowledge map id\')}/sync`)')
    expect(source).toContain('request.get<AiKnowledgeDocumentListResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-maps/${positiveID(params.knowledge_map_id, \'AI knowledge map id\')}/documents`)')
    expect(source).toContain('request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id, \'AI knowledge document id\')}/refresh-status`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict JSON map types', () => {
    const source = readFrontendSource('src/api/ai/knowledgeMaps.ts')
    expect(source).toContain('export type JsonObject = Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('requires the route view to use the new map api as the main path', () => {
    const source = readFrontendSource('src/views/Main/ai/knowledge/index.vue')
    expect(source).toContain('AiKnowledgeMapApi')
    expect(source).not.toContain('AiKnowledgeApi')
  })

})
