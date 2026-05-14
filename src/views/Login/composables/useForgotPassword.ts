import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import i18n from '@/i18n'

const isValidEmail = (str: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)
const isValidPhone = (str: string) => /^1[3-9]\d{9}$/.test(str)

export function useForgotPassword() {
  const t = i18n.global.t
  const forgotVisible = ref(false)
  const forgotStep = ref(1)
  const forgotCountdown = ref(0)
  const isForgotSubmitting = ref(false)
  const isSendingCode = ref(false)
  const forgotTimer = ref<ReturnType<typeof setInterval> | null>(null)

  const forgotForm = reactive({
    account: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  })

  const clearForgotTimer = () => {
    if (forgotTimer.value) {
      clearInterval(forgotTimer.value)
      forgotTimer.value = null
    }
  }

  const startForgotCountdown = () => {
    forgotCountdown.value = 60
    clearForgotTimer()
    forgotTimer.value = setInterval(() => {
      if (forgotCountdown.value <= 1) {
        clearForgotTimer()
        forgotCountdown.value = 0
      } else {
        forgotCountdown.value--
      }
    }, 1000)
  }

  const resetForgotForm = () => {
    forgotStep.value = 1
    forgotForm.account = ''
    forgotForm.code = ''
    forgotForm.newPassword = ''
    forgotForm.confirmPassword = ''
    forgotCountdown.value = 0
    clearForgotTimer()
  }

  const openForgotDialog = () => {
    forgotVisible.value = true
    resetForgotForm()
  }

  const sendForgotCode = async () => {
    if (!forgotForm.account) return ElMessage.warning(t('forgotPassword.validation.accountRequired'))
    if (!isValidEmail(forgotForm.account) && !isValidPhone(forgotForm.account)) {
      return ElMessage.warning(t('forgotPassword.validation.accountInvalid'))
    }

    isSendingCode.value = true
    try {
      await UsersApi.sendCode({ account: forgotForm.account, scene: 'forget' })
      ElMessage.success(t('forgotPassword.validation.codeSent'))
      startForgotCountdown()
    } catch (error: any) {
      ElMessage.error(error?.message || t('forgotPassword.validation.sendFailed'))
    } finally {
      isSendingCode.value = false
    }
  }

  const handleForgotNext = () => {
    if (!forgotForm.account || !forgotForm.code) return ElMessage.warning(t('forgotPassword.validation.fullInfoRequired'))
    forgotStep.value = 2
  }

  const handleResetPassword = async () => {
    if (!forgotForm.newPassword || !forgotForm.confirmPassword) return ElMessage.warning(t('forgotPassword.validation.passwordRequired'))
    if (forgotForm.newPassword !== forgotForm.confirmPassword) return ElMessage.warning(t('forgotPassword.validation.passwordMismatch'))

    const pwd = forgotForm.newPassword
    if (pwd.length < 6 || pwd.length > 128) return ElMessage.warning(t('forgotPassword.validation.passwordLength'))

    isForgotSubmitting.value = true
    try {
      await UsersApi.forgetPassword({
        account: forgotForm.account,
        code: forgotForm.code,
        new_password: forgotForm.newPassword,
        confirm_password: forgotForm.confirmPassword,
      })
      ElMessage.success(t('forgotPassword.validation.resetSuccess'))
      forgotVisible.value = false
    } catch (error: any) {
      ElMessage.error(error?.message || t('forgotPassword.validation.resetFailed'))
    } finally {
      isForgotSubmitting.value = false
    }
  }

  watch(forgotVisible, (visible) => {
    if (!visible) resetForgotForm()
  })

  return {
    forgotVisible,
    forgotStep,
    forgotCountdown,
    isForgotSubmitting,
    isSendingCode,
    forgotForm,
    openForgotDialog,
    sendForgotCode,
    handleForgotNext,
    handleResetPassword,
  }
}
