import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function readUsersApiSource() {
  return readFrontendSource('src/api/user/users.ts')
}

function readUserTypeSource() {
  return readFrontendSource('src/types/user.ts')
}

function readAuthSessionSource() {
  return readFrontendSource('src/lib/http/auth-session.ts')
}

describe('users api auth contract', () => {
  it('does not expose a standalone register api anymore', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()

    expect(source).not.toContain('export interface UserRegisterParams')
    expect(source).not.toContain('register: (params:')
    expect(source).not.toContain('/api/Users/register')
    expect(source).toContain('/api/admin/v1/auth/login')
    expect(typeSource).not.toContain("| 'register'")
  })

  it('uses the REST current-user endpoint as the bootstrap contract', () => {
    const source = readUsersApiSource()

    expect(source).toContain("import request, { legacyRequest } from '@/lib/http'")
    expect(source).toContain("request.get<UserInitResponse>('/api/admin/v1/users/me')")
    expect(source).toContain('me: fetchCurrentUser')
    expect(source).toContain('init: fetchCurrentUser')
    expect(source).not.toContain('goRequest')
    expect(source).not.toContain("legacyRequest.post<UserInitResponse>('/api/Users/init', {})")
  })

  it('uses the REST auth refresh endpoint', () => {
    const source = readAuthSessionSource()
    const usersApiSource = readUsersApiSource()

    expect(source).toContain("const REFRESH_PATH = '/api/admin/v1/auth/refresh'")
    expect(source).toContain('`${baseURL}${REFRESH_PATH}`')
    expect(source).toContain('originalRequest.url?.includes(REFRESH_PATH)')
    expect(source).not.toContain('/api/Users/refresh')
    expect(usersApiSource).toContain("request.post<UserLoginSession>('/api/admin/v1/auth/refresh', params)")
    expect(usersApiSource).not.toContain("legacyRequest.post<UserLoginSession>('/api/Users/refresh', params)")
  })

  it('uses the REST password login plus go-captcha contract', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()

    expect(source).toContain("request.get<LoginConfigResponse>('/api/admin/v1/auth/login-config')")
    expect(source).toContain("request.get<UserCaptchaChallenge>('/api/admin/v1/auth/captcha')")
    expect(source).toContain("request.post<UserLoginSession, UserLoginParams>('/api/admin/v1/auth/login', params)")
    expect(source).not.toContain('/api/Users/login')

    expect(typeSource).toContain('export interface UserCaptchaAnswer')
    expect(typeSource).toContain('export interface UserCaptchaChallenge')
    expect(typeSource).toContain('captcha_enabled: boolean')
    expect(typeSource).toContain('captcha_id: string')
    expect(typeSource).toContain('captcha_answer: UserCaptchaAnswer')
  })
})

