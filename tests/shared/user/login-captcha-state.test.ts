import { describe, expect, it, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  getCaptcha: vi.fn(),
  getLoginConfig: vi.fn(),
  replace: vi.fn(),
  setupDynamicRoutes: vi.fn(),
  clearAllCookies: vi.fn(),
  cookieSet: vi.fn(),
  cookieRemove: vi.fn(),
  messageError: vi.fn(),
  messageInfo: vi.fn(),
  notificationSuccess: vi.fn(),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: { value: { path: '/login', query: {} } },
    replace: mocks.replace,
  }),
}))

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    login: mocks.login,
    getCaptcha: mocks.getCaptcha,
    getLoginConfig: mocks.getLoginConfig,
  },
}))

vi.mock('@/router', () => ({
  setupDynamicRoutes: mocks.setupDynamicRoutes,
}))

vi.mock('@/utils/storage', () => ({
  clearAllCookies: mocks.clearAllCookies,
}))

vi.mock('js-cookie', () => ({
  default: {
    set: mocks.cookieSet,
    remove: mocks.cookieRemove,
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mocks.messageError,
    info: mocks.messageInfo,
  },
  ElNotification: {
    success: mocks.notificationSuccess,
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

describe('login captcha state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('closes the captcha overlay after a completed password-login attempt fails', async () => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()

    login.loginForm.login_account = '15671628271'
    login.loginForm.password = 'wrong-password'
    login.captchaEnabled.value = true
    login.captchaDialogVisible.value = true
    login.captchaChallenge.value = {
      captcha_id: 'captcha-1',
      captcha_type: 'slide',
      master: 'master',
      thumb: 'thumb',
      width: 320,
      height: 180,
      tile_x: 100,
      tile_y: 12,
      tile_width: 48,
      tile_height: 48,
    }
    login.captchaX.value = 124
    mocks.login.mockRejectedValueOnce(new Error('账号或密码错误'))
    mocks.getCaptcha.mockResolvedValueOnce({
      captcha_id: 'captcha-2',
      captcha_type: 'slide',
      master: 'next-master',
      thumb: 'next-thumb',
      width: 320,
      height: 180,
      tile_x: 80,
      tile_y: 10,
      tile_width: 48,
      tile_height: 48,
    })

    await login.completeCaptchaLogin()

    expect(mocks.login).toHaveBeenCalledWith({
      login_type: 'password',
      login_account: '15671628271',
      password: 'wrong-password',
      captcha_id: 'captcha-1',
      captcha_answer: { x: 124, y: 12 },
    })
    expect(login.captchaDialogVisible.value).toBe(false)
  })
})
