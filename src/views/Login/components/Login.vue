<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { useRouter } from 'vue-router'
import { clearAllCookies } from '@/utils/cookie'
import { setupDynamicRoutes } from '@/router'
import Cookies from 'js-cookie'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
const router = useRouter()
const emit = defineEmits(['to-register'])
const props = defineProps<{ loginTypes: Array<{label: string, value: string}> }>()
const { t } = useI18n()
const activeTab = ref<'username' | 'email' | 'phone'>('email')
const loginForm = ref({ login_account: '', password: '', code: '', remember: true })
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => {
  const accountRule = activeTab.value === 'email' 
    ? { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    : activeTab.value === 'phone'
      ? { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
      : {}
  
  // Dynamic rules based on login type
  const extraRules = activeTab.value === 'password' 
    ? { password: [{ required: true, message: t('auth.login.password') + '为必填项', trigger: 'blur' }] }
    : { code: [{ required: true, message: '验证码为必填项', trigger: 'blur' }] }

  return {
    login_account: [
      { required: true, message: t('auth.login.account') + '为必填项', trigger: 'blur' },
      accountRule
    ],
    ...extraRules
  }
})

// Initialize activeTab when props.loginTypes changes or on mount
import { watch } from 'vue'
watch(() => props.loginTypes, (newVal) => {
  if (newVal && newVal.length > 0 && !activeTab.value) {
    activeTab.value = newVal[0].value
  }
}, { immediate: true })

const codeLoding = ref(false)
const timer = ref(0)
const sendCode = () => {
  if (timer.value > 0) return
  if (!loginForm.value.login_account) {
    ElNotification.warning('请输入账号')
    return
  }
  codeLoding.value = true
  const param = {
    login_account: loginForm.value.login_account,
    // Add logic to distinguish type if needed by backend, currently backend guesses by regex or we pass type if needed? 
    // Backend sendCode uses 'login_account' and validates based on regex.
  }
  UsersApi.sendCode(param)
    .then(() => { codeLoding.value = false; ElNotification.success(t('common.success.sendCode')); startCountdown() })
    .catch(() => { codeLoding.value = false })
}
const startCountdown = () => { timer.value = 60; const interval = setInterval(() => { if (timer.value > 0) timer.value--; else clearInterval(interval) }, 1000) }

const loading = ref(false)
const Login = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const param = {
    ...loginForm.value,
    login_type: activeTab.value
  }
  loading.value = true
  UsersApi.login(param)
    .then((data: any) => {
      ElNotification.success(t('common.success.operation'))
      loading.value = false
      clearAllCookies()
      
      const expires = new Date(new Date().getTime() + data.expires_in * 1000)
      Cookies.set('access_token', data.access_token, { expires })
      Cookies.set('refresh_token', data.refresh_token, { expires: 14 }) // Refresh token 14 days

      setupDynamicRoutes().then(() => {
        if (router.currentRoute.value.path === '/login') {
          const redirect = router.currentRoute.value.query.redirect as string
          router.replace(redirect || '/home')
        }
      })
    })
    .catch(() => { loading.value = false })
}
const toRegister = () => { emit('to-register') }
const toForgetPassword = () => { router.push('/editPassword') }
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.login.title') }}</h2>
    <el-tabs v-if="loginTypes.length > 1" v-model="activeTab" stretch class="mb-4">
      <el-tab-pane v-for="type in loginTypes" :key="type.value" :label="type.label" :name="type.value"/>
    </el-tabs>
    <el-form :model="loginForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="t('auth.login.account')" prop="login_account">
        <el-input 
          :placeholder="activeTab === 'email' ? '请输入邮箱' : activeTab === 'phone' ? '请输入手机号' : '请输入邮箱或手机号'" 
          v-model="loginForm.login_account" 
          clearable 
          size="large" 
          style="width:100%" 
        >
          <template #prefix>
            <el-icon><component :is="activeTab === 'email' ? 'Message' : activeTab === 'phone' ? 'Iphone' : 'User'" /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item v-if="activeTab === 'password'" :label="t('auth.login.password')" prop="password">
        <el-input placeholder="请输入密码" v-model="loginForm.password" clearable show-password size="large" style="width:100%" @keydown.enter="Login" />
      </el-form-item>

      <el-form-item v-else label="验证码" prop="code">
        <el-input placeholder="请输入验证码" v-model="loginForm.code" clearable size="large" style="width:60%" @keydown.enter="Login" />
        <el-button type="primary" size="large" @click="sendCode" :loading="codeLoding" :disabled="!loginForm.login_account || timer > 0">{{ timer > 0 ? t('auth.register.resend', { timer }) : t('auth.register.sendCode') }}</el-button>
      </el-form-item>

      <el-form-item>
        <div class="one"><div class="left"><el-checkbox v-model="loginForm.remember" :label="t('auth.login.remember')" /></div><div class="right"><el-text type="primary" @click="toForgetPassword" style="cursor:pointer">{{ t('auth.login.toForget') }}</el-text></div></div>
      </el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="Login">{{ activeTab === 'password' ? t('auth.login.submit') : '登录 / 注册' }}</el-button></el-form-item>
    </el-form>
  </el-card>
  </template>
<style scoped lang="scss">
.loginCard{ width:100%; max-width:520px; margin:6vh auto; padding:32px; border-radius:18px; backdrop-filter:blur(12px); background:linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)); box-shadow:0 20px 60px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.6) }
:global(.dark) .loginCard{ background:linear-gradient(135deg, rgba(32,32,32,0.75), rgba(22,22,22,0.6)); border-color:rgba(255,255,255,0.08); box-shadow:0 20px 60px rgba(0,0,0,0.4) }
.one{ width:100%; display:flex; justify-content:space-between }
h2{ letter-spacing:1px; margin-bottom:18px }
.mb-4 { margin-bottom: 16px; }
@media (max-width:768px){ .loginCard{ margin:4vh auto; padding:24px; border-radius:16px } }
</style>
