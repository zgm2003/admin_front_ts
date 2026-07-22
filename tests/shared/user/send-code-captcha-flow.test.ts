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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createFlow(options: Partial<Parameters<typeof useCaptchaSendCode>[0]> = {}) {
  return useCaptchaSendCode({
    buildRequest: options.buildRequest ?? (() => ({ account: 'user@example.com', scene: 'bind_email' })),
    onSent: options.onSent ?? vi.fn(),
    onError: options.onError,
  })
}

async function openCompletedCaptcha(flow: ReturnType<typeof useCaptchaSendCode>) {
  await flow.openCaptcha()
  flow.captchaX.value = challenge.tile_x + 16
}

function expectCaptchaReset(flow: ReturnType<typeof useCaptchaSendCode>) {
  expect(flow.captchaDialogVisible.value).toBe(false)
  expect(flow.captchaChallenge.value).toBeNull()
  expect(flow.captchaX.value).toBe(0)
  expect(flow.captchaLoading.value).toBe(false)
  expect(flow.sending.value).toBe(false)
}

describe('shared send-code captcha flow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
    const flow = createFlow({ onSent })

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

  it('resets a successful send before propagating an onSent failure', async () => {
    const callbackError = new Error('sent handler failed')
    const onSent = vi.fn(() => { throw callbackError })
    const flow = createFlow({ onSent })
    await openCompletedCaptcha(flow)

    await expect(flow.completeCaptcha()).rejects.toBe(callbackError)

    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(onSent).toHaveBeenCalledTimes(1)
    expectCaptchaReset(flow)

    flow.captchaChallenge.value = challenge
    flow.captchaX.value = challenge.tile_x + 16
    await expect(flow.completeCaptcha()).resolves.toBeUndefined()
    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
  })

  it('returns true when a challenge refresh succeeds', async () => {
    const flow = createFlow()

    const loaded = await flow.refreshCaptcha()

    expect(loaded).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(challenge)
    expect(flow.captchaX.value).toBe(challenge.tile_x)
    expect(flow.captchaLoading.value).toBe(false)
  })

  it('preserves the latest open when an older captcha fetch fails afterward', async () => {
    const firstFetch = deferred<typeof challenge>()
    const secondFetch = deferred<typeof challenge>()
    const staleError = apiError('http.network', 'network')
    const onError = vi.fn()
    let requestIndex = 0
    mocks.getCaptcha
      .mockImplementationOnce(() => firstFetch.promise)
      .mockImplementationOnce(() => secondFetch.promise)
    const flow = createFlow({
      buildRequest: () => requestIndex++ === 0
        ? { account: 'first@example.com', scene: 'bind_email' }
        : { account: 'second@example.com', scene: 'bind_email' },
      onError,
    })

    const openA = flow.openCaptcha()
    const openB = flow.openCaptcha()
    secondFetch.resolve(replacementChallenge)
    await openB

    firstFetch.reject(staleError)
    await openA

    expect(onError).not.toHaveBeenCalled()
    expect(flow.captchaDialogVisible.value).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(replacementChallenge)
    expect(flow.captchaX.value).toBe(replacementChallenge.tile_x)
    expect(flow.captchaLoading.value).toBe(false)

    flow.captchaX.value = replacementChallenge.tile_x + 16
    await flow.completeCaptcha()
    expect(mocks.sendCode).toHaveBeenCalledWith({
      account: 'second@example.com',
      scene: 'bind_email',
      captcha_id: replacementChallenge.captcha_id,
      captcha_answer: {
        x: replacementChallenge.tile_x + 16,
        y: replacementChallenge.tile_y,
      },
    })
  })

  it('ignores an older captcha success after the latest fetch resets the flow', async () => {
    const firstFetch = deferred<typeof challenge>()
    const secondFetch = deferred<typeof challenge>()
    const latestError = apiError('http.network', 'network')
    const onError = vi.fn()
    mocks.getCaptcha
      .mockImplementationOnce(() => firstFetch.promise)
      .mockImplementationOnce(() => secondFetch.promise)
    const flow = createFlow({ onError })

    const openA = flow.openCaptcha()
    const openB = flow.openCaptcha()
    secondFetch.reject(latestError)
    await openB

    firstFetch.resolve(challenge)
    await openA

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(latestError, 'captcha')
    expectCaptchaReset(flow)
  })

  it('does not send before the slider has moved far enough', async () => {
    const flow = createFlow({
      buildRequest: () => ({ account: '15671628271', scene: 'bind_phone' }),
    })
    await flow.openCaptcha()
    flow.captchaX.value = 115

    await flow.completeCaptcha()

    expect(mocks.sendCode).not.toHaveBeenCalled()
    expect(flow.captchaDialogVisible.value).toBe(true)
  })

  it('ignores duplicate captcha completion while a send is pending', async () => {
    const pendingSend = deferred<void>()
    const onSent = vi.fn()
    mocks.sendCode.mockImplementationOnce(() => pendingSend.promise)
    const flow = createFlow({ onSent })
    await openCompletedCaptcha(flow)

    const firstCompletion = flow.completeCaptcha()
    const duplicateCompletion = flow.completeCaptcha()
    pendingSend.resolve()
    await Promise.all([firstCompletion, duplicateCompletion])

    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(onSent).toHaveBeenCalledTimes(1)
    expect(flow.sending.value).toBe(false)
    expect(flow.captchaDialogVisible.value).toBe(false)
  })

  it('ignores a new open while a captcha send is pending', async () => {
    const pendingSend = deferred<void>()
    const buildRequest = vi.fn(() => ({
      account: 'user@example.com',
      scene: 'bind_email' as const,
    }))
    mocks.sendCode.mockImplementationOnce(() => pendingSend.promise)
    const flow = createFlow({ buildRequest })
    await openCompletedCaptcha(flow)
    const completion = flow.completeCaptcha()

    await flow.openCaptcha()
    pendingSend.resolve()
    await completion

    expect(buildRequest).toHaveBeenCalledTimes(1)
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
    expect(flow.sending.value).toBe(false)
    expect(flow.captchaDialogVisible.value).toBe(false)
  })

  it.each(['captcha.required', 'captcha.invalid_or_expired'])(
    'keeps the verifier open with a replacement challenge for %s', async (code) => {
    const onSent = vi.fn()
    const onError = vi.fn()
    const requestError = apiError(code)
    mocks.getCaptcha
      .mockResolvedValueOnce(challenge)
      .mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(requestError)
    const flow = createFlow({ onSent, onError })
    await openCompletedCaptcha(flow)

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
    ['channel_unavailable', apiError('channel_unavailable', 'business')],
    ['http.network', apiError('http.network', 'network')],
    ['dependency.sms', apiError('dependency.sms', 'dependency')],
    ['localized Error', new Error('验证码错误或已过期')],
  ])('resets without refreshing after %s', async (_label, requestError) => {
    const onSent = vi.fn()
    const onError = vi.fn()
    mocks.sendCode.mockRejectedValueOnce(requestError)
    const flow = createFlow({ onSent, onError })
    await openCompletedCaptcha(flow)

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(requestError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expectCaptchaReset(flow)
  })

  it('closes an empty verifier when its first captcha fetch fails', async () => {
    const onError = vi.fn()
    const fetchError = apiError('http.network', 'network')
    mocks.getCaptcha.mockRejectedValueOnce(fetchError)
    const flow = createFlow({ onError })
    flow.captchaDialogVisible.value = true

    const loaded = await flow.refreshCaptcha()

    expect(loaded).toBe(false)
    expect(onError).toHaveBeenCalledWith(fetchError, 'captcha')
    expectCaptchaReset(flow)
  })

  it('resets a failed captcha fetch before propagating an onError failure', async () => {
    const fetchError = apiError('http.network', 'network')
    const callbackError = new Error('captcha error handler failed')
    const onError = vi.fn(() => { throw callbackError })
    mocks.getCaptcha.mockRejectedValueOnce(fetchError)
    const flow = createFlow({ onError })

    await expect(flow.openCaptcha()).rejects.toBe(callbackError)

    expect(onError).toHaveBeenCalledWith(fetchError, 'captcha')
    expectCaptchaReset(flow)

    flow.captchaChallenge.value = challenge
    flow.captchaX.value = challenge.tile_x + 16
    await flow.completeCaptcha()
    expect(mocks.sendCode).not.toHaveBeenCalled()
  })

  it('resets a non-captcha send failure before propagating an onError failure', async () => {
    const sendError = apiError('http.network', 'network')
    const callbackError = new Error('send error handler failed')
    const onError = vi.fn(() => { throw callbackError })
    mocks.sendCode.mockRejectedValueOnce(sendError)
    const flow = createFlow({ onError })
    await openCompletedCaptcha(flow)

    await expect(flow.completeCaptcha()).rejects.toBe(callbackError)

    expect(onError).toHaveBeenCalledWith(sendError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
    expectCaptchaReset(flow)

    flow.captchaChallenge.value = challenge
    flow.captchaX.value = challenge.tile_x + 16
    await flow.completeCaptcha()
    expect(mocks.sendCode).toHaveBeenCalledTimes(1)
  })

  it('refreshes a captcha send failure before propagating an onError failure', async () => {
    const sendError = apiError('captcha.invalid_or_expired')
    const callbackError = new Error('send error handler failed')
    const onError = vi.fn(() => { throw callbackError })
    mocks.getCaptcha
      .mockResolvedValueOnce(challenge)
      .mockResolvedValueOnce(replacementChallenge)
    mocks.sendCode.mockRejectedValueOnce(sendError)
    const flow = createFlow({ onError })
    await openCompletedCaptcha(flow)

    await expect(flow.completeCaptcha()).rejects.toBe(callbackError)

    expect(onError).toHaveBeenCalledWith(sendError, 'send')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expect(flow.captchaDialogVisible.value).toBe(true)
    expect(flow.captchaChallenge.value).toEqual(replacementChallenge)
    expect(flow.captchaX.value).toBe(replacementChallenge.tile_x)
    expect(flow.sending.value).toBe(false)
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
    const flow = createFlow({ onSent, onError })
    await openCompletedCaptcha(flow)

    await flow.completeCaptcha()

    expect(onSent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenNthCalledWith(1, sendError, 'send')
    expect(onError).toHaveBeenNthCalledWith(2, fetchError, 'captcha')
    expect(mocks.getCaptcha).toHaveBeenCalledTimes(2)
    expectCaptchaReset(flow)
  })
})
