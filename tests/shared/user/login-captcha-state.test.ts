import { describe, expect, it, beforeEach, vi } from 'vitest'
import { createApiError, type ApiErrorKind } from '@/modules/http/error'

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

function apiError(code: string, message: string, kind: ApiErrorKind = 'validation') {
  return createApiError({
    kind,
    code,
    retryable: false,
    messageKey: code,
    message,
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function createPhoneCaptchaLogin() {
  const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
  const login = useLoginForm()
  const validateField = vi.fn().mockResolvedValue(true)
  const completeSend = vi.fn()
  login.setFormRef({ validateField, clearValidate: vi.fn() } as never)
  login.setSendCodeRef({ completeSend, reset: vi.fn() } as never)
  login.activeAccountType.value = 'phone'
  login.loginForm.login_account = '15671628271'
  login.captchaEnabled.value = true
  return { login, validateField, completeSend }
}

async function openCompletedPhoneCaptcha() {
  const setup = await createPhoneCaptchaLogin()
  mocks.getCaptcha.mockResolvedValueOnce(firstChallenge)
  await setup.login.requestLoginCode()
  setup.login.captchaX.value = firstChallenge.tile_x + 24
  return setup
}

type LoginCaptchaForm = Awaited<ReturnType<typeof createPhoneCaptchaLogin>>['login']

function expectCaptchaReset(login: LoginCaptchaForm) {
  expect(login.captchaDialogVisible.value).toBe(false)
  expect(login.captchaChallenge.value).toBeNull()
  expect(login.captchaX.value).toBe(0)
  expect(login.captchaLoading.value).toBe(false)
  expect(login.isSendingCode.value).toBe(false)
}

describe('login captcha state', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.persistenceRead.mockReturnValue(null)
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

    await login.requestLoginCode()

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
    const challenge = {
      ...firstChallenge,
      captcha_id: `captcha-${loginType}`,
      master_image: 'master',
      tile_image: 'tile',
    }
    mocks.getCaptcha.mockResolvedValueOnce(challenge)
    mocks.sendCode.mockResolvedValueOnce(undefined)

    await login.requestLoginCode()

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
    expectCaptchaReset(login)
  })

  it.each([
    ['captcha.required', 'Captcha is required'],
    ['captcha.invalid_or_expired', 'Captcha expired'],
  ])('keeps login verifier open with a replacement challenge for %s', async (code, message) => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const sendError = apiError(code, message)
    mocks.getCaptcha.mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(sendError)

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
    expect(mocks.messageError).toHaveBeenCalledTimes(1)
    expect(mocks.messageError).toHaveBeenCalledWith(message)
    expect(login.captchaDialogVisible.value).toBe(true)
    expect(login.captchaChallenge.value).toEqual(replacementChallenge)
    expect(login.captchaX.value).toBe(replacementChallenge.tile_x)
  })

  it.each([
    ['channel unavailable', apiError('auth.verify_code.channel_unavailable', 'SMS channel unavailable', 'business')],
    ['network error', apiError('http.network', 'network unavailable', 'network')],
    ['localized Error', new Error('验证码错误或已过期')],
  ])('closes login verifier without refreshing after %s', async (_label, sendError) => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    mocks.sendCode.mockRejectedValueOnce(sendError)

    await login.completeCaptchaLogin()

    expect(completeSend).not.toHaveBeenCalled()
    expect(mocks.messageError).toHaveBeenCalledTimes(1)
    expect(mocks.messageError).toHaveBeenCalledWith(sendError.message)
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(login.captchaDialogVisible.value).toBe(false)
    expect(login.captchaChallenge.value).toBeNull()
    expect(login.captchaX.value).toBe(0)
  })

  it('closes the login verifier when fetching a replacement challenge fails', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const sendError = apiError('captcha.invalid_or_expired', 'Captcha expired')
    const fetchError = apiError('dependency.captcha', 'captcha service failed', 'dependency')
    mocks.getCaptcha.mockRejectedValueOnce(fetchError)
    mocks.sendCode.mockRejectedValueOnce(sendError)

    await login.completeCaptchaLogin()

    expect(completeSend).not.toHaveBeenCalled()
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(mocks.messageError).toHaveBeenNthCalledWith(1, sendError.message)
    expect(mocks.messageError).toHaveBeenNthCalledWith(2, 'login.validation.captchaLoadFailed')
    expectCaptchaReset(login)
  })

  it('uses the same captcha reset when the login tab changes', async () => {
    const { login } = await openCompletedPhoneCaptcha()

    login.handleTabChange('email')

    expect(login.activeAccountType.value).toBe('email')
    expectCaptchaReset(login)
  })

  it('ignores duplicate captcha completion while a login code send is pending', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const pendingSend = deferred<void>()
    mocks.sendCode.mockImplementationOnce(() => pendingSend.promise)

    const firstCompletion = login.completeCaptchaLogin()
    const duplicateCompletion = login.completeCaptchaLogin()
    pendingSend.resolve()
    await Promise.all([firstCompletion, duplicateCompletion])

    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(completeSend).toHaveBeenCalledTimes(1)
    expectCaptchaReset(login)
  })

  it('does not open a new login captcha flow while a code send is pending', async () => {
    const { login, validateField, completeSend } = await openCompletedPhoneCaptcha()
    const pendingSend = deferred<void>()
    mocks.sendCode.mockImplementationOnce(() => pendingSend.promise)
    mocks.getCaptcha.mockResolvedValueOnce(replacementChallenge)

    const completion = login.completeCaptchaLogin()
    await login.requestLoginCode()
    pendingSend.resolve()
    await completion

    expect(validateField).toHaveBeenCalledTimes(1)
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(completeSend).toHaveBeenCalledTimes(1)
    expectCaptchaReset(login)
  })

  it('does not let an old send completion write after a tab reset', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const pendingSend = deferred<void>()
    mocks.sendCode.mockImplementationOnce(() => pendingSend.promise)

    const completion = login.completeCaptchaLogin()
    login.handleTabChange('email')
    pendingSend.resolve()
    await completion

    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(completeSend).not.toHaveBeenCalled()
    expect(login.activeAccountType.value).toBe('email')
    expectCaptchaReset(login)
  })

  it('refreshes a rejected challenge before propagating an ElMessage failure', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const sendError = apiError('captcha.required', 'Captcha is required')
    const messageError = new Error('message renderer failed')
    mocks.getCaptcha.mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(sendError)
    mocks.messageError.mockImplementationOnce(() => { throw messageError })

    await expect(login.completeCaptchaLogin()).rejects.toBe(messageError)

    expect(completeSend).not.toHaveBeenCalled()
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(login.captchaDialogVisible.value).toBe(true)
    expect(login.captchaChallenge.value).toEqual(replacementChallenge)
    expect(login.captchaX.value).toBe(replacementChallenge.tile_x)
    expect(login.isSendingCode.value).toBe(false)
  })

  it('resets a non-captcha send failure before propagating an ElMessage failure', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const sendError = apiError('http.network', 'network unavailable', 'network')
    const messageError = new Error('message renderer failed')
    mocks.sendCode.mockRejectedValueOnce(sendError)
    mocks.messageError.mockImplementationOnce(() => { throw messageError })

    await expect(login.completeCaptchaLogin()).rejects.toBe(messageError)

    expect(completeSend).not.toHaveBeenCalled()
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expectCaptchaReset(login)
  })

  it('resets a successful send before propagating a completeSend failure', async () => {
    const { login, completeSend } = await openCompletedPhoneCaptcha()
    const callbackError = new Error('countdown failed')
    mocks.sendCode.mockResolvedValueOnce(undefined)
    completeSend.mockImplementationOnce(() => { throw callbackError })

    await expect(login.completeCaptchaLogin()).rejects.toBe(callbackError)

    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(completeSend).toHaveBeenCalledTimes(1)
    expect(mocks.messageError).not.toHaveBeenCalled()
    expectCaptchaReset(login)
  })
})
