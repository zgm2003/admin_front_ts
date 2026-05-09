import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI engine connection api contract', () => {
  it('uses typed Go REST endpoints and never exposes ciphertext or browser auth construction', () => {
    const source = readFrontendSource('src/api/ai/engineConnections.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiEngineConnectionInitResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiEngineConnectionItem>>(`${ADMIN_API_PREFIX}/ai-engine-connections`')
    expect(source).toContain('request.post<AiModelOptionsResponse, AiModelOptionsBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/model-options`')
    expect(source).toContain('request.post<AiEngineConnectionCreateResponse, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections`')
    expect(source).toContain('request.put<void, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`')
    expect(source).toContain('request.post<AiEngineConnectionTestResult>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, \'AI provider id\')}/test`)')
    expect(source).toContain('request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, \'AI provider id\')}/sync-models`)')
    expect(source).toContain('request.get<AiProviderModelsResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, \'AI provider id\')}/models`)')
    expect(source).toContain('request.put<void, AiProviderModelsUpdateBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}/models`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('api_key' + '_enc')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict OpenAI-only driver and provider model contract', () => {
    const source = readFrontendSource('src/api/ai/engineConnections.ts')
    expect(source).toContain("export type AiProviderDriver = 'openai'")
    expect(source).toContain("export type AiEngineHealthStatus = 'unknown' | 'ok' | 'failed'")
    expect(source).toContain("export type AiModelSyncStatus = 'unknown' | 'ok' | 'failed'")
    expect(source).toContain('model_ids: string[]')
    expect(source).toContain('default_model_id: string')
    expect(source).not.toContain("'dify'")
    expect(source).not.toContain("'eino'")
    expect(source).not.toContain("'direct'")
    expect(source).not.toContain("'ragflow'")
    expect(source).not.toContain("'healthy'")
    expect(source).not.toContain("'unhealthy'")
  })

  it('keeps strict external JSON boundaries', () => {
    const source = readFrontendSource('src/api/ai/engineConnections.ts')
    expect(source).toContain('export type JsonObject = Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
