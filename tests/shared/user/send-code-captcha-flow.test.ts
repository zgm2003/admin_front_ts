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

  it('does not mark the send successful when the API rejects it', async () => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const requestError = new Error('send failed')
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
    expect(flow.captchaDialogVisible.value).toBe(false)
    expect(flow.captchaChallenge.value).toBeNull()
  })
})
