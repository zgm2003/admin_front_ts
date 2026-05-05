import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('pay channel api REST contract', () => {
  it('uses Go REST endpoints instead of legacy all-post pay channel routes', () => {
    const source = readFrontendSource('src/api/pay/channel.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PayChannelInitResponse>(`${ADMIN_API_PREFIX}/pay-channels/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<PayChannelListItem>>(`${ADMIN_API_PREFIX}/pay-channels`')
    expect(source).toContain('request.post<PayChannelCreateResponse, PayChannelCreatePayload>(`${ADMIN_API_PREFIX}/pay-channels`')
    expect(source).toContain('request.put<void, PayChannelUpdatePayload>(')
    expect(source).toContain('request.patch<void, PayChannelStatusBody>(')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/pay-channels/${params.id}`)')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/PayChannel/')
  })

  it('keeps touched pay channel api types strict without catch-all fields or batch-delete body', () => {
    const source = readFrontendSource('src/api/pay/channel.ts')

    expect(source).not.toContain('extends Record<string, unknown>')
    expect(source).not.toContain('params?: Record<string, unknown>')
    expect(source).not.toContain('id: number | number[]')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
