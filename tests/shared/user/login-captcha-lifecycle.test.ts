import { shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginCaptchaLifecycle } from '@/views/Login/composables/useLoginCaptchaLifecycle'

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
  tile_x: 80,
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

function createLifecycle() {
  const enabled = shallowRef(true)
  const loadChallenge = vi.fn()
  const onLoadError = vi.fn()
  const lifecycle = useLoginCaptchaLifecycle({ enabled, loadChallenge, onLoadError })
  return { lifecycle, enabled, loadChallenge, onLoadError }
}

function expectReset(lifecycle: ReturnType<typeof useLoginCaptchaLifecycle>) {
  expect(lifecycle.captchaDialogVisible.value).toBe(false)
  expect(lifecycle.captchaChallenge.value).toBeNull()
  expect(lifecycle.captchaX.value).toBe(0)
  expect(lifecycle.captchaLoading.value).toBe(false)
}

describe('login captcha lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true and commits a loaded challenge', async () => {
    const { lifecycle, loadChallenge } = createLifecycle()
    loadChallenge.mockResolvedValueOnce(firstChallenge)

    const loaded = await lifecycle.refreshCaptcha()

    expect(loaded).toBe(true)
    expect(lifecycle.captchaChallenge.value).toEqual(firstChallenge)
    expect(lifecycle.captchaX.value).toBe(firstChallenge.tile_x)
    expect(lifecycle.captchaLoading.value).toBe(false)
  })

  it('reports and resets a failed initial load', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const fetchError = new Error('network unavailable')
    loadChallenge.mockRejectedValueOnce(fetchError)

    const loaded = await lifecycle.openCaptchaDialog()

    expect(loaded).toBe(false)
    expect(onLoadError).toHaveBeenCalledTimes(1)
    expect(onLoadError).toHaveBeenCalledWith(fetchError)
    expectReset(lifecycle)
  })

  it('preserves the latest challenge when an older load fails afterward', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const firstLoad = deferred<typeof firstChallenge>()
    const secondLoad = deferred<typeof replacementChallenge>()
    loadChallenge
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise)

    const refreshA = lifecycle.refreshCaptcha()
    const refreshB = lifecycle.refreshCaptcha()
    secondLoad.resolve(replacementChallenge)
    await expect(refreshB).resolves.toBe(true)
    firstLoad.reject(new Error('stale failure'))
    await expect(refreshA).resolves.toBe(false)

    expect(onLoadError).not.toHaveBeenCalled()
    expect(lifecycle.captchaChallenge.value).toEqual(replacementChallenge)
    expect(lifecycle.captchaX.value).toBe(replacementChallenge.tile_x)
    expect(lifecycle.captchaLoading.value).toBe(false)
  })

  it('ignores an older success after the latest load resets the flow', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const firstLoad = deferred<typeof firstChallenge>()
    const secondLoad = deferred<typeof replacementChallenge>()
    const latestError = new Error('captcha service failed')
    loadChallenge
      .mockImplementationOnce(() => firstLoad.promise)
      .mockImplementationOnce(() => secondLoad.promise)

    const refreshA = lifecycle.refreshCaptcha()
    const refreshB = lifecycle.refreshCaptcha()
    secondLoad.reject(latestError)
    await expect(refreshB).resolves.toBe(false)
    firstLoad.resolve(firstChallenge)
    await expect(refreshA).resolves.toBe(false)

    expect(onLoadError).toHaveBeenCalledWith(latestError)
    expectReset(lifecycle)
  })

  it('invalidates an in-flight load when reset', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const pendingLoad = deferred<typeof firstChallenge>()
    loadChallenge.mockImplementationOnce(() => pendingLoad.promise)

    const opening = lifecycle.openCaptchaDialog()
    lifecycle.resetCaptchaDialog()
    pendingLoad.resolve(firstChallenge)
    await expect(opening).resolves.toBe(false)

    expect(onLoadError).not.toHaveBeenCalled()
    expectReset(lifecycle)
  })

  it('treats a v-model close as reset and ignores an in-flight success', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const pendingLoad = deferred<typeof firstChallenge>()
    loadChallenge.mockImplementationOnce(() => pendingLoad.promise)

    const opening = lifecycle.openCaptchaDialog()
    lifecycle.captchaDialogVisible.value = false
    pendingLoad.resolve(firstChallenge)
    await expect(opening).resolves.toBe(false)

    expect(onLoadError).not.toHaveBeenCalled()
    expectReset(lifecycle)
  })

  it('treats an in-flight failure after a v-model close as stale', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const pendingLoad = deferred<typeof firstChallenge>()
    loadChallenge.mockImplementationOnce(() => pendingLoad.promise)

    const opening = lifecycle.openCaptchaDialog()
    lifecycle.captchaDialogVisible.value = false
    pendingLoad.reject(new Error('stale network failure'))
    await expect(opening).resolves.toBe(false)

    expect(onLoadError).not.toHaveBeenCalled()
    expectReset(lifecycle)
  })

  it('resets before propagating a synchronous load-error callback failure', async () => {
    const { lifecycle, loadChallenge, onLoadError } = createLifecycle()
    const callbackError = new Error('message renderer failed')
    loadChallenge.mockRejectedValueOnce(new Error('network unavailable'))
    onLoadError.mockImplementationOnce(() => { throw callbackError })

    await expect(lifecycle.openCaptchaDialog()).rejects.toBe(callbackError)

    expectReset(lifecycle)
  })
})
