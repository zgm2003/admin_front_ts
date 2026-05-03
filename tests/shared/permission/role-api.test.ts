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
    expect(source).toContain("request.get<RoleInitResponse>('/api/admin/v1/roles/init')")
    expect(source).toContain("request.get<PaginatedResponse<RoleListItem>>('/api/admin/v1/roles'")
    expect(source).toContain("request.post<void, RoleAddPayload>('/api/admin/v1/roles'")
    expect(source).toContain('request.put<void, RoleAddPayload>(')
    expect(source).toContain('request.patch<void>(`/api/admin/v1/roles/${params.id}/default`)')
    expect(source).toContain('request.delete<void>(`/api/admin/v1/roles/${ids[0]}`)')
    expect(source).toContain("request.delete<void, RoleBatchDeletePayload>('/api/admin/v1/roles'")
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
