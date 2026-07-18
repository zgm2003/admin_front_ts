import { describe, expect, it } from 'vitest'
import { getCurrentPrincipalOperation } from '@/modules/http/admin-operations'

describe('critical Admin operations', () => {
  it('locks users/me to the exact authenticated GET contract and strict schema', () => {
    expect(getCurrentPrincipalOperation).toMatchObject({
      method: 'GET',
      path: '/api/admin/v1/users/me',
      auth: 'required',
      replay: 'safe',
    })
    expect(getCurrentPrincipalOperation.responseSchema?.safeParse({
      user_id: 7,
      username: 'admin',
      avatar: '',
      role_name: 'administrator',
      permissions: [],
      router: [],
      buttonCodes: [],
    }).success).toBe(true)
    expect(getCurrentPrincipalOperation.responseSchema?.safeParse({
      user_id: 7,
      username: 'admin',
    }).success).toBe(false)
  })
})
