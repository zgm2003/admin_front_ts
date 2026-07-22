import { computed, shallowRef } from 'vue'
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
  const captchaDialogOpen = shallowRef(false)
  const sending = shallowRef(false)
  const pendingRequest = shallowRef<UserSendCodeContext | null>(null)
  let captchaRequestGeneration = 0

  const clearChallenge = () => {
    captchaChallenge.value = null
    captchaX.value = 0
  }

  const resetCaptcha = () => {
    captchaRequestGeneration++
    captchaLoading.value = false
    captchaDialogOpen.value = false
    pendingRequest.value = null
    clearChallenge()
  }

  const captchaDialogVisible = computed({
    get: () => captchaDialogOpen.value,
    set: (visible: boolean) => {
      if (visible) captchaDialogOpen.value = true
      else resetCaptcha()
    },
  })

  const refreshCaptcha = async (): Promise<boolean> => {
    const requestGeneration = ++captchaRequestGeneration
    clearChallenge()
    captchaLoading.value = true
    try {
      const challenge = await UsersApi.getCaptcha()
      if (requestGeneration !== captchaRequestGeneration) return false
      captchaChallenge.value = challenge
      captchaX.value = challenge.tile_x
      return true
    } catch (error: unknown) {
      if (requestGeneration !== captchaRequestGeneration) return false
      try {
        options.onError?.(error, 'captcha')
      } finally {
        resetCaptcha()
      }
      return false
    } finally {
      if (requestGeneration === captchaRequestGeneration) {
        captchaLoading.value = false
      }
    }
  }

  const openCaptcha = async () => {
    if (sending.value) return
    const request = options.buildRequest()
    if (!request || !isSendCodeAccountValid(request.account, request.scene)) return

    pendingRequest.value = request
    captchaDialogOpen.value = true
    await refreshCaptcha()
  }

  const completeCaptcha = async () => {
    if (sending.value) return
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
      try {
        options.onError?.(error, 'send')
      } finally {
        if (isCaptchaChallengeError(error)) {
          await refreshCaptcha()
        } else {
          resetCaptcha()
        }
      }
      return
    } finally {
      sending.value = false
    }

    try {
      options.onSent()
    } finally {
      resetCaptcha()
    }
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
