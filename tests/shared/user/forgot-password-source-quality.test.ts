import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const forgotPasswordPath = 'src/views/Login/composables/useForgotPassword.ts'

const mocks = vi.hoisted(() => ({
  sendCode: vi.fn(),
  forgetPassword: vi.fn(),
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
}))

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    sendCode: mocks.sendCode,
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

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function forgotPasswordSource() {
  return stripComments(readFileSync(join(process.cwd(), forgotPasswordPath), 'utf8'))
}

async function createForgotPassword() {
  const { useForgotPassword } = await import('@/views/Login/composables/useForgotPassword')
  return useForgotPassword()
}

describe('forgot password source quality', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('handles request errors as unknown without optional-chain fallback messages', () => {
    const source = forgotPasswordSource()

    expect(source).not.toContain('catch (error: any)')
    expect(source).not.toContain('error?.message ||')
    expect(source).toContain('catch (error: unknown)')
    expect(source).toContain('requireRequestErrorMessage(error,')
  })

  it('does not replace an empty send-code request error with the generic send fallback', async () => {
    const forgotPassword = await createForgotPassword()
    forgotPassword.forgotForm.account = 'user@example.com'
    mocks.sendCode.mockRejectedValueOnce(new Error(''))

    await expect(forgotPassword.sendForgotCode()).rejects.toThrow('forgot password send code error message must be non-empty')
    expect(mocks.messageError).not.toHaveBeenCalledWith('forgotPassword.validation.sendFailed')
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
