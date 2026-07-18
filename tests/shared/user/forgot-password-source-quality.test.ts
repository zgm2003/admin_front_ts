import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  forgetPassword: vi.fn(),
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
}))

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    forgetPassword: mocks.forgetPassword,
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mocks.messageError,
    success: mocks.messageSuccess,
    warning: mocks.messageWarning,
  },
}))

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

async function createForgotPassword() {
  const { useForgotPassword } = await import('@/views/Login/composables/useForgotPassword')
  return useForgotPassword()
}

describe('forgot password behavior', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('does not replace an empty reset-password request error with the generic reset fallback', async () => {
    const forgotPassword = await createForgotPassword()
    forgotPassword.forgotForm.account = 'user@example.com'
    forgotPassword.forgotForm.code = '123456'
    forgotPassword.forgotForm.newPassword = 'new-password'
    forgotPassword.forgotForm.confirmPassword = 'new-password'
    mocks.forgetPassword.mockRejectedValueOnce(new Error(''))

    await expect(forgotPassword.handleResetPassword()).rejects.toThrow('forgot password reset error message must be non-empty')
    expect(mocks.messageError).not.toHaveBeenCalledWith('forgotPassword.validation.resetFailed')
  })
})
