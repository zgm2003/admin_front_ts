import { computed, shallowRef, type Ref } from 'vue'
import type { SlideCaptchaChallenge } from '@/types/captcha'

interface LoginCaptchaLifecycleOptions {
  enabled: Readonly<Ref<boolean>>
  loadChallenge: () => Promise<SlideCaptchaChallenge>
  onLoadError: (error: unknown) => void
}

export function useLoginCaptchaLifecycle(options: LoginCaptchaLifecycleOptions) {
  const captchaChallenge = shallowRef<SlideCaptchaChallenge | null>(null)
  const captchaX = shallowRef(0)
  const captchaLoading = shallowRef(false)
  const captchaDialogOpen = shallowRef(false)
  let generation = 0

  const clearChallenge = () => {
    captchaChallenge.value = null
    captchaX.value = 0
  }

  const resetCaptchaDialog = () => {
    generation++
    captchaLoading.value = false
    captchaDialogOpen.value = false
    clearChallenge()
  }

  const captchaDialogVisible = computed({
    get: () => captchaDialogOpen.value,
    set: (visible: boolean) => {
      if (visible) captchaDialogOpen.value = true
      else resetCaptchaDialog()
    },
  })

  const refreshCaptcha = async (): Promise<boolean> => {
    if (!options.enabled.value) return false
    const requestGeneration = ++generation
    clearChallenge()
    captchaLoading.value = true
    try {
      const challenge = await options.loadChallenge()
      if (requestGeneration !== generation) return false
      captchaChallenge.value = challenge
      captchaX.value = challenge.tile_x
      return true
    } catch (error: unknown) {
      if (requestGeneration !== generation) return false
      try {
        options.onLoadError(error)
      } finally {
        resetCaptchaDialog()
      }
      return false
    } finally {
      if (requestGeneration === generation) captchaLoading.value = false
    }
  }

  const openCaptchaDialog = async (): Promise<boolean> => {
    captchaDialogOpen.value = true
    return refreshCaptcha()
  }

  return {
    captchaChallenge,
    captchaX,
    captchaLoading,
    captchaDialogVisible,
    openCaptchaDialog,
    refreshCaptcha,
    resetCaptchaDialog,
    captureGeneration: () => generation,
    isCurrentGeneration: (value: number) => value === generation,
  }
}
