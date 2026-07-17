import { reactive, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import i18n from '@/i18n'

function requireRequestErrorMessage(error: unknown, operation: 'reset'): string {
  if (!(error instanceof Error)) {
    throw new Error(`forgot password ${operation} failed with non-Error reason`)
  }

  const message = error.message.trim()
  if (message.length === 0) {
    throw new Error(`forgot password ${operation} error message must be non-empty`)
  }

  return message
}

export function useForgotPassword() {
  const t = i18n.global.t
  const forgotVisible = shallowRef(false)
  const forgotStep = shallowRef(1)
  const isForgotSubmitting = shallowRef(false)

  const forgotForm = reactive({
    account: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  })

  const resetForgotForm = () => {
    forgotStep.value = 1
    forgotForm.account = ''
    forgotForm.code = ''
    forgotForm.newPassword = ''
    forgotForm.confirmPassword = ''
  }

  const openForgotDialog = () => {
    forgotVisible.value = true
    resetForgotForm()
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
    } catch (error: unknown) {
      ElMessage.error(requireRequestErrorMessage(error, 'reset'))
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
    isForgotSubmitting,
    forgotForm,
    openForgotDialog,
    handleForgotNext,
    handleResetPassword,
  }
}
