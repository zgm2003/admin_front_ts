import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('login send-code security boundary', () => {
  it('keeps the shared captcha-send state machine in a testable composable', () => {
    expect(existsSync(resolve(process.cwd(), 'src/components/SendCode/src/useCaptchaSendCode.ts'))).toBe(true)
  })

  it('routes non-login sends through the shared captcha flow', () => {
    const sendCodeSource = source('src/components/SendCode/src/index.vue')

    expect(sendCodeSource).toContain("import { AppCaptchaOverlay } from '@/components/AppCaptcha'")
    expect(sendCodeSource).toContain("import { isSendCodeAccountValid, useCaptchaSendCode } from './useCaptchaSendCode'")
    expect(sendCodeSource).toContain("if (scene === 'login')")
    expect(sendCodeSource).toContain("emit('request')")
    expect(sendCodeSource).toContain('await openCaptcha()')
    expect(sendCodeSource).not.toContain('UsersApi.sendCode')
    expect(sendCodeSource).toContain('<Teleport to="body">')
    expect(sendCodeSource).toContain('<AppCaptchaOverlay')
  })

  it('keeps login send-code controlled by the validated login form', () => {
    const formSource = source('src/views/Login/components/LoginFormCard.vue')
    const pageSource = source('src/views/Login/index.vue')

    expect(formSource).toContain('@request="$emit(\'sendCode\')"')
    expect(formSource).toContain(':send-disabled="isLoginCodeAccountInvalid"')
    expect(pageSource).toContain('@send-code="requestLoginCode"')
  })

  it('covers forgot password and every personal-security send-code scene', () => {
    const forgotDialogSource = source('src/views/Login/components/ForgotPasswordDialog.vue')
    const securitySource = source('src/views/Main/personal/components/Security/index.vue')

    expect(forgotDialogSource).toContain('<SendCode')
    expect(forgotDialogSource).toContain('scene="forget"')
    expect(securitySource).toContain('scene="bind_phone"')
    expect(securitySource).toContain('scene="bind_email"')
    expect(securitySource).toContain('scene="change_password"')
    expect(securitySource).toContain(':send-disabled="isPhoneSendDisabled"')
    expect(securitySource).toContain(':send-disabled="isEmailSendDisabled"')
  })
})
