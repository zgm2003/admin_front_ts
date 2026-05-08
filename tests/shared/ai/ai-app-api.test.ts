import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI app api contract', () => {
  it('uses ai-apps and ai-app-bindings Go REST endpoints', () => {
    const source = readFrontendSource('src/api/ai/apps.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiAppInitResponse>(`${ADMIN_API_PREFIX}/ai-apps/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiAppItem>>(`${ADMIN_API_PREFIX}/ai-apps`')
    expect(source).toContain('request.get<AiAppOptionsResponse>(`${ADMIN_API_PREFIX}/ai-apps/options`)')
    expect(source).toContain('request.post<AiAppCreateResponse, AiAppMutationBody>(`${ADMIN_API_PREFIX}/ai-apps`')
    expect(source).toContain('request.post<AiAppTestResult>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.id, \'AI app id\')}/test`)')
    expect(source).toContain('request.get<AiAppBindingsResponse>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.app_id, \'AI app id\')}/bindings`)')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/ai-app-bindings/${positiveID(id, \'AI app binding id\')}`)')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('engine_app_api_key' + '_enc')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict types and write-only app key body', () => {
    const source = readFrontendSource('src/api/ai/apps.ts')
    expect(source).toContain('engine_app_api_key?: string')
    expect(source).toContain('engine_app_api_key_masked?: string | null')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('requires an apps route view for the DB component key', () => {
    const source = readFrontendSource('src/views/Main/ai/apps/index.vue')
    expect(source).toContain('AiAppApi')
    expect(source).toContain('engine_app_api_key')
    expect(source).toContain('engine_app_api_key_masked')
    expect(source).not.toContain('Authorization')
  })

})
