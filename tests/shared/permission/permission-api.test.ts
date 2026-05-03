import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('permission api REST contract', () => {
  it('uses default REST endpoints instead of legacy all-post permission routes', () => {
    const source = readFrontendSource('src/api/permission/permission.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<PermissionInitResponse>(`${ADMIN_API_PREFIX}/permissions/init`)')
    expect(source).toContain('request.get<PermissionListItem[]>(`${ADMIN_API_PREFIX}/permissions`')
    expect(source).toContain('request.post<PermissionCreateResponse, PermissionMutationPayload>(`${ADMIN_API_PREFIX}/permissions`')
    expect(source).toContain('request.put<void, PermissionMutationPayload>(')
    expect(source).toContain('request.patch<void, PermissionStatusBody>(')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/permissions/${params.id}`)')
    expect(source).toContain('request.delete<void, PermissionBatchDeletePayload>(`${ADMIN_API_PREFIX}/permissions`')
    expect(source).not.toContain('goRequest')
    expect(source).not.toContain('/api/admin/Permission/')
  })

  it('keeps touched permission api types strict without catch-all fields', () => {
    const source = readFrontendSource('src/api/permission/permission.ts')

    expect(source).not.toContain('extends Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
    expect(source).not.toContain('permission_id')
  })

  it('declares the new API base URL as the default request client and marks PHP as legacy', () => {
    const clientSource = readFrontendSource('src/lib/http/client.ts')
    const envDevelopment = readFrontendSource('.env.development')
    const envProduction = readFrontendSource('.env.production')

    expect(clientSource).toContain('const apiBaseURL = requiredEnv')
    expect(clientSource).toContain('VITE_GO_API_BASE_URL')
    expect(clientSource).toContain('const request = apiClient.request')
    expect(clientSource).toContain('const legacyRequest = legacyClient.request')
    expect(clientSource).toContain('refreshBaseURL: legacyBaseURL')
    expect(clientSource).not.toContain('goRequest')
    expect(clientSource).not.toMatch(forbiddenLooseTypePattern)
    expect(envDevelopment).toMatch(/^VITE_GO_API_BASE_URL=http:\/\/localhost:8080$/m)
    expect(envProduction).toMatch(/^VITE_GO_API_BASE_URL=.+$/m)
  })
})

