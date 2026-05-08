import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI tool map api contract', () => {
  it('uses safe tool map endpoints and no direct execution path', () => {
    const source = readFrontendSource('src/api/ai/toolMaps.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiToolMapInitResponse>(`${ADMIN_API_PREFIX}/ai-tool-maps/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiToolMapItem>>(`${ADMIN_API_PREFIX}/ai-tool-maps`')
    expect(source).toContain('request.post<AiToolMapCreateResponse, AiToolMapMutationBody>(`${ADMIN_API_PREFIX}/ai-tool-maps`')
    expect(source).toContain('request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-tool-maps/${positiveID(params.id, \'AI tool map id\')}/status`')
    expect(source).not.toContain('execute')
    expect(source).not.toContain('legacy' + 'Request')
    expect(source).not.toContain('Authorization')
  })

  it('keeps strict config_json type', () => {
    const source = readFrontendSource('src/api/ai/toolMaps.ts')
    expect(source).toContain('config_json?: JsonObject | null')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('requires the route view to use the new map api as the main path', () => {
    const source = readFrontendSource('src/views/Main/ai/tools/index.vue')
    expect(source).toContain('AiToolMapApi')
    expect(source).not.toContain('AiToolApi')
  })

})
