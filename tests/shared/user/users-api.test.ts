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
    expect(source).toContain('/api/Users/login')
    expect(typeSource).not.toContain("| 'register'")
  })

  it('uses the default REST current-user init endpoint while login is explicitly legacy-owned', () => {
    const source = readUsersApiSource()

    expect(source).toContain("import request, { legacyRequest } from '@/lib/http'")
    expect(source).toContain("request.get<UserInitResponse>('/api/v1/users/init')")
    expect(source).toContain('me: fetchCurrentUser')
    expect(source).toContain('init: fetchCurrentUser')
    expect(source).not.toContain('goRequest')
    expect(source).not.toContain("legacyRequest.post<UserInitResponse>('/api/Users/init', {})")
  })

  it('keeps the legacy auth refresh endpoint while login is still PHP-owned', () => {
    const source = readAuthSessionSource()
    const usersApiSource = readUsersApiSource()

    expect(source).toContain('`${baseURL}/api/Users/refresh`')
    expect(source).toContain("originalRequest.url?.includes('/api/Users/refresh')")
    expect(source).not.toContain('`${baseURL}/api/v1/auth/refresh`')
    expect(source).not.toContain("originalRequest.url?.includes('/api/v1/auth/refresh')")
    expect(usersApiSource).toContain("legacyRequest.post<UserLoginSession>('/api/Users/refresh', params)")
    expect(usersApiSource).not.toContain('/api/v1/auth/refresh')
  })
})
