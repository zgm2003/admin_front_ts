import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI provider api contract', () => {
  it('uses typed Go REST endpoints and never exposes ciphertext or browser auth construction', () => {
    const source = readFrontendSource('src/api/ai/providers.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiProviderInitResponse>(`${ADMIN_API_PREFIX}/ai-providers/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiProviderItem>>(`${ADMIN_API_PREFIX}/ai-providers`')
    expect(source).toContain('request.post<AiModelOptionsResponse, AiModelOptionsBody>(`${ADMIN_API_PREFIX}/ai-providers/model-options`')
    expect(source).toContain('request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, \'AI provider id\')}/model-options`)')
    expect(source).toContain('request.post<AiProviderCreateResponse, AiProviderMutationBody>(`${ADMIN_API_PREFIX}/ai-providers`')
    expect(source).toContain('request.put<void, AiProviderMutationBody>(`${ADMIN_API_PREFIX}/ai-providers/${id}`')
    expect(source).toContain('request.post<AiProviderTestResult>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, \'AI provider id\')}/test`)')
    expect(source).toContain('request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, \'AI provider id\')}/sync-models`)')
    expect(source).toContain('request.get<AiProviderModelsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, \'AI provider id\')}/models`)')
    expect(source).toContain('request.put<void, AiProviderModelsUpdateBody>(`${ADMIN_API_PREFIX}/ai-providers/${id}/models`')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('api_key' + '_enc')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict OpenAI-only driver and provider model contract', () => {
    const source = readFrontendSource('src/api/ai/providers.ts')
    expect(source).toContain("export type AiProviderDriver = 'openai'")
    expect(source).toContain("export type AiProviderHealthStatus = 'unknown' | 'ok' | 'failed'")
    expect(source).toContain("export type AiModelSyncStatus = 'unknown' | 'ok' | 'failed'")
    expect(source).toContain('model_ids: string[]')
    expect(source).not.toContain('default_model_id')
    expect(source).not.toContain('is_default')
    expect(source).not.toContain('source: string')
    expect(source).not.toContain('raw?: JsonObject')
    expect(source).not.toContain('config_json')
    const providerModelItem = source.slice(source.indexOf('export interface AiProviderModelItem'), source.indexOf('export interface AiModelOptionItem'))
    expect(providerModelItem).not.toContain('source')
    expect(providerModelItem).not.toContain('raw')
    expect(source).not.toContain("'dify'")
    expect(source).not.toContain("'eino'")
    expect(source).not.toContain("'direct'")
    expect(source).not.toContain("'ragflow'")
    expect(source).not.toContain("'healthy'")
    expect(source).not.toContain("'unhealthy'")
  })

  it('keeps strict external JSON boundaries', () => {
    const source = readFrontendSource('src/api/ai/providers.ts')
    expect(source).not.toContain('JsonObject')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('does not keep old supplier connection naming', () => {
    const source = readFrontendSource('src/api/ai/providers.ts')
    expect(source).not.toContain('Ai' + 'Engine' + 'Connection')
    expect(source).not.toContain('engine' + 'Connections')
    expect(source).not.toContain('ai-engine' + '-connections')
  })
})




