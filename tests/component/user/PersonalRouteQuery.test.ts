import { reactive } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserPersonalInitResponse } from '@/types/user'

const mocks = vi.hoisted(() => ({
  initPersonal: vi.fn(),
  route: undefined as unknown as { query: Record<string, unknown> },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/store/user', () => ({
  useUserStore: () => ({ user_id: 1 }),
}))

vi.mock('@/api/user/users.ts', () => ({
  UsersApi: { initPersonal: mocks.initPersonal },
}))

vi.mock('@/views/Main/personal/components/BaseInfo/index.vue', () => ({ default: { name: 'BaseInfo' } }))
vi.mock('@/views/Main/personal/components/LoginLog/index.vue', () => ({ default: { name: 'LoginLog' } }))
vi.mock('@/views/Main/personal/components/OperationLog/index.vue', () => ({ default: { name: 'OperationLog' } }))
vi.mock('@/views/Main/personal/components/Security/index.vue', () => ({ default: { name: 'Security' } }))
vi.mock('@/views/Main/personal/components/UserInfo/index.vue', () => ({ default: { name: 'UserInfo' } }))

const { default: PersonalPage } = await import('@/views/Main/personal/index.vue')

function personalInitResponse(userID: number): UserPersonalInitResponse {
  return {
    profile: {
      user_id: userID,
      username: `user-${userID}`,
      email: '',
      avatar: '',
      phone: '',
      role_id: 1,
      role_name: '',
      sex: 0,
      birthday: '',
      address_id: 0,
      detail_address: '',
      bio: '',
      is_self: 0,
      has_password: false,
    },
    dict: {
      auth_address_tree: [],
      sexArr: [],
      verify_type_arr: [],
    },
  }
}

describe('personal page route query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.route = reactive({ query: { user_id: '7' } })
    mocks.initPersonal.mockImplementation(({ user_id }: { user_id: number }) => (
      Promise.resolve(personalInitResponse(user_id))
    ))
  })

  it('reloads the profile when user_id changes without remounting the page', async () => {
    const wrapper = shallowMount(PersonalPage, {
      global: {
        stubs: {
          ElCard: true,
          ElTabPane: true,
          ElTabs: true,
        },
      },
    })
    await flushPromises()

    expect(mocks.initPersonal).toHaveBeenCalledTimes(1)
    expect(mocks.initPersonal).toHaveBeenLastCalledWith({ user_id: 7 })

    mocks.route.query.user_id = '8'
    await flushPromises()

    expect(mocks.initPersonal).toHaveBeenCalledTimes(2)
    expect(mocks.initPersonal).toHaveBeenLastCalledWith({ user_id: 8 })
    wrapper.unmount()
  })
})
