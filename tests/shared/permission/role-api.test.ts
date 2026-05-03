import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('role api REST contract', () => {
  it('uses default REST role endpoints instead of legacy all-post role routes', () => {
    const source = readFrontendSource('src/api/permission/role.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<RoleInitResponse>(`${ADMIN_API_PREFIX}/roles/init`)')
    expect(source).toContain('request.get<PaginatedResponse<RoleListItem>>(`${ADMIN_API_PREFIX}/roles`')
    expect(source).toContain('request.post<void, RoleAddPayload>(`${ADMIN_API_PREFIX}/roles`')
    expect(source).toContain('request.put<void, RoleAddPayload>(')
    expect(source).toContain('request.patch<void>(`${ADMIN_API_PREFIX}/roles/${params.id}/default`)')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/roles/${ids[0]}`)')
    expect(source).toContain('request.delete<void, RoleBatchDeletePayload>(`${ADMIN_API_PREFIX}/roles`')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/Role/')
  })

  it('keeps touched role api types strict without catch-all fields', () => {
    const source = readFrontendSource('src/api/permission/role.ts')

    expect(source).not.toContain('extends RequestPayload')
    expect(source).not.toContain('extends Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
