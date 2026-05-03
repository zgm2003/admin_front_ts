import { ref, shallowRef, reactive, computed, watch, onMounted } from 'vue'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import { ElMessage, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import { UsersApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/storage'
import { setupDynamicRoutes } from '@/router'
import Cookies from 'js-cookie'
import type { SlideCaptchaAnswer, SlideCaptchaChallenge } from '@/types/captcha'
import type {
  LoginConfigResponse,
  UserLoginParams,
  UserLoginSession,
  UserLoginType,
} from '@/types/user'
import type { SendCode } from '@/components/SendCode'

type LoginTypeItem = { label: string; value: UserLoginType }
type SendCodeRef = InstanceType<typeof SendCode>

const LOGIN_REMEMBER_KEY = 'loginRemember'
const LOGIN_ACCOUNT_KEY = 'loginAccount'
const LOGIN_TYPE_KEY = 'loginType'
const CAPTCHA_MIN_MOVE_OFFSET = 16

export function useLoginForm() {
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const sendCodeRef = ref<SendCodeRef | null>(null)
  const loginTypes = ref<LoginTypeItem[]>([])
  const captchaChallenge = shallowRef<SlideCaptchaChallenge | null>(null)
  const captchaX = shallowRef(0)
  const captchaEnabled = shallowRef(false)
  const captchaLoading = shallowRef(false)
  const captchaDialogVisible = shallowRef(false)

  const loginForm = reactive({
    login_account: '',
    password: '',
    code: '',
    remember: true,
  })

  const activeAccountType = ref<UserLoginType>('password')
  const showPassword = ref(false)
  const agreePolicy = ref(false)
  const isSubmitting = ref(false)
  const isShaking = ref(false)
  const isLoginSuccess = ref(false)
  const rememberedLoginType = ref<UserLoginType | null>(null)
  const hasRememberedAccount = ref(false)

  const loginType = computed<UserLoginType>(() => activeAccountType.value)
  const isPasswordLogin = computed(() => activeAccountType.value === 'password')

  const rules = computed<FormRules>(() => {
    const accountRules: FormItemRule[] = [{ required: true, message: '账号为必填项', trigger: 'blur' }]

    if (activeAccountType.value === 'email') {
      accountRules.push({ type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' })
    } else if (activeAccountType.value === 'phone') {
      accountRules.push({ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' })
    }

    const baseRules: FormRules = { login_account: accountRules }

    if (isPasswordLogin.value) {
      baseRules.password = [{ required: true, message: '密码为必填项', trigger: 'blur' }]
    } else {
      baseRules.code = [{ required: true, message: '验证码为必填项', trigger: 'blur' }]
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
    options: { closeCaptchaOnSuccess?: boolean; refreshCaptchaOnFailure?: boolean } = {},
  ) => {
    isSubmitting.value = true
    try {
      const data = await UsersApi.login(params)
      if (options.closeCaptchaOnSuccess) {
        captchaDialogVisible.value = false
      }
      rememberPwd()
      await handleLoginSuccess(data)
    } catch (error) {
      console.error('登录失败:', error)
      if (options.refreshCaptchaOnFailure) {
        await refreshCaptcha()
      }
    } finally {
      isSubmitting.value = false
    }
  }

  const openCaptchaDialog = async () => {
    captchaDialogVisible.value = true
    try {
      await refreshCaptcha()
    } catch (error) {
      console.error('验证码加载失败:', error)
      ElMessage.error('验证码加载失败，请重试')
    }
  }

  const handleSubmit = async () => {
    if (!agreePolicy.value) return ElMessage.error('请先阅读并同意服务条款和隐私政策')

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
        ElMessage.error('密码登录验证码配置异常')
        triggerShake()
        return
      }
      await openCaptchaDialog()
      return
    }

    await submitLogin({ login_type: currentLoginType, login_account: account, code: loginForm.code })
  }

  const completeCaptchaLogin = async () => {
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
      { closeCaptchaOnSuccess: true, refreshCaptchaOnFailure: true },
    )
  }

  const handleLoginSuccess = async (data: UserLoginSession) => {
    isLoginSuccess.value = true
    ElNotification.success('登录成功')
    clearAllCookies()

    if (loginForm.remember) {
      const expires = new Date(Date.now() + data.expires_in * 1000)
      const refreshExpires = new Date(Date.now() + data.refresh_expires_in * 1000)
      Cookies.set('access_token', data.access_token, { expires })
      Cookies.set('refresh_token', data.refresh_token, { expires: refreshExpires })
    } else {
      Cookies.set('access_token', data.access_token)
      Cookies.set('refresh_token', data.refresh_token)
    }

    await setupDynamicRoutes()

    setTimeout(async () => {
      if (router.currentRoute.value.path === '/login') {
        const redirect = router.currentRoute.value.query.redirect as string
        await router.replace(redirect || '/home')
      }
    }, 800)
  }

  const rememberPwd = () => {
    if (loginForm.remember) {
      localStorage.setItem(LOGIN_REMEMBER_KEY, '1')
      localStorage.setItem(LOGIN_ACCOUNT_KEY, loginForm.login_account)
      localStorage.setItem(LOGIN_TYPE_KEY, activeAccountType.value)
    } else {
      localStorage.removeItem(LOGIN_REMEMBER_KEY)
      localStorage.removeItem(LOGIN_ACCOUNT_KEY)
      localStorage.removeItem(LOGIN_TYPE_KEY)
    }
  }

  const getLoginFormCache = () => {
    if (localStorage.getItem(LOGIN_REMEMBER_KEY) !== '1') {
      hasRememberedAccount.value = false
      rememberedLoginType.value = null
      return
    }

    loginForm.login_account = localStorage.getItem(LOGIN_ACCOUNT_KEY) || ''
    loginForm.remember = true

    hasRememberedAccount.value = Boolean(loginForm.login_account)

    const cachedType = localStorage.getItem(LOGIN_TYPE_KEY)
    if (cachedType === 'password' || cachedType === 'email' || cachedType === 'phone') {
      rememberedLoginType.value = cachedType
    } else {
      rememberedLoginType.value = null
    }
  }

  const handleTabChange = (method: UserLoginType) => {
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
    agreePolicy.value = true
    ElMessage.info('请在系统设置页查看服务条款')
  }

  const openPolicy = () => {
    agreePolicy.value = true
    ElMessage.info('请在系统设置页查看隐私政策')
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
    isSubmitting,
    isShaking,
    isLoginSuccess,
    isPasswordLogin,
    rules,
    handleSubmit,
    completeCaptchaLogin,
    handleTabChange,
    refreshCaptcha,
    setFormRef,
    setSendCodeRef,
    openService,
    openPolicy,
  }
}
