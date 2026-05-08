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
    expect(source).toContain('request.post<AiEngineConnectionCreateResponse, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections`')
    expect(source).toContain('request.put<void, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`')
    expect(source).toContain('request.post<AiEngineConnectionTestResult>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, \'AI engine connection id\')}/test`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('api_key' + '_enc')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict external JSON boundaries', () => {
    const source = readFrontendSource('src/api/ai/engineConnections.ts')
    expect(source).toContain('export type JsonObject = Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
