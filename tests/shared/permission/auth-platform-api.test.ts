import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('auth platform api REST contract', () => {
  it('uses default REST endpoints instead of legacy all-post auth platform routes', () => {
    const source = readFrontendSource('src/api/permission/authPlatform.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AuthPlatformInitResponse>(`${ADMIN_API_PREFIX}/auth-platforms/init`)')
    expect(source).toContain('request.get<PaginatedResponse<AuthPlatformItem>>(`${ADMIN_API_PREFIX}/auth-platforms`')
    expect(source).toContain('request.post<void, AuthPlatformAddPayload>(`${ADMIN_API_PREFIX}/auth-platforms`')
    expect(source).toContain('request.put<void, AuthPlatformUpdatePayload>(')
    expect(source).toContain('request.patch<void, AuthPlatformStatusBody>(')
    expect(source).toContain('request.delete<void>(`${ADMIN_API_PREFIX}/auth-platforms/${ids[0]}`)')
    expect(source).toContain('request.delete<void, AuthPlatformBatchDeletePayload>(`${ADMIN_API_PREFIX}/auth-platforms`')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/AuthPlatform/')
  })

  it('declares captcha_type as a strict contract field', () => {
    const apiSource = readFrontendSource('src/api/permission/authPlatform.ts')
    const pageSource = readFrontendSource('src/views/Main/permission/authPlatform/index.vue')

    expect(apiSource).toContain("export type AuthPlatformCaptchaType = 'slide'")
    expect(apiSource).toContain('auth_platform_captcha_type_arr: DictOption<AuthPlatformCaptchaType>[]')
    expect(apiSource).toContain('captcha_type: AuthPlatformCaptchaType')
    expect(pageSource).toContain("t('authPlatform.table.captcha_type')")
    expect(pageSource).toContain('dict.auth_platform_captcha_type_arr')
  })

  it('keeps touched auth platform api types strict without catch-all fields', () => {
    const source = readFrontendSource('src/api/permission/authPlatform.ts')

    expect(source).not.toContain('extends RequestPayload')
    expect(source).not.toContain('extends Record<string, unknown>')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })
})
