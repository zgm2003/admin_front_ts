import { shallowRef } from 'vue'
import { UsersApi } from '@/api/user/users'
import { isCaptchaChallengeError } from '@/modules/auth/captcha-error'
import type { SlideCaptchaChallenge } from '@/types/captcha'
import type { UserScene, UserSendCodeContext } from '@/types/user'

const CAPTCHA_MIN_MOVE_OFFSET = 16
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^1[3-9]\d{9}$/

type CaptchaSendCodeStage = 'captcha' | 'send'

interface UseCaptchaSendCodeOptions {
  buildRequest: () => UserSendCodeContext | null
  onSent: () => void
  onError?: (error: unknown, stage: CaptchaSendCodeStage) => void
}

export function isSendCodeAccountValid(account: string, scene: UserScene): boolean {
  const normalized = account.trim()
  const isEmail = EMAIL_PATTERN.test(normalized)
  const isPhone = PHONE_PATTERN.test(normalized)

  if (scene === 'bind_phone') return isPhone
  if (scene === 'bind_email') return isEmail
  return isEmail || isPhone
}

export function useCaptchaSendCode(options: UseCaptchaSendCodeOptions) {
  const captchaChallenge = shallowRef<SlideCaptchaChallenge | null>(null)
  const captchaX = shallowRef(0)
  const captchaLoading = shallowRef(false)
  const captchaDialogVisible = shallowRef(false)
  const sending = shallowRef(false)
  const pendingRequest = shallowRef<UserSendCodeContext | null>(null)

  const clearChallenge = () => {
    captchaChallenge.value = null
    captchaX.value = 0
  }

  const resetCaptcha = () => {
    captchaDialogVisible.value = false
    pendingRequest.value = null
    clearChallenge()
  }

  const refreshCaptcha = async (): Promise<boolean> => {
    clearChallenge()
    captchaLoading.value = true
    try {
      const challenge = await UsersApi.getCaptcha()
      captchaChallenge.value = challenge
      captchaX.value = challenge.tile_x
      return true
    } catch (error: unknown) {
      options.onError?.(error, 'captcha')
      resetCaptcha()
      return false
    } finally {
      captchaLoading.value = false
    }
  }

  const openCaptcha = async () => {
    const request = options.buildRequest()
    if (!request || !isSendCodeAccountValid(request.account, request.scene)) return

    pendingRequest.value = request
    captchaDialogVisible.value = true
    await refreshCaptcha()
  }

  const completeCaptcha = async () => {
    const request = pendingRequest.value
    const challenge = captchaChallenge.value
    if (!request || !challenge || captchaX.value < challenge.tile_x + CAPTCHA_MIN_MOVE_OFFSET) return

    sending.value = true
    try {
      await UsersApi.sendCode({
        ...request,
        captcha_id: challenge.captcha_id,
        captcha_answer: {
          x: Math.round(captchaX.value),
          y: challenge.tile_y,
        },
      })
    } catch (error: unknown) {
      options.onError?.(error, 'send')
      if (isCaptchaChallengeError(error)) {
        await refreshCaptcha()
      } else {
        resetCaptcha()
      }
      return
    } finally {
      sending.value = false
    }

    options.onSent()
    resetCaptcha()
  }

  return {
    captchaChallenge,
    captchaX,
    captchaLoading,
    captchaDialogVisible,
    sending,
    openCaptcha,
    refreshCaptcha,
    completeCaptcha,
    resetCaptcha,
  }
}
