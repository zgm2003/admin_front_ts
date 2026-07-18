import { ref, shallowRef, reactive, computed, watch, onMounted } from 'vue'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import { ElMessage, ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { useAppKernel } from '@/app/injection'
import {
  readDevicePreferences,
  writeDevicePreferences,
} from '@/modules/persistence/preferences'
import i18n from '@/i18n'
import type { SlideCaptchaAnswer, SlideCaptchaChallenge } from '@/types/captcha'
import type {
  LoginConfigResponse,
  UserLoginParams,
  UserLoginType,
} from '@/types/user'
import type { SendCode } from '@/components/SendCode'

type LoginTypeItem = { label: string; value: UserLoginType }
type SendCodeRef = InstanceType<typeof SendCode>
type CaptchaAction = 'password-login' | 'send-code'

const CAPTCHA_MIN_MOVE_OFFSET = 16

export function useLoginForm() {
  const kernel = useAppKernel()
  const t = i18n.global.t
  const formRef = ref<FormInstance>()
  const sendCodeRef = ref<SendCodeRef | null>(null)
  const loginTypes = ref<LoginTypeItem[]>([])
  const captchaChallenge = shallowRef<SlideCaptchaChallenge | null>(null)
  const captchaX = shallowRef(0)
  const captchaEnabled = shallowRef(false)
  const captchaLoading = shallowRef(false)
  const captchaDialogVisible = shallowRef(false)
  const captchaAction = shallowRef<CaptchaAction | null>(null)

  const loginForm = reactive({
    login_account: '',
    password: '',
    code: '',
    remember: true,
  })

  const activeAccountType = ref<UserLoginType>('password')
  const showPassword = ref(false)
  const agreePolicy = ref(false)
  const policyConfirmVisible = ref(false)
  let policySubmitPending = false
  const isSubmitting = ref(false)
  const isSendingCode = ref(false)
  const isShaking = ref(false)
  const isLoginSuccess = ref(false)
  const rememberedLoginType = ref<UserLoginType | null>(null)
  const hasRememberedAccount = ref(false)

  const loginType = computed<UserLoginType>(() => activeAccountType.value)
  const isPasswordLogin = computed(() => activeAccountType.value === 'password')
  const isCaptchaSubmitting = computed(() => isSubmitting.value || isSendingCode.value)

  const rules = computed<FormRules>(() => {
    const accountRules: FormItemRule[] = [{ required: true, message: t('login.validation.accountRequired'), trigger: 'blur' }]

    if (activeAccountType.value === 'email') {
      accountRules.push({ type: 'email' as const, message: t('login.validation.emailInvalid'), trigger: 'blur' })
    } else if (activeAccountType.value === 'phone') {
      accountRules.push({ pattern: /^1[3-9]\d{9}$/, message: t('login.validation.phoneInvalid'), trigger: 'blur' })
    }

    const baseRules: FormRules = { login_account: accountRules }

    if (isPasswordLogin.value) {
      baseRules.password = [{ required: true, message: t('login.validation.passwordRequired'), trigger: 'blur' }]
    } else {
      baseRules.code = [{ required: true, message: t('login.validation.codeRequired'), trigger: 'blur' }]
    }

    return baseRules
  })

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isValidPhone = (value: string) => /^1[3-9]\d{9}$/.test(value)
  const isAllowedType = (types: LoginTypeItem[], type: UserLoginType) => types.some(item => item.value === type)
  const hasCompletedCaptcha = computed(() => {
    const challenge = captchaChallenge.value
    if (!challenge) return false
    return captchaX.value >= challenge.tile_x + CAPTCHA_MIN_MOVE_OFFSET
  })

  const resetLoginForm = ({ preserveAccount = false }: { preserveAccount?: boolean } = {}) => {
    const nextAccount = preserveAccount ? loginForm.login_account : ''
    loginForm.login_account = nextAccount
    loginForm.password = ''
    loginForm.code = ''
    const challenge = captchaChallenge.value
    captchaX.value = challenge ? challenge.tile_x : 0
    sendCodeRef.value?.reset?.()
    formRef.value?.clearValidate()
  }

  const resolveActiveType = (types: LoginTypeItem[]): UserLoginType => {
    if (!types.length) return 'password'
    return types[0]?.value || 'password'
  }

  const resolveRememberedType = (types: LoginTypeItem[]): UserLoginType | null => {
    if (!hasRememberedAccount.value || !loginForm.login_account) return null

    if (rememberedLoginType.value && isAllowedType(types, rememberedLoginType.value)) {
      return rememberedLoginType.value
    }

    if (isValidEmail(loginForm.login_account) && isAllowedType(types, 'email')) {
      return 'email'
    }

    if (isValidPhone(loginForm.login_account) && isAllowedType(types, 'phone')) {
      return 'phone'
    }

    if (isAllowedType(types, 'password')) {
      return 'password'
    }

    return null
  }

  watch(
    () => loginTypes.value,
    (types) => {
      if (!types.length) return
      const rememberedType = resolveRememberedType(types)
      const nextType = rememberedType ?? resolveActiveType(types)
      activeAccountType.value = nextType
      resetLoginForm({ preserveAccount: Boolean(rememberedType) })
    },
    { immediate: true },
  )

  const triggerShake = () => {
    isShaking.value = true
    setTimeout(() => (isShaking.value = false), 500)
  }

  const refreshCaptcha = async () => {
    if (!captchaEnabled.value) return
    captchaChallenge.value = null
    captchaX.value = 0
    captchaLoading.value = true
    try {
      const challenge = await UsersApi.getCaptcha()
      captchaChallenge.value = challenge
      captchaX.value = challenge.tile_x
    } finally {
      captchaLoading.value = false
    }
  }

  const buildCaptchaAnswer = (): { captcha_id: string; captcha_answer: SlideCaptchaAnswer } | null => {
    const challenge = captchaChallenge.value
    if (!challenge || !hasCompletedCaptcha.value) {
      return null
    }
    return {
      captcha_id: challenge.captcha_id,
      captcha_answer: {
        x: Math.round(captchaX.value),
        y: challenge.tile_y,
      },
    }
  }

  const submitLogin = async (
    params: UserLoginParams,
    options: { closeCaptchaAfterAttempt?: boolean; refreshCaptchaOnFailure?: boolean } = {},
  ) => {
    isSubmitting.value = true
    try {
      await kernel.login(params)
      rememberPwd()
      isLoginSuccess.value = true
      ElNotification.success(t('login.validation.loginSuccess'))
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : t('common.fail.login')
      ElMessage.error(message)
      if (options.refreshCaptchaOnFailure) {
        await refreshCaptcha()
      }
    } finally {
      if (options.closeCaptchaAfterAttempt) {
        captchaDialogVisible.value = false
      }
      isSubmitting.value = false
    }
  }

  const openCaptchaDialog = async (action: CaptchaAction) => {
    captchaAction.value = action
    captchaDialogVisible.value = true
    try {
      await refreshCaptcha()
    } catch (error) {
      console.error('captcha load failed:', error)
      ElMessage.error(t('login.validation.captchaLoadFailed'))
    }
  }

  const continueSubmit = async () => {
    const currentLoginType = loginType.value
    const fieldsToValidate = currentLoginType === 'password'
      ? ['login_account', 'password']
      : ['login_account', 'code']

    try {
      await formRef.value?.validateField(fieldsToValidate)
    } catch {
      triggerShake()
      return
    }

    const account = loginForm.login_account.trim()
    if (currentLoginType === 'password') {
      if (!captchaEnabled.value) {
        ElMessage.error(t('login.validation.passwordCaptchaConfigInvalid'))
        triggerShake()
        return
      }
      await openCaptchaDialog('password-login')
      return
    }

    await submitLogin({ login_type: currentLoginType, login_account: account, code: loginForm.code })
  }

  const handleSubmit = async () => {
    if (!agreePolicy.value) {
      policySubmitPending = true
      policyConfirmVisible.value = true
      return
    }

    await continueSubmit()
  }

  const confirmPolicyAndContinue = async () => {
    if (!policySubmitPending) return

    policySubmitPending = false
    agreePolicy.value = true
    policyConfirmVisible.value = false
    await continueSubmit()
  }

  const cancelPolicyConfirmation = () => {
    policySubmitPending = false
    policyConfirmVisible.value = false
  }

  const requestLoginCode = async () => {
    const currentLoginType = loginType.value
    if (currentLoginType !== 'email' && currentLoginType !== 'phone') {
      return
    }

    try {
      await formRef.value?.validateField('login_account')
    } catch {
      triggerShake()
      return
    }

    const account = loginForm.login_account.trim()
    const isValidAccount = currentLoginType === 'email' ? isValidEmail(account) : isValidPhone(account)
    if (!isValidAccount) {
      triggerShake()
      return
    }
    if (!captchaEnabled.value) {
      ElMessage.error(t('login.validation.captchaConfigInvalid'))
      triggerShake()
      return
    }

    await openCaptchaDialog('send-code')
  }

  const completeCaptchaSendCode = async () => {
    const captchaPayload = buildCaptchaAnswer()
    const currentLoginType = loginType.value
    if (!captchaPayload || (currentLoginType !== 'email' && currentLoginType !== 'phone')) {
      return
    }

    isSendingCode.value = true
    try {
      await UsersApi.sendCode({
        account: loginForm.login_account.trim(),
        scene: 'login',
        login_type: currentLoginType,
        captcha_id: captchaPayload.captcha_id,
        captcha_answer: captchaPayload.captcha_answer,
      })
      sendCodeRef.value?.completeSend?.()
      captchaDialogVisible.value = false
      captchaAction.value = null
      captchaChallenge.value = null
      captchaX.value = 0
    } catch (error) {
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : t('common.fail.operation')
      ElMessage.error(message)
      await refreshCaptcha()
    } finally {
      isSendingCode.value = false
    }
  }

  const completeCaptchaLogin = async () => {
    if (captchaAction.value === 'send-code') {
      await completeCaptchaSendCode()
      return
    }

    const captchaPayload = buildCaptchaAnswer()
    if (!captchaPayload) {
      return
    }

    await submitLogin(
      {
        login_type: 'password',
        login_account: loginForm.login_account.trim(),
        password: loginForm.password,
        captcha_id: captchaPayload.captcha_id,
        captcha_answer: captchaPayload.captcha_answer,
      },
      { closeCaptchaAfterAttempt: true, refreshCaptchaOnFailure: true },
    )
  }

  const rememberPwd = () => {
    const current = readDevicePreferences(kernel.persistence)
    if (loginForm.remember) {
      writeDevicePreferences(kernel.persistence, {
        ...current,
        rememberedLogin: {
          account: loginForm.login_account.trim(),
          type: activeAccountType.value,
        },
      })
    } else {
      const withoutRememberedLogin = { ...current }
      delete withoutRememberedLogin.rememberedLogin
      writeDevicePreferences(kernel.persistence, withoutRememberedLogin)
    }
  }

  const getLoginFormCache = () => {
    const remembered = readDevicePreferences(kernel.persistence).rememberedLogin
    if (!remembered) {
      hasRememberedAccount.value = false
      rememberedLoginType.value = null
      return
    }

    loginForm.login_account = remembered.account
    loginForm.remember = true
    hasRememberedAccount.value = Boolean(loginForm.login_account)
    rememberedLoginType.value = remembered.type
  }

  const handleTabChange = (method: UserLoginType) => {
    captchaDialogVisible.value = false
    captchaAction.value = null
    activeAccountType.value = method
    resetLoginForm()
  }

  const setFormRef = (instance: FormInstance | null | undefined) => {
    formRef.value = instance ?? undefined
  }

  const setSendCodeRef = (instance: SendCodeRef | null) => {
    sendCodeRef.value = instance
  }

  const openService = () => {
    ElMessage.info(t('login.validation.termsHint'))
  }

  const openPolicy = () => {
    ElMessage.info(t('login.validation.privacyHint'))
  }

  onMounted(async () => {
    getLoginFormCache()
    const res: LoginConfigResponse = await UsersApi.getLoginConfig()
    loginTypes.value = res.login_type_arr
    captchaEnabled.value = res.captcha_enabled
  })

  return {
    loginTypes,
    loginForm,
    captchaChallenge,
    captchaX,
    captchaEnabled,
    captchaLoading,
    captchaDialogVisible,
    activeAccountType,
    showPassword,
    agreePolicy,
    policyConfirmVisible,
    isSubmitting,
    isSendingCode,
    isCaptchaSubmitting,
    isShaking,
    isLoginSuccess,
    isPasswordLogin,
    rules,
    handleSubmit,
    confirmPolicyAndContinue,
    cancelPolicyConfirmation,
    requestLoginCode,
    completeCaptchaLogin,
    handleTabChange,
    refreshCaptcha,
    setFormRef,
    setSendCodeRef,
    openService,
    openPolicy,
  }
}
