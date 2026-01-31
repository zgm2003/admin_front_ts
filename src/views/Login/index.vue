<template>
  <div class="login-container" :class="{ 'is-mobile': isMobile }">
    <!-- 全局背景装饰 -->
    <div class="global-bg">
      <div class="mesh-gradient"></div>
      <div class="dot-pattern"></div>
      <div class="deco-blob blob-1"></div>
      <div class="deco-blob blob-2"></div>
      <div class="deco-blob blob-3"></div>
      <div class="deco-blob blob-4"></div>

      <!-- 漂浮的小图标装饰 -->
      <div class="floating-icons">
        <el-icon class="float-item icon-1"><Cherry /></el-icon>
        <el-icon class="float-item icon-2"><StarFilled /></el-icon>
        <el-icon class="float-item icon-3"><CircleCheckFilled /></el-icon>
        <el-icon class="float-item icon-4"><Plus /></el-icon>
        <el-icon class="float-item icon-5"><ChatDotRound /></el-icon>
        <el-icon class="float-item icon-6"><FirstAidKit /></el-icon>
        <el-icon class="float-item icon-7"><ChatDotRound /></el-icon>
        <el-icon class="float-item icon-8"><Bell /></el-icon>
        <el-icon class="float-item icon-9"><Timer /></el-icon>
        <el-icon class="float-item icon-10"><Timer /></el-icon>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 左侧 - 品牌展示区 -->
      <div v-if="!isMobile" class="brand-section">
        <div class="brand-content">
          <div class="brand-header animate-fade-in-down">
            <div class="logo-box">
              <el-image src="/logo.png" />
            </div>
            <div class="brand-info">
              <h2 class="brand-name">智澜系统</h2>
              <span class="brand-tag">ZhiLan Admin System</span>
            </div>
          </div>

          <div class="main-text animate-fade-in-up">
            <h1 class="main-title">
              科技引领<br />
              <span class="highlight">赋能企业管理</span>
            </h1>
            <p class="sub-title">
              集先进技术与智能分析于一体，提供高效、安全、可扩展的企业级解决方案。
            </p>
          </div>

          <!-- 特性卡片列表 -->
          <div class="feature-cards">
            <div
              v-for="(feature, index) in features"
              :key="feature.title"
              class="feature-card animate-slide-in"
              :style="{ animationDelay: `${(index + 2) * 0.1}s` }"
            >
              <div class="card-icon">
                <el-icon :size="24"><component :is="feature.icon" /></el-icon>
              </div>
              <div class="card-info">
                <h3 class="card-title">{{ feature.title }}</h3>
                <p class="card-desc">{{ feature.desc }}</p>
              </div>
            </div>
          </div>

          <!-- 统计数据 -->
          <div class="stat-footer animate-fade-in">
            <div v-for="stat in stats" :key="stat.label" class="stat-box">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧 - 登录表单区 -->
      <div class="form-section">
        <div :class="['form-card', 'animate-fade-in-right', { 'shake-animation': isShaking }]">
          <!-- 标题 -->
          <div class="header-text">
            <h1 class="welcome-title">欢迎回来</h1>
            <p class="welcome-desc">登录智澜系统后台，继续高效管理</p>
          </div>

          <!-- 登录方式切换 -->
          <div class="method-tabs">
            <button
              v-for="type in loginTypes"
              :key="type.value"
              type="button"
              @click="handleTabChange(type.value)"
              :class="['tab-btn', { active: activeAccountType === type.value }]"
            >
              {{ type.label }}
            </button>
          </div>

          <!-- 登录表单 -->
          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            :validate-on-rule-change="false"
            @submit.prevent="handleSubmit"
            class="login-form"
          >
            <div class="form-content-area">
              <!-- 切换容器：确保高度绝对稳定 -->
              <div class="method-container">
                <div
                  v-for="type in loginTypes"
                  :key="type.value"
                  :class="['method-content', { 'is-active': activeAccountType === type.value }]"
                >
                  <!-- 账号/邮箱/手机号输入 -->
                  <div class="input-group">
                    <label class="input-label">{{ typeConfig[type.value]?.label || '账号' }}</label>
                    <el-form-item prop="login_account">
                      <el-input
                        v-model="loginForm.login_account"
                        :placeholder="typeConfig[type.value]?.placeholder || '请输入账号'"
                        class="custom-input"
                      >
                        <template #prefix>
                          <el-icon><component :is="typeConfig[type.value]?.icon || Message" /></el-icon>
                        </template>
                      </el-input>
                    </el-form-item>
                  </div>

                  <!-- 密码或验证码输入 -->
                  <div class="input-group">
                    <template v-if="type.value === 'password'">
                      <label class="input-label">密码</label>
                      <el-form-item prop="password">
                        <el-input
                          v-model="loginForm.password"
                          :type="showPassword ? 'text' : 'password'"
                          placeholder="请输入密码"
                          class="custom-input"
                        >
                          <template #prefix><el-icon><Lock /></el-icon></template>
                          <template #suffix>
                            <div @click="showPassword = !showPassword" class="password-toggle">
                              <el-icon v-if="!showPassword"><View /></el-icon>
                              <el-icon v-else><Hide /></el-icon>
                            </div>
                          </template>
                        </el-input>
                      </el-form-item>
                    </template>
                    <template v-else>
                      <label class="input-label">验证码</label>
                      <el-form-item prop="code">
                        <SendCode
                          ref="sendCodeRefs"
                          class="login-send-code"
                          v-model="loginForm.code"
                          :account="loginForm.login_account"
                          scene="login"
                          size="large"
                          :mobile="isMobile"
                          placeholder="请输入验证码"
                        />
                      </el-form-item>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 记住我 & 忘记密码：完全物理占位 -->
              <div class="form-options">
                <el-checkbox
                  v-model="loginForm.remember"
                  label="记住我"
                  :class="{ 'is-invisible': activeAccountType !== 'password' }"
                />
                <span
                  class="forget-pwd"
                  :class="{ 'is-invisible': activeAccountType !== 'password' }"
                  @click="openForgotDialog"
                >
                  忘记密码
                </span>
              </div>
            </div>

            <el-button
              native-type="submit"
              type="primary"
              class="submit-btn"
              :loading="isSubmitting"
            >
              {{ isSubmitting ? '登录中...' : '登录' }}
            </el-button>
          </el-form>

          <!-- <p class="footer-link">
            还没有账户？
            <span class="register-link">立即注册</span>
          </p> -->

          <div class="terms-checkbox">
            <el-checkbox v-model="agreePolicy">
              我已阅读并同意
              <span class="term-btn" @click.prevent.stop="openService">服务条款</span>
              和
              <span class="term-btn" @click.prevent.stop="openPolicy">隐私政策</span>
            </el-checkbox>
          </div>

        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <el-dialog
      v-model="forgotVisible"
      title="找回密码"
      width="440px"
      append-to-body
      destroy-on-close
      class="forgot-dialog"
    >
      <div class="forgot-content">
        <!-- 步骤条 -->
        <div class="step-indicator">
          <div :class="['step-item', { active: forgotStep >= 1 }]">
            <div class="step-num">1</div>
            <span class="step-text">身份验证</span>
          </div>
          <div class="step-line"></div>
          <div :class="['step-item', { active: forgotStep >= 2 }]">
            <div class="step-num">2</div>
            <span class="step-text">重置密码</span>
          </div>
        </div>

        <!-- 步骤1: 验证 -->
        <div v-if="forgotStep === 1" class="step-content animate-fade-in">
          <div class="input-group">
            <label class="input-label">邮箱 / 手机号</label>
            <el-input v-model="forgotForm.account" placeholder="请输入邮箱或手机号" class="custom-input">
              <template #prefix><el-icon><Message /></el-icon></template>
            </el-input>
          </div>
          <div class="input-group">
            <label class="input-label">验证码</label>
            <div class="code-input-wrapper">
              <el-input v-model="forgotForm.code" placeholder="6位验证码" maxlength="6" class="custom-input flex-1">
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
              <el-button
                :disabled="forgotCountdown > 0 || isSendingCode"
                @click="sendForgotCode"
                class="code-btn"
                :type="forgotCountdown > 0 ? 'info' : 'primary'"
                :loading="isSendingCode"
                plain
              >
                {{ forgotCountdown > 0 ? `${forgotCountdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </div>
          <el-button type="primary" class="submit-btn mt-4" @click="handleForgotNext">下一步</el-button>
        </div>

        <!-- 步骤2: 重置 -->
        <div v-else class="step-content animate-fade-in">
          <div class="input-group">
            <label class="input-label">新密码</label>
            <el-input v-model="forgotForm.newPassword" type="password" placeholder="请输入新密码" show-password class="custom-input">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </div>
          <div class="input-group">
            <label class="input-label">确认密码</label>
            <el-input v-model="forgotForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password class="custom-input">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </div>
          <div class="forgot-actions">
            <el-button class="back-btn" @click="forgotStep = 1">返回上一步</el-button>
            <el-button type="primary" class="submit-btn flex-1" :loading="isForgotSubmitting" @click="handleResetPassword">
              {{ isForgotSubmitting ? '重置中...' : '提交重置' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 登录成功后的全屏过渡动画 -->
    <Transition name="fade-loading">
      <div v-if="isLoginSuccess" class="login-success-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="double-bounce1"></div>
            <div class="double-bounce2"></div>
          </div>
          <div class="loading-text">正在为您准备工作台...</div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import { ElMessage, ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/cookie'
import { setupDynamicRoutes } from '@/router'
import Cookies from 'js-cookie'
import { SendCode } from '@/components/SendCode'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  Message,
  Lock,
  View,
  Hide,
  Iphone,
  Cherry,
  CircleCheckFilled,
  Service,
  StarFilled,
  Plus,

  FirstAidKit,
  ChatDotRound,
  Bell,
  Timer
} from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const isMobile = useIsMobile()

// 登录方式配置
const typeConfig: Record<string, { label: string; icon: any; placeholder: string }> = {
  password: { label: '账号', icon: Message, placeholder: '请输入账号' },
  email: { label: '邮箱', icon: Message, placeholder: '请输入邮箱' },
  phone: { label: '手机号', icon: Iphone, placeholder: '请输入手机号' }
}

const showPassword = ref(false)
const sendCodeRefs = ref<any[]>([])

// 登录配置（来自后端）
const loginTypes = ref<Array<{ label: string; value: string }>>([])

// 服务条款勾选
const agreePolicy = ref(false)

// 表单数据
const loginForm = ref({
  login_account: '',
  password: '',
  code: '',
  remember: true
})

// 账号类型：email | phone | password（旧页面的含义：password = 账号+密码登录；email/phone = 验证码登录）
const activeAccountType = ref<string>('password')

// 当前登录参数里的 login_type
const loginType = computed(() => activeAccountType.value)

const isPasswordLogin = computed(() => activeAccountType.value === 'password')

// 表单验证规则（对齐旧页面逻辑：账号=A 动态）
const rules = computed<FormRules>(() => {
  const accountRules: FormItemRule[] = [{ required: true, message: '账号为必填项', trigger: 'blur' }]

  if (activeAccountType.value === 'email') {
    accountRules.push({ type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' })
  } else if (activeAccountType.value === 'phone') {
    accountRules.push({ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' })
  }

  const baseRules: FormRules = {}

  if (isPasswordLogin.value) {
    baseRules.login_account = accountRules
    baseRules.password = [{ required: true, message: '密码为必填项', trigger: 'blur' }]
  } else {
    baseRules.login_account = accountRules
    baseRules.code = [{ required: true, message: '验证码为必填项', trigger: 'blur' }]
  }

  return baseRules
})

watch(
  () => loginTypes.value,
  (newVal) => {
    if (!newVal || newVal.length === 0) return
    const firstType = newVal[0]
    const firstValue = firstType?.value
    if (firstValue) {
      activeAccountType.value = firstValue
    } else {
      const fallback = newVal.find(t => t.value === 'password' || t.value === 'email' || t.value === 'phone')
      activeAccountType.value = fallback?.value || 'password'
    }

    loginForm.value = { ...loginForm.value, login_account: '', password: '', code: '' }
    sendCodeRefs.value.forEach(ref => ref?.reset?.())
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

// 服务条款/隐私政策
const openService = () => {
  agreePolicy.value = true
  ElMessage.info('请在系统设置页查看服务条款')
}
const openPolicy = () => {
  agreePolicy.value = true
  ElMessage.info('请在系统设置页查看隐私政策')
}

// 忘记密码弹窗
const forgotVisible = ref(false)
const forgotStep = ref(1)
const forgotCountdown = ref(0)
const isForgotSubmitting = ref(false)
const isSendingCode = ref(false)
const forgotForm = reactive({
  account: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const openForgotDialog = () => {
  forgotVisible.value = true
  forgotStep.value = 1
  forgotForm.account = ''
  forgotForm.code = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
}

// 账号格式校验
const isValidEmail = (str: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)
const isValidPhone = (str: string) => /^1[3-9]\d{9}$/.test(str)

const sendForgotCode = async () => {
  if (!forgotForm.account) return ElMessage.warning('请输入邮箱或手机号')
  
  if (!isValidEmail(forgotForm.account) && !isValidPhone(forgotForm.account)) {
    return ElMessage.warning('请输入正确的邮箱或手机号')
  }

  isSendingCode.value = true
  try {
    await UsersApi.sendCode({ account: forgotForm.account, scene: 'forget' })
    ElMessage.success('验证码已发送')
    
    // 倒计时
    forgotCountdown.value = 60
    const timer = setInterval(() => {
      if (forgotCountdown.value <= 1) {
        clearInterval(timer)
        forgotCountdown.value = 0
      } else {
        forgotCountdown.value--
      }
    }, 1000)
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

  // 密码规则校验
  const pwd = forgotForm.newPassword
  if (pwd.length < 6 || pwd.length > 20) return ElMessage.warning('密码长度必须在6到20个字符之间')

  isForgotSubmitting.value = true
  try {
    await UsersApi.forgetPassword({
      account: forgotForm.account,
      code: forgotForm.code,
      new_password: forgotForm.newPassword,
      confirm_password: forgotForm.confirmPassword
    })
    ElMessage.success('密码重置成功，请登录')
    forgotVisible.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '重置失败')
  } finally {
    isForgotSubmitting.value = false
  }
}

// 特性展示数据
const features = [
  { icon: CircleCheckFilled, title: '安全可靠', desc: '企业级数据加密，符合国际安全标准' },
  { icon: Service, title: '高效稳定', desc: '7×24小时稳定运行，确保业务连续性' },
  { icon: StarFilled, title: '智能分析', desc: '基于大数据分析，提供智能化决策支持' }
]

const stats = [
  { value: '50万+', label: '信赖用户' },
  { value: '98.5%', label: '满意评价' },
  { value: '2,000+', label: '三甲医院' }
]

const isSubmitting = ref(false)
const isShaking = ref(false)
const isLoginSuccess = ref(false)

// 触发抖动动画
const triggerShake = () => {
  isShaking.value = true
  setTimeout(() => isShaking.value = false, 500)
}

const handleSubmit = async () => {
  if (!agreePolicy.value) return ElMessage.error('请先阅读并同意服务条款和隐私政策')

  const fieldsToValidate = loginType.value === 'password'
    ? ['login_account', 'password']
    : ['login_account', 'code']

  try {
    await formRef.value?.validateField(fieldsToValidate)
  } catch {
    triggerShake()
    return
  }

  await submitForm()
}

const submitForm = async () => {
  isSubmitting.value = true
  try {
    const param: any = {
      login_type: loginType.value,
      remember: loginForm.value.remember
    }

    if (loginType.value === 'password') {
      param.login_account = loginForm.value.login_account
      param.password = loginForm.value.password
    } else {
      param.login_account = loginForm.value.login_account
      param.code = loginForm.value.code
    }

    const data: any = await UsersApi.login(param)

    rememberPwd()
    await handleLoginSuccess(data)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 登录成功处理（复用你项目现有实现：Cookie + 动态路由）
const handleLoginSuccess = async (data: any) => {
  isLoginSuccess.value = true
  ElNotification.success('登录成功')
  clearAllCookies()

  const expires = new Date(new Date().getTime() + data.expires_in * 1000)
  Cookies.set('access_token', data.access_token, { expires })
  Cookies.set('refresh_token', data.refresh_token, { expires: 14 })

  await setupDynamicRoutes()

  // 稍微延迟一点点，让 Loading 动画有更好的感知，也给路由准备时间
  setTimeout(async () => {
    if (router.currentRoute.value.path === '/login') {
      const redirect = router.currentRoute.value.query.redirect as string
      await router.replace(redirect || '/home')
    }
  }, 800)
}

// 记住密码（仅前端记住输入，用 localStorage；不再依赖项目外的 utils/auth）
const rememberPwd = () => {
  if (loginForm.value.remember) {
    localStorage.setItem('loginRemember', '1')
    localStorage.setItem('loginAccount', loginForm.value.login_account)
  } else {
    localStorage.removeItem('loginRemember')
    localStorage.removeItem('loginAccount')
  }
}

// 从缓存获取登录表单（本文件内实现）
const getLoginFormCache = () => {
  const remember = localStorage.getItem('loginRemember') === '1'
  if (!remember) return

  loginForm.value.login_account = localStorage.getItem('loginAccount') || ''
  loginForm.value.remember = true
}

// Tab切换处理
const handleTabChange = (method: string) => {
  activeAccountType.value = method
  formRef.value?.clearValidate()

  loginForm.value.login_account = ''
  loginForm.value.password = ''
  loginForm.value.code = ''

  sendCodeRefs.value.forEach(ref => ref?.reset?.())
}

onMounted(() => {
  UsersApi.getLoginConfig().then((res: any) => {
    loginTypes.value = res?.login_type_arr || res?.data?.login_type_arr || []
  })
  getLoginFormCache()
})
</script>

<style lang="scss" scoped>
/* 核心容器 */
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color-page);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  &.is-mobile {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh; /* 动态视口高度，解决移动端地址栏问题 */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 0;
    align-items: flex-start;
  }
}

/* 全局背景装饰 - 改为 fixed 确保滚动时背景不动 */
.global-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  .mesh-gradient {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(at 0% 0%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
      radial-gradient(at 50% 100%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.06) 0px, transparent 50%);
    filter: blur(100px);
  }

  .dot-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(var(--el-color-primary) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.08;
  }

  .deco-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.5; // 稍微深一点
    animation: float 15s infinite ease-in-out;

    &.blob-1 { width: 450px; height: 450px; background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.16); top: -120px; left: -120px; }
    &.blob-2 { width: 350px; height: 350px; background: rgba(59, 130, 246, 0.08); bottom: -80px; right: -80px; }
    &.blob-3 { width: 250px; height: 250px; background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12); top: 25%; right: 15%; }
    &.blob-4 { width: 200px; height: 200px; background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.08); bottom: 30%; left: 15%; }
  }

  .floating-icons {
    .float-item {
      position: absolute;
      opacity: 0.25; // 显著加深图标
      animation: float 8s infinite ease-in-out;
      font-size: 32px;
      color: var(--el-color-primary);

      &.icon-1 { top: 12%; left: 15%; animation-delay: 0s; }
      &.icon-2 { top: 18%; right: 18%; animation-delay: 1s; }
      &.icon-3 { bottom: 25%; left: 12%; animation-delay: 2s; }
      &.icon-4 { bottom: 15%; right: 25%; animation-delay: 3s; }
      &.icon-5 { top: 45%; left: 8%; animation-delay: 4s; }
      &.icon-6 { top: 55%; right: 10%; animation-delay: 5s; }
      &.icon-7 { top: 8%; left: 45%; animation-delay: 6s; }
      &.icon-8 { bottom: 10%; left: 40%; animation-delay: 7s; }
      &.icon-9 { top: 20%; left: 35%; animation-delay: 1.5s; }
      &.icon-10 { bottom: 40%; right: 35%; animation-delay: 2.5s; }
    }
  }
}

/* 内容布局 */
.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 1280px;
  padding: 0 40px;
  align-items: center;
  justify-content: space-between;
  gap: 80px;
  margin: 0 auto;
}

.is-mobile .content-wrapper {
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
  padding: 12px;
  min-height: auto;
}

/* 左侧品牌区 - 针对小高度适配 */
.brand-section {
  flex: 1;
  color: #1f2937;

  @media (max-height: 800px) {
    transform: scale(0.9);
    transform-origin: left center;
  }
}

.brand-content {
  max-width: 560px;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;

  .logo-box {
    width: 56px;
    height: 56px;
    background: var(--el-color-primary);
    color: #ffffff;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 24px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    &:hover {
      transform: rotate(15deg) scale(1.1);
      box-shadow: 0 15px 30px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.3);
    }
  }

  .brand-name { font-size: 26px; font-weight: 800; margin: 0; color: #111827; }
  .brand-tag { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
}

.main-text {
  .main-title {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 24px;
    color: #111827;

    .highlight {
      background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
    }
  }

  .sub-title { font-size: 17px; line-height: 1.6; color: #4b5563; margin-bottom: 40px; }
}

.feature-cards {
  display: grid;
  gap: 16px;
  margin-bottom: 48px;

  .feature-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    gap: 16px;
    transition: all 0.3s;

    &:hover {
      background: #ffffff;
      transform: translateX(10px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }

    .card-icon {
      width: 44px;
      height: 44px;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .card-desc { font-size: 14px; color: #6b7280; margin: 0; }
  }
}

.stat-footer {
  display: flex;
  gap: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);

  .stat-box {
    transition: transform 0.3s ease;
    cursor: default;
    &:hover { transform: translateY(-5px); }
    .stat-value { font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .stat-label { font-size: 13px; color: #6b7280; }
  }
}

/* 右侧表单卡片 */
.form-section {
  flex-shrink: 0;
  width: 100%;
  max-width: 480px;
}

.is-mobile .form-section {
  max-width: 100%;
}

.form-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 40px;
  padding: 48px;
  border: 1px solid #ffffff;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);

  @media (max-height: 800px) {
    padding: 32px 40px;
  }
}

.is-mobile .form-card {
  padding: 24px 20px;
  border-radius: 24px;
  width: 100%;
  box-sizing: border-box;
  box-shadow:
    0 15px 30px -10px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.mobile-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  @media (min-width: 1024px) { display: none; }
  .logo-box {
    width: 64px;
    height: 64px;
    background: var(--el-color-primary);
    color: #ffffff;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  .brand-name { font-size: 24px; font-weight: 800; color: #111827; }
}

.header-text {
  margin-bottom: 32px;
  @media (max-height: 800px) {
    margin-bottom: 24px;
  }
  .welcome-title {
    font-size: 32px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 12px;
    letter-spacing: -1px;
    @media (max-height: 800px) {
      font-size: 28px;
    }
  }
  .welcome-desc { color: #6b7280; font-size: 16px; }
}

.is-mobile .header-text {
  margin-bottom: 20px;
  .welcome-title { font-size: 24px; margin-bottom: 8px; }
  .welcome-desc { font-size: 13px; }
}

.method-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 6px;
  background: #f1f5f9;
  border-radius: 14px;

  .tab-btn {
    flex: 1;
    padding: 10px 0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: 0.3s;

    &.active {
      background: #ffffff;
      color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12);
    }
  }
}

.is-mobile .method-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border-radius: 12px;

  .tab-btn {
    font-size: 13px;
    padding: 10px 0;
    border-radius: 8px;
    min-height: 40px; /* 确保触摸区域足够大 */
  }
}

.form-content-area {
  display: flex;
  flex-direction: column;
}

.method-container {
  position: relative;
  height: 176px; // 两个输入组的精确高度 (2 * (14+8+46+20)) - 20 = 172?
  // 让我们算准点：label(14)+gap(8)+input(46)+margin(20) = 88. 两个就是 176.
  margin-bottom: 20px;
}

.method-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateX(20px) scale(0.98);

  &.is-active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(0) scale(1);
    transition-delay: 0.1s;
  }
}

/* 增强表单项入场感 */
.input-group {
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(10px);
  animation: slide-up-fade 0.5s ease forwards;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }

  .input-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
    transition: color 0.3s;
  }
}

/* 重置 el-form-item 默认样式，避免影响新UI */
:deep(.el-form-item) {
  margin-bottom: 0;
}
:deep(.el-form-item__content) {
  flex-wrap: nowrap;
  display: block; /* 重置为 block，避免 flex 影响内部布局 */
}
:deep(.el-form-item__error) {
  position: absolute;
  bottom: -18px;
  left: 0;
  font-size: 12px;
}

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

:deep(.custom-input) {
  .el-input__wrapper {
    border-radius: 16px !important;
    padding: 10px 14px !important;
    background: #f8fafc !important;
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    height: 46px;
    box-sizing: border-box;

    &.is-focus {
      background: #ffffff !important;
      border-color: var(--el-color-primary) !important;
      box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.1) !important;
      transform: scale(1.01);
    }
  }
  .el-input__inner { height: 24px; }
}

.login-send-code {
  width: 100%;
}

:deep(.login-send-code .el-input__wrapper) {
  border-radius: 16px !important;
  padding: 10px 14px !important;
  background: #f8fafc !important;
  box-shadow: none !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  height: 46px;
  box-sizing: border-box;

  &.is-focus {
    background: #ffffff !important;
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.1) !important;
    transform: scale(1.01);
  }
}

:deep(.login-send-code .el-input__inner) {
  height: 24px;
}

:deep(.login-send-code .el-button) {
  height: 46px !important;
  border-radius: 16px !important;
  font-weight: 600;
}

/* 抖动动画 */
.shake-animation {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  height: 24px;

  .is-invisible {
    visibility: hidden;
    pointer-events: none;
  }

  .forget-pwd {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
    cursor: pointer;
    transition: all 0.3s;
    text-decoration: none;
    &:hover {
      color: var(--el-color-primary-dark-2);
      text-decoration: underline;
    }
  }
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
  .code-btn {
    height: 46px !important;
    border-radius: 16px !important;
    font-weight: 600;
  }
}

.submit-btn {
  width: 100%;
  height: 52px !important;
  border-radius: 16px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%) !important;
  border: none !important;
  box-shadow: 0 10px 20px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.25) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.35) !important;
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 5px 15px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2) !important;
  }
}

.is-mobile .submit-btn {
  height: 50px !important;
  border-radius: 14px !important;
  font-size: 15px !important;
}

.footer-link {
  text-align: center;
  margin-top: 32px;
  font-size: 14px;
  color: #64748b;
  .register-link {
    font-weight: 700;
    color: #10b981;
    cursor: pointer;
    transition: all 0.3s;
    text-decoration: none;
    &:hover {
      color: #059669;
      text-decoration: underline;
    }
  }
}

.terms-checkbox {
  text-align: center;
  margin-top: 32px;
  font-size: 13px;
  color: #64748b;
  
  :deep(.el-checkbox__label) {
    color: #64748b;
    font-size: 13px;
  }
  
  .term-btn {
    color: var(--el-color-primary);
    cursor: pointer;
    transition: all 0.3s;
    text-decoration: none;
    &:hover {
      color: var(--el-color-primary-dark-2);
      text-decoration: underline;
    }
  }
}

.switch-version {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
  }
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fade-in-down { animation: fade-in-down 0.4s ease-out forwards; }
.animate-fade-in-up { animation: fade-in-up 0.4s ease-out 0.1s forwards; opacity: 0; }
.animate-slide-in { animation: slide-in 0.3s ease-out forwards; opacity: 0; }
.animate-fade-in { animation: fade-in 0.5s ease-out 0.4s forwards; opacity: 0; }
.animate-fade-in-right { animation: fade-in-right 0.4s ease-out forwards; }

/* 忘记密码弹窗样式 */
:deep(.forgot-dialog) {
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  
  .el-dialog__header {
    margin: 0;
    padding: 24px 32px;
    border-bottom: 1px solid #f1f5f9;
    .el-dialog__title {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
    }
  }

  .el-dialog__body {
    padding: 32px;
  }
}

.forgot-content {
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
    gap: 12px;

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0.4;
      transition: all 0.3s;

      &.active {
        opacity: 1;
        .step-num {
          background: var(--el-color-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
        }
        .step-text { color: var(--el-color-primary); font-weight: 700; }
      }

      .step-num {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
      }
      .step-text { font-size: 12px; color: #64748b; }
    }

    .step-line {
      width: 40px;
      height: 2px;
      background: #f1f5f9;
      margin-top: -20px;
    }
  }

  .mt-4 { margin-top: 16px; }

  .forgot-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    
    .back-btn {
      height: 46px;
      border-radius: 12px;
      font-weight: 600;
      min-width: 100px;
    }
    
    .submit-btn {
      flex: 1;
      margin-top: 0 !important;
    }
  }
  
  .flex-1 { flex: 1; }
}

.login-container.is-mobile {
  .global-bg .floating-icons {
    display: none;
  }

  .global-bg .deco-blob {
    opacity: 0.3; /* 移动端减淡背景装饰 */
  }

  .method-container {
    height: auto !important; /* 移动端改为自适应高度 */
    min-height: 160px;
    position: relative;
    margin-bottom: 16px;
  }

  .method-content {
    position: relative !important; /* 移动端取消绝对定位 */
    display: none;
    
    &.is-active {
      display: block;
    }
  }

  .input-group {
    margin-bottom: 16px;
    
    .input-label {
      font-size: 13px;
      margin-bottom: 6px;
    }
  }

  .form-options {
    margin-bottom: 24px;
    height: auto;
    min-height: 24px;
  }

  .terms-checkbox {
    margin-top: 16px;
    font-size: 12px;
    
    :deep(.el-checkbox__label) {
      font-size: 12px;
      line-height: 1.4;
    }
  }

  /* 移动端输入框优化 */
  :deep(.custom-input) {
    .el-input__wrapper {
      border-radius: 12px !important;
      padding: 8px 12px !important;
      height: 44px;
    }
    .el-input__inner {
      font-size: 16px; /* 防止iOS自动缩放 */
    }
  }

  :deep(.login-send-code .el-input__wrapper) {
    border-radius: 12px !important;
    height: 44px;
  }

  :deep(.login-send-code .el-input__inner) {
    font-size: 16px;
  }

  :deep(.login-send-code .el-button) {
    height: 44px !important;
    border-radius: 12px !important;
    font-size: 13px;
    padding: 0 12px;
  }
}

/* 登录成功过渡动画样式 */
.login-success-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  position: relative;
  margin: 0 auto 24px;
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: sk-bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1.0s;
}

@keyframes sk-bounce {
  0%, 100% { transform: scale(0.0); }
  50% { transform: scale(1.0); }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 1px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.fade-loading-enter-active,
.fade-loading-leave-active {
  transition: opacity 0.5s ease;
}

.fade-loading-enter-from,
.fade-loading-leave-to {
  opacity: 0;
}

/* 移动端安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .login-container.is-mobile {
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}

/* 移动端横屏适配 */
@media (max-height: 500px) and (orientation: landscape) {
  .login-container.is-mobile {
    .form-card {
      padding: 20px 16px;
    }
    .header-text {
      margin-bottom: 16px;
      .welcome-title { font-size: 20px; }
    }
    .method-tabs {
      margin-bottom: 16px;
    }
    .form-options {
      margin-bottom: 16px;
    }
  }
}

/* 小屏手机适配 (iPhone SE等) */
@media (max-width: 375px) {
  .login-container.is-mobile {
    .form-card {
      padding: 20px 16px;
      border-radius: 20px;
    }
    .header-text {
      .welcome-title { font-size: 22px; }
      .welcome-desc { font-size: 12px; }
    }
    .method-tabs .tab-btn {
      font-size: 12px;
      padding: 8px 0;
    }
    .submit-btn {
      height: 46px !important;
    }
  }
}
</style>
