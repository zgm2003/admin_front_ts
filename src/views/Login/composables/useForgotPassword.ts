import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UsersApi } from '@/api/user/users'

const isValidEmail = (str: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)
const isValidPhone = (str: string) => /^1[3-9]\d{9}$/.test(str)

export function useForgotPassword() {
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
    if (!forgotForm.account) return ElMessage.warning('请输入邮箱或手机号')
    if (!isValidEmail(forgotForm.account) && !isValidPhone(forgotForm.account)) {
      return ElMessage.warning('请输入正确的邮箱或手机号')
    }

    isSendingCode.value = true
    try {
      await UsersApi.sendCode({ account: forgotForm.account, scene: 'forget' })
      ElMessage.success('验证码已发送')
      startForgotCountdown()
    } catch (error: any) {
      ElMessage.error(error?.message || '发送失败')
    } finally {
      isSendingCode.value = false
    }
  }

  const handleForgotNext = () => {
    if (!forgotForm.account || !forgotForm.code) return ElMessage.warning('请填写完整信息')
    forgotStep.value = 2
  }

  const handleResetPassword = async () => {
    if (!forgotForm.newPassword || !forgotForm.confirmPassword) return ElMessage.warning('请填写新密码')
    if (forgotForm.newPassword !== forgotForm.confirmPassword) return ElMessage.warning('确认密码与新密码不一致')

    const pwd = forgotForm.newPassword
    if (pwd.length < 6 || pwd.length > 20) return ElMessage.warning('密码长度必须在6到20个字符之间')

    isForgotSubmitting.value = true
    try {
      await UsersApi.forgetPassword({
        account: forgotForm.account,
        code: forgotForm.code,
        new_password: forgotForm.newPassword,
        confirm_password: forgotForm.confirmPassword,
      })
      ElMessage.success('密码重置成功，请登录')
      forgotVisible.value = false
    } catch (error: any) {
      ElMessage.error(error?.message || '重置失败')
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
