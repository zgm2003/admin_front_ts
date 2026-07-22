import { describe, expect, it } from 'vitest'
import { isCaptchaChallengeError } from '@/modules/auth/captcha-error'
import { createApiError, type ApiErrorKind } from '@/modules/http/error'

function apiError(code: string, kind: ApiErrorKind = 'validation') {
  return createApiError({
    kind,
    code,
    retryable: false,
    messageKey: code,
  })
}

describe('isCaptchaChallengeError', () => {
  it.each([
    'captcha.required',
    'captcha.invalid_or_expired',
  ])('accepts the stable captcha challenge code %s', (code) => {
    expect(isCaptchaChallengeError(apiError(code))).toBe(true)
  })

  it.each([
    ['an ordinary localized Error', new Error('验证码错误或已过期')],
    ['a forged object', { code: 'captcha.required' }],
    ['channel unavailable', apiError('channel_unavailable', 'business')],
    ['network failure', apiError('http.network', 'network')],
    ['SMS dependency failure', apiError('dependency.sms', 'dependency')],
  ])('rejects %s', (_label, error) => {
    expect(isCaptchaChallengeError(error)).toBe(false)
  })
})
