import { computed, ref, type Ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { UsersApi } from '@/api/user/users.ts'
import { useIsMobile } from '@/hooks/useResponsive'
import type { DictOption } from '@/types/common'
import type { UserPersonalInfo, UserVerifyType } from '@/types/user'

type SecurityUserInfo = Pick<UserPersonalInfo, 'phone' | 'email' | 'has_password'>

export function useSecuritySettings(
  userinfo: Readonly<Ref<SecurityUserInfo>>,
  verifyTypeArr: Readonly<Ref<Array<DictOption<UserVerifyType>>>>,
  refresh: () => void,
) {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  const phoneForm = ref({ phone: '', code: '' })
  const phoneLoading = ref(false)
  const isPhoneSendDisabled = computed(() => !/^1[3-9]\d{9}$/.test(phoneForm.value.phone.trim()))
  const emailForm = ref({ email: '', code: '' })
  const emailLoading = ref(false)
  const isEmailSendDisabled = computed(() => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email.trim()))
  const passwordDialogVisible = ref(false)
  const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '', code: '' })
  const passwordLoading = ref(false)
  const availableVerifyTypes = computed(() => verifyTypeArr.value.map((item) => item.value))
  const canUsePasswordVerify = computed(() => (
    userinfo.value.has_password && availableVerifyTypes.value.includes('password')
  ))
  const canUseCodeVerify = computed(() => availableVerifyTypes.value.includes('code'))
  const verifyType = ref<UserVerifyType>('password')
  const passwordAccount = computed(() => userinfo.value.email || userinfo.value.phone)

  async function savePhone() {
    if (!phoneForm.value.phone || !phoneForm.value.code) {
      ElNotification.warning(t('personal.security.warning.fillComplete'))
      return
    }
    phoneLoading.value = true
    try {
      await UsersApi.updatePhone(phoneForm.value)
      ElNotification.success(t('common.success.operation'))
      phoneForm.value = { phone: '', code: '' }
      refresh()
    } finally {
      phoneLoading.value = false
    }
  }

  async function saveEmail() {
    if (!emailForm.value.email || !emailForm.value.code) {
      ElNotification.warning(t('personal.security.warning.fillComplete'))
      return
    }
    emailLoading.value = true
    try {
      await UsersApi.updateEmail(emailForm.value)
      ElNotification.success(t('common.success.operation'))
      emailForm.value = { email: '', code: '' }
      refresh()
    } finally {
      emailLoading.value = false
    }
  }

  function openPasswordDialog() {
    passwordForm.value = { old_password: '', new_password: '', confirm_password: '', code: '' }
    verifyType.value = canUsePasswordVerify.value ? 'password' : 'code'
    passwordDialogVisible.value = true
  }

  function switchVerifyType() {
    if (!canUsePasswordVerify.value || !canUseCodeVerify.value) return
    verifyType.value = verifyType.value === 'password' ? 'code' : 'password'
    passwordForm.value.old_password = ''
    passwordForm.value.code = ''
  }

  async function savePassword() {
    if (!passwordForm.value.new_password || !passwordForm.value.confirm_password) {
      ElNotification.warning(t('personal.security.warning.enterNewPassword'))
      return
    }
    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
      ElNotification.warning(t('personal.security.warning.passwordNotMatch'))
      return
    }
    if (passwordForm.value.new_password.length < 6) {
      ElNotification.warning(t('personal.security.warning.passwordMinLength'))
      return
    }

    passwordLoading.value = true
    try {
      if (verifyType.value === 'password') {
        if (!passwordForm.value.old_password) {
          ElNotification.warning(t('personal.security.warning.enterOldPassword'))
          return
        }
        await UsersApi.updatePassword({
          verify_type: 'password',
          old_password: passwordForm.value.old_password,
          new_password: passwordForm.value.new_password,
          confirm_password: passwordForm.value.confirm_password,
        })
      } else {
        if (!passwordForm.value.code) {
          ElNotification.warning(t('personal.security.warning.enterCode'))
          return
        }
        await UsersApi.updatePassword({
          verify_type: 'code',
          account: passwordAccount.value,
          code: passwordForm.value.code,
          new_password: passwordForm.value.new_password,
          confirm_password: passwordForm.value.confirm_password,
        })
      }
      ElNotification.success(t('common.success.operation'))
      passwordDialogVisible.value = false
      refresh()
    } finally {
      passwordLoading.value = false
    }
  }

  return {
    t, isMobile, phoneForm, phoneLoading, isPhoneSendDisabled, savePhone,
    emailForm, emailLoading, isEmailSendDisabled, saveEmail,
    passwordDialogVisible, passwordForm, passwordLoading, passwordAccount,
    canUsePasswordVerify, canUseCodeVerify, verifyType,
    openPasswordDialog, switchVerifyType, savePassword,
  }
}
