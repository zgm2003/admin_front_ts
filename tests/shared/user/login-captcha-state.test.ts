import { describe, expect, it, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  sendCode: vi.fn(),
  getCaptcha: vi.fn(),
  getLoginConfig: vi.fn(),
  messageError: vi.fn(),
  messageInfo: vi.fn(),
  notificationSuccess: vi.fn(),
  persistenceRead: vi.fn(() => null),
  persistenceWrite: vi.fn(),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
  }
})

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    login: mocks.login,
    sendCode: mocks.sendCode,
    getCaptcha: mocks.getCaptcha,
    getLoginConfig: mocks.getLoginConfig,
  },
}))

vi.mock('@/app/injection', () => ({
  useAppKernel: () => ({
    login: mocks.login,
    persistence: {
      read: mocks.persistenceRead,
      write: mocks.persistenceWrite,
      remove: vi.fn(),
      clearNamespace: vi.fn(),
    },
  }),
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

  it('does not open captcha when a password-login attempt fails', async () => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()

    login.setFormRef({ validateField: vi.fn(async () => true), clearValidate: vi.fn() } as never)
    login.loginForm.login_account = '15671628271'
    login.loginForm.password = 'wrong-password'
    login.agreePolicy.value = true
    mocks.login.mockRejectedValueOnce(new Error('账号或密码错误'))

    await login.handleSubmit()

    expect(mocks.login).toHaveBeenCalledWith({
      login_type: 'password',
      login_account: '15671628271',
      password: 'wrong-password',
    })
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(login.captchaDialogVisible.value).toBe(false)
  })

  it('persists only the remembered non-secret account after kernel login', async () => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()
    login.setFormRef({ validateField: vi.fn(async () => true), clearValidate: vi.fn() } as never)
    login.loginForm.login_account = '15671628271'
    login.loginForm.password = '123456'
    login.agreePolicy.value = true
    mocks.login.mockResolvedValueOnce({ kind: 'ready' })

    await login.handleSubmit()

    expect(mocks.login).toHaveBeenCalledTimes(1)
    expect(mocks.persistenceWrite).toHaveBeenCalledWith(
      expect.anything(),
      'preferences',
      expect.anything(),
      { rememberedLogin: { account: '15671628271', type: 'password' } },
    )
    expect(JSON.stringify(mocks.persistenceWrite.mock.calls)).not.toMatch(/access[_-]?token|refresh[_-]?token/i)
  })

  it('validates the selected login account before opening captcha for send-code', async () => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()
    const validateField = vi.fn().mockRejectedValueOnce(new Error('invalid email'))
    login.setFormRef({ validateField, clearValidate: vi.fn() } as never)
    login.activeAccountType.value = 'email'
    login.loginForm.login_account = '15671628271'
    login.captchaEnabled.value = true

    const requestLoginCode = (login as unknown as { requestLoginCode?: () => Promise<void> }).requestLoginCode
    expect(typeof requestLoginCode).toBe('function')
    await requestLoginCode?.()

    expect(validateField).toHaveBeenCalledWith('login_account')
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.sendCode).not.toHaveBeenCalled()
  })

  it.each([
    ['email', 'user@example.com'],
    ['phone', '15671628271'],
  ] as const)('requires captcha before sending a %s login code', async (loginType, account) => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()
    const validateField = vi.fn().mockResolvedValueOnce(true)
    const completeSend = vi.fn()
    login.setFormRef({ validateField, clearValidate: vi.fn() } as never)
    login.setSendCodeRef({ completeSend, reset: vi.fn() } as never)
    login.activeAccountType.value = loginType
    login.loginForm.login_account = account
    login.captchaEnabled.value = true
    mocks.getCaptcha.mockResolvedValueOnce({
      captcha_id: `captcha-${loginType}`,
      captcha_type: 'slide',
      master_image: 'master',
      tile_image: 'tile',
      image_width: 320,
      image_height: 180,
      tile_x: 100,
      tile_y: 12,
      tile_width: 48,
      tile_height: 48,
      expires_in: 120,
    })
    mocks.sendCode.mockResolvedValueOnce(undefined)

    const requestLoginCode = (login as unknown as { requestLoginCode?: () => Promise<void> }).requestLoginCode
    expect(typeof requestLoginCode).toBe('function')
    await requestLoginCode?.()

    expect(validateField).toHaveBeenCalledWith('login_account')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(mocks.sendCode).not.toHaveBeenCalled()
    expect(login.captchaDialogVisible.value).toBe(true)

    login.captchaX.value = 124
    await login.completeCaptchaLogin()

    expect(mocks.sendCode).toHaveBeenCalledWith({
      account,
      scene: 'login',
      login_type: loginType,
      captcha_id: `captcha-${loginType}`,
      captcha_answer: { x: 124, y: 12 },
    })
    expect(mocks.login).not.toHaveBeenCalled()
    expect(completeSend).toHaveBeenCalledTimes(1)
    expect(login.captchaDialogVisible.value).toBe(false)
  })

  it('keeps login send-code captcha open and replaces a rejected challenge', async () => {
    const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
    const login = useLoginForm()
    const validateField = vi.fn().mockResolvedValue(true)
    const completeSend = vi.fn()
    const firstChallenge = {
      captcha_id: 'captcha-first',
      captcha_type: 'slide' as const,
      master_image: 'first-master',
      tile_image: 'first-tile',
      image_width: 320,
      image_height: 180,
      tile_x: 100,
      tile_y: 12,
      tile_width: 48,
      tile_height: 48,
      expires_in: 120,
    }
    const replacementChallenge = {
      ...firstChallenge,
      captcha_id: 'captcha-replacement',
      master_image: 'replacement-master',
      tile_image: 'replacement-tile',
      tile_x: 80,
    }
    login.setFormRef({ validateField, clearValidate: vi.fn() } as never)
    login.setSendCodeRef({ completeSend, reset: vi.fn() } as never)
    login.activeAccountType.value = 'phone'
    login.loginForm.login_account = '15671628271'
    login.captchaEnabled.value = true
    mocks.getCaptcha
      .mockResolvedValueOnce(firstChallenge)
      .mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(new Error('验证码错误或已过期'))

    await login.requestLoginCode()
    login.captchaX.value = 124
    await login.completeCaptchaLogin()

    expect(mocks.sendCode).toHaveBeenCalledWith({
      account: '15671628271',
      scene: 'login',
      login_type: 'phone',
      captcha_id: 'captcha-first',
      captcha_answer: { x: 124, y: 12 },
    })
    expect(completeSend).not.toHaveBeenCalled()
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(mocks.messageError).toHaveBeenCalledWith('验证码错误或已过期')
    expect(login.captchaDialogVisible.value).toBe(true)
    expect(login.captchaChallenge.value).toEqual(replacementChallenge)
  })
})
