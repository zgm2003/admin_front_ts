import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCaptcha: vi.fn(),
  sendCode: vi.fn(),
}))

vi.mock('@/api/user/users', () => ({
  UsersApi: {
    getCaptcha: mocks.getCaptcha,
    sendCode: mocks.sendCode,
  },
}))

import {
  isSendCodeAccountValid,
  useCaptchaSendCode,
} from '@/components/SendCode/src/useCaptchaSendCode'
import { createApiError, type ApiErrorKind } from '@/modules/http/error'

const challenge = {
  captcha_id: 'captcha-id',
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

const replacementChallenge = {
  ...challenge,
  captcha_id: 'captcha-replacement',
  master_image: 'replacement-master',
  tile_image: 'replacement-tile',
  tile_x: 80,
}

function apiError(code: string, kind: ApiErrorKind = 'validation') {
  return createApiError({
    kind,
    code,
    retryable: false,
    messageKey: code,
  })
}

describe('shared send-code captcha flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCaptcha.mockResolvedValue(challenge)
    mocks.sendCode.mockResolvedValue(undefined)
  })

  it.each([
    ['15671628271', 'bind_phone', true],
    ['user@example.com', 'bind_phone', false],
    ['user@example.com', 'bind_email', true],
    ['15671628271', 'bind_email', false],
    ['15671628271', 'forget', true],
    ['user@example.com', 'forget', true],
    ['15671628271', 'change_password', true],
    ['user@example.com', 'change_password', true],
    ['not-an-account', 'change_password', false],
  ] as const)('validates %s for %s', (account, scene, expected) => {
    expect(isSendCodeAccountValid(account, scene)).toBe(expected)
  })

  it('loads captcha first and sends only after captcha completion', async () => {
    const onSent = vi.fn()
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: 'user@example.com', scene: 'bind_email' }),
      onSent,
    })

    await flow.openCaptcha()

    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(mocks.sendCode).not.toHaveBeenCalled()
    expect(flow.captchaDialogVisible.value).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(challenge)

    flow.captchaX.value = 124
    await flow.completeCaptcha()

    expect(mocks.sendCode).toHaveBeenCalledWith({
      account: 'user@example.com',
      scene: 'bind_email',
      captcha_id: 'captcha-id',
      captcha_answer: { x: 124, y: 12 },
    })
    expect(onSent).toHaveBeenCalledTimes(1)
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
  })

  it('returns true when a challenge refresh succeeds', async () => {
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: 'user@example.com', scene: 'bind_email' }),
      onSent: vi.fn(),
    })

    const loaded = await flow.refreshCaptcha()

    expect(loaded).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(challenge)
    expect(flow.captchaX.value).toBe(challenge.tile_x)
    expect(flow.captchaLoading.value).toBe(false)
  })

  it('does not send before the slider has moved far enough', async () => {
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: '15671628271', scene: 'bind_phone' }),
      onSent: vi.fn(),
    })
    await flow.openCaptcha()
    flow.captchaX.value = 115

    await flow.completeCaptcha()

    expect(mocks.sendCode).not.toHaveBeenCalled()
    expect(flow.captchaDialogVisible.value).toBe(true)
  })

  it.each([
    'captcha.required',
    'captcha.invalid_or_expired',
  ])('keeps the verifier open with a replacement challenge for %s', async (code) => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const requestError = apiError(code)
    mocks.getCaptcha
      .mockResolvedValueOnce(challenge)
      .mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(requestError)
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: '15671628271', scene: 'change_password' }),
      onSent,
      onError,
    })
    await flow.openCaptcha()
    flow.captchaX.value = 124

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(requestError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(flow.captchaDialogVisible.value).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(replacementChallenge)
    expect(flow.captchaX.value).toBe(replacementChallenge.tile_x)
    expect(flow.sending.value).toBe(false)
  })

  it.each([
    ['channel_unavailable', 'business'],
    ['http.network', 'network'],
    ['dependency.sms', 'dependency'],
  ] as const)('resets without refreshing after %s', async (code, kind) => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const requestError = apiError(code, kind)
    mocks.sendCode.mockRejectedValueOnce(requestError)
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: '15671628271', scene: 'change_password' }),
      onSent,
      onError,
    })
    await flow.openCaptcha()
    flow.captchaX.value = 124

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(requestError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
    expect(flow.captchaX.value).toBe(0)
    expect(flow.sending.value).toBe(false)
  })

  it('does not infer a captcha retry from a localized Error message', async () => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const requestError = new Error('验证码错误或已过期')
    mocks.sendCode.mockRejectedValueOnce(requestError)
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: '15671628271', scene: 'change_password' }),
      onSent,
      onError,
    })
    await flow.openCaptcha()
    flow.captchaX.value = 124

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(requestError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
    expect(flow.captchaX.value).toBe(0)
  })

  it('closes an empty verifier when its first captcha fetch fails', async () => {
    const onError = vi.fn()
    const fetchError = apiError('http.network', 'network')
    mocks.getCaptcha.mockRejectedValueOnce(fetchError)
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: 'user@example.com', scene: 'bind_email' }),
      onSent: vi.fn(),
      onError,
    })
    flow.captchaDialogVisible.value = true

    const loaded = await flow.refreshCaptcha()

    expect(loaded).toBe(false)
    expect(onError).toHaveBeenCalledWith(fetchError, 'captcha')
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
    expect(flow.captchaX.value).toBe(0)
    expect(flow.captchaLoading.value).toBe(false)
  })

  it('closes the verifier when fetching a replacement challenge fails', async () => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const sendError = apiError('captcha.invalid_or_expired')
    const fetchError = apiError('dependency.captcha', 'dependency')
    mocks.getCaptcha
      .mockResolvedValueOnce(challenge)
      .mockRejectedValueOnce(fetchError)
    mocks.sendCode.mockRejectedValueOnce(sendError)
    const flow = useCaptchaSendCode({
      buildRequest: () => ({ account: '15671628271', scene: 'change_password' }),
      onSent,
      onError,
    })
    await flow.openCaptcha()
    flow.captchaX.value = 124

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenNthCalledWith(1, sendError, 'send')
    expect(onError).toHaveBeenNthCalledWith(2, fetchError, 'captcha')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
    expect(flow.captchaX.value).toBe(0)
    expect(flow.captchaLoading.value).toBe(false)
    expect(flow.sending.value).toBe(false)
  })
})
