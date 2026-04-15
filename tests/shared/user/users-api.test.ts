import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readUsersApiSource() {
  return readFileSync(
    resolve('e:/admin/admin_front_ts/src/api/user/users.ts'),
    'utf8',
  )
}

function readUserTypeSource() {
  return readFileSync(
    resolve('e:/admin/admin_front_ts/src/types/user.ts'),
    'utf8',
  )
}

describe('users api auth contract', () => {
  it('does not expose a standalone register api anymore', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()

    expect(source).not.toContain('export interface UserRegisterParams')
    expect(source).not.toContain('register: (params:')
    expect(source).not.toContain("/api/Users/register")
    expect(source).toContain("/api/Users/login")
    expect(typeSource).not.toContain("| 'register'")
  })
})
