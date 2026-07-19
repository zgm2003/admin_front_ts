import { afterEach, describe, expect, it } from 'vitest'
import { UserSessionApi, UsersApi, UsersListApi } from '@/api/user/users'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('user API behavior', () => {
  it('executes the documented public authentication support endpoints', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)
    await UsersApi.getLoginConfig()
    await UsersApi.getCaptcha()
    await UsersApi.sendCode({} as never)
    await UsersApi.forgetPassword({} as never)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/auth/login-config'],
      ['GET', '/api/admin/v1/auth/captcha'],
      ['POST', '/api/admin/v1/auth/send-code'],
      ['POST', '/api/admin/v1/auth/forgot-password'],
    ])
  })

  it('executes current-user and explicit user profile operations separately', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)
    await UsersApi.initPersonal()
    await UsersApi.initPersonal({ user_id: 9 })
    await UsersApi.editPersonal({} as never)
    await UsersApi.updatePassword({} as never)
    await UsersApi.updateEmail({} as never)
    await UsersApi.updatePhone({} as never)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/profile'],
      ['GET', '/api/admin/v1/users/9/profile'],
      ['PUT', '/api/admin/v1/profile'],
      ['PUT', '/api/admin/v1/profile/security/password'],
      ['PUT', '/api/admin/v1/profile/security/email'],
      ['PUT', '/api/admin/v1/profile/security/phone'],
    ])
  })

  it('executes user-management and session resource operations', async () => {
    const harness = installApiClientHarness({
      dict: {
        roleArr: [],
        auth_address_tree: [],
        sexArr: [],
        platformArr: [],
      },
    })
    cleanups.push(harness.uninstall)
    await UsersListApi.pageInit()
    harness.respondWith({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    await UsersListApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({})
    await UsersListApi.changeStatus({ id: 7, status: 1 })
    await UsersListApi.deleteOne({ id: 7 })
    harness.respondWith({ id: 11, message: 'queued' })
    await UsersListApi.export({ ids: [7] })
    harness.respondWith({})
    await UserSessionApi.pageInit()
    await UserSessionApi.list({ current_page: 1, page_size: 20 })
    await UserSessionApi.stats()
    await UserSessionApi.kick({ id: 4 } as never)
    await UserSessionApi.batchKick({ ids: [4, 5] } as never)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/users/page-init'],
      ['GET', '/api/admin/v1/users'],
      ['PATCH', '/api/admin/v1/users/7/status'],
      ['DELETE', '/api/admin/v1/users/7'],
      ['POST', '/api/admin/v1/users/export'],
      ['GET', '/api/admin/v1/user-sessions/page-init'],
      ['GET', '/api/admin/v1/user-sessions'],
      ['GET', '/api/admin/v1/user-sessions/stats'],
      ['PATCH', '/api/admin/v1/user-sessions/4/revoke'],
      ['PATCH', '/api/admin/v1/user-sessions/revoke'],
    ])
  })
})
