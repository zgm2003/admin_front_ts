import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Persistence, type StorageAdapter } from '@/modules/persistence/store'

const mocks = vi.hoisted(() => ({
  getLoginConfig: vi.fn(),
  getCaptcha: vi.fn(),
  sendCode: vi.fn(),
  kernelLogin: vi.fn(),
  messageError: vi.fn(),
  notificationSuccess: vi.fn(),
}))

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  keys() { return [...this.values.keys()] }
}

const storage = new MemoryStorage()
const persistence = new Persistence(storage)

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    getLoginConfig: mocks.getLoginConfig,
    getCaptcha: mocks.getCaptcha,
    sendCode: mocks.sendCode,
  },
}))

vi.mock('@/app/injection', () => ({
  useAppKernel: () => ({
    login: mocks.kernelLogin,
    persistence,
  }),
}))

vi.mock('element-plus', () => ({
  ElMessage: { error: mocks.messageError, info: vi.fn() },
  ElNotification: { success: mocks.notificationSuccess },
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key: string) => key } },
}))

const challenge = {
  captcha_id: 'captcha-login',
  captcha_type: 'slide' as const,
  master_image: 'master',
  tile_image: 'tile',
  image_width: 320,
  image_height: 180,
  tile_x: 100,
  tile_y: 12,
  tile_width: 48,
  tile_height: 48,
  expires_in: 120,
}

async function mountLoginHarness() {
  const { useLoginForm } = await import('@/views/Login/composables/useLoginForm')
  const Harness = defineComponent({
    setup() {
      return { login: useLoginForm() }
    },
    template: '<div />',
  })
  const wrapper = mount(Harness)
  await flushPromises()
  return wrapper.vm.login as ReturnType<typeof useLoginForm>
}

function preparePasswordLogin(login: Awaited<ReturnType<typeof mountLoginHarness>>) {
  login.setFormRef({ validateField: vi.fn(async () => true), clearValidate: vi.fn() } as never)
  login.loginForm.login_account = 'admin@example.test'
  login.loginForm.password = 'correct-password'
}

describe('kernel-owned login form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.values.clear()
    mocks.getLoginConfig.mockResolvedValue({
      login_type_arr: [{ label: 'Password', value: 'password' }],
      captcha_enabled: true,
      captcha_type: 'slide',
    })
    mocks.getCaptcha.mockResolvedValue(challenge)
    mocks.kernelLogin.mockResolvedValue({ kind: 'ready' })
  })

  it('loads config first and delegates password credentials directly to AppKernel', async () => {
    const login = await mountLoginHarness()
    expect(mocks.getLoginConfig).toHaveBeenCalledTimes(1)
    login.setFormRef({ validateField: vi.fn(async () => true), clearValidate: vi.fn() } as never)
    login.loginForm.login_account = 'admin@example.test'
    login.loginForm.password = 'correct-password'
    login.agreePolicy.value = true

    expect('remember' in login.loginForm).toBe(false)

    await login.handleSubmit()

    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.kernelLogin).toHaveBeenCalledWith({
      login_type: 'password',
      login_account: 'admin@example.test',
      password: 'correct-password',
    })
    expect([...storage.values.values()].join('')).not.toMatch(/access[_-]?token|refresh[_-]?token/i)
  })

  it('opens one policy confirmation before validation, captcha, or kernel work', async () => {
    const login = await mountLoginHarness()
    preparePasswordLogin(login)

    await login.handleSubmit()
    await login.handleSubmit()

    expect(login.policyConfirmVisible.value).toBe(true)
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.kernelLogin).not.toHaveBeenCalled()
    expect(mocks.messageError).not.toHaveBeenCalledWith('login.validation.policyRequired')
  })

  it('cancels a deferred login without granting consent or doing login work', async () => {
    const login = await mountLoginHarness()
    preparePasswordLogin(login)
    await login.handleSubmit()

    login.cancelPolicyConfirmation()

    expect(login.policyConfirmVisible.value).toBe(false)
    expect(login.agreePolicy.value).toBe(false)
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.kernelLogin).not.toHaveBeenCalled()
  })

  it('continues the deferred submission exactly once after an explicit confirmation click', async () => {
    const login = await mountLoginHarness()
    preparePasswordLogin(login)
    await login.handleSubmit()

    await login.confirmPolicyAndContinue()
    await login.confirmPolicyAndContinue()

    expect(login.agreePolicy.value).toBe(true)
    expect(login.policyConfirmVisible.value).toBe(false)
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.kernelLogin).toHaveBeenCalledTimes(1)
  })

  it('submits directly when the checkbox was already selected', async () => {
    const login = await mountLoginHarness()
    preparePasswordLogin(login)
    login.agreePolicy.value = true

    await login.handleSubmit()

    expect(login.policyConfirmVisible.value).toBe(false)
    expect(mocks.getCaptcha).not.toHaveBeenCalled()
    expect(mocks.kernelLogin).toHaveBeenCalledTimes(1)
  })

  it('does not treat opening terms or privacy information as consent', async () => {
    const login = await mountLoginHarness()

    login.openService()
    expect(login.agreePolicy.value).toBe(false)
    login.openPolicy()
    expect(login.agreePolicy.value).toBe(false)
  })

  it('shows the authentication failure and never turns it into an empty success state', async () => {
    mocks.kernelLogin.mockRejectedValueOnce(new Error('账号或密码错误'))
    const login = await mountLoginHarness()
    preparePasswordLogin(login)
    login.loginForm.password = 'wrong-password'
    login.agreePolicy.value = true

    await login.handleSubmit()

    expect(mocks.messageError).toHaveBeenCalledWith('账号或密码错误')
    expect(login.isLoginSuccess.value).toBe(false)
  })
})
