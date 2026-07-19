import { afterEach, describe, expect, it } from 'vitest'
import { UserSessionApi, UsersApi, UsersListApi } from '@/api/user/users'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('user API behavior', () => {
  it('executes the documented public authentication support endpoints', async () => {
    const harness = installApiClientHarness({
      allow_register: true,
      captcha_enabled: true,
      captcha_type: 'slide',
      login_type_arr: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Password', value: 'password' },
      ],
    })
    cleanups.push(harness.uninstall)
    await UsersApi.getLoginConfig()
    harness.respondWith({
      captcha_id: 'captcha-1',
      captcha_type: 'slide',
      expires_in: 300,
      image_height: 160,
      image_width: 320,
      master_image: 'data:image/png;base64,master',
      tile_height: 40,
      tile_image: 'data:image/png;base64,tile',
      tile_width: 40,
      tile_x: 120,
      tile_y: 30,
    })
    await UsersApi.getCaptcha()
    harness.respondWith({})
    await UsersApi.sendCode({
      account: 'admin@example.test',
      scene: 'login',
      login_type: 'email',
      captcha_id: 'captcha-1',
      captcha_answer: { x: 120, y: 30 },
    })
    await UsersApi.forgetPassword({
      account: 'admin@example.test',
      new_password: 'new-password',
      confirm_password: 'new-password',
      code: '123456',
    })

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/auth/login-config'],
      ['GET', '/api/admin/v1/auth/captcha'],
      ['POST', '/api/admin/v1/auth/send-code'],
      ['POST', '/api/admin/v1/auth/forgot-password'],
    ])
  })

  it('executes current-user and explicit user profile operations separately', async () => {
    const profile = {
      dict: {
        auth_address_tree: [],
        sexArr: [],
        verify_type_arr: [],
      },
      profile: {
        address_id: 0,
        avatar: '',
        bio: '',
        birthday: '',
        detail_address: '',
        email: 'admin@example.test',
        has_password: true,
        is_self: 1,
        phone: '',
        role_id: 1,
        role_name: 'Administrator',
        sex: 0,
        user_id: 9,
        username: 'admin',
      },
    }
    const harness = installApiClientHarness(profile)
    cleanups.push(harness.uninstall)
    await UsersApi.initPersonal()
    await UsersApi.initPersonal({ user_id: 9 })
    harness.respondWith({})
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
    harness.respondWith({ dict: { platformArr: [], statusArr: [] } })
    await UserSessionApi.pageInit()
    harness.respondWith({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    await UserSessionApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({ platform_distribution: {}, total_active: 0 })
    await UserSessionApi.stats()
    harness.respondWith({ id: 4, revoked: true })
    await UserSessionApi.kick({ id: 4 } as never)
    harness.respondWith({ count: 2, skipped_already_revoked: 0, skipped_current: 0 })
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
