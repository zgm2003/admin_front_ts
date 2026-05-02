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

  it('uses the RESTful current-user endpoint for session bootstrap', () => {
    const source = readUsersApiSource()

    expect(source).toContain("request.get<UserInitResponse>('/api/v1/users/me')")
    expect(source).toContain('me: fetchCurrentUser')
    expect(source).toContain('init: fetchCurrentUser')
    expect(source).not.toContain("request.post<UserInitResponse>('/api/Users/init'")
  })

  it('uses the RESTful auth refresh endpoint', () => {
    const source = readAuthSessionSource()
    const usersApiSource = readUsersApiSource()

    expect(source).toContain('`${baseURL}/api/v1/auth/refresh`')
    expect(source).toContain("originalRequest.url?.includes('/api/v1/auth/refresh')")
    expect(source).not.toContain('`${baseURL}/api/Users/refresh`')
    expect(source).not.toContain("originalRequest.url?.includes('/api/Users/refresh')")
    expect(usersApiSource).toContain("request.post<UserLoginSession>('/api/v1/auth/refresh', params)")
    expect(usersApiSource).not.toContain('/api/Users/refresh')
  })
})
