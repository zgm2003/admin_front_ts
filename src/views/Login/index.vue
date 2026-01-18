<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { useRouter } from 'vue-router'
import { clearAllCookies } from '@/utils/cookie'
import { setupDynamicRoutes } from '@/router'
import Cookies from 'js-cookie'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import SendCode from '@/components/SendCode'

const router = useRouter()
const { t } = useI18n()

// 登录配置
const loginTypes = ref<Array<{label: string, value: string}>>([])
onMounted(() => {
  UsersApi.getLoginConfig().then((res: any) => {
    loginTypes.value = res.login_type_arr || []
  })
})

// 登录类型
const activeTab = ref<string>('email')
const loginForm = ref({ login_account: '', password: '', code: '', remember: true })
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => {
  const accountRules: FormItemRule[] = [
    { required: true, message: t('auth.login.account') + '为必填项', trigger: 'blur' }
  ]
  
  if (activeTab.value === 'email') {
    accountRules.push({ type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' })
  } else if (activeTab.value === 'phone') {
    accountRules.push({ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' })
  }

  const baseRules: FormRules = { login_account: accountRules }
  
  if (activeTab.value === 'password') {
    baseRules.password = [{ required: true, message: t('auth.login.password') + '为必填项', trigger: 'blur' }]
  } else {
    baseRules.code = [{ required: true, message: '验证码为必填项', trigger: 'blur' }]
  }

  return baseRules
})

watch(() => loginTypes.value, (newVal) => {
  if (newVal && newVal.length > 0) {
    const firstType = newVal[0]
    if (firstType) activeTab.value = firstType.value
  }
}, { immediate: true })

watch(activeTab, () => {
  loginForm.value = { login_account: '', password: '', code: '', remember: loginForm.value.remember }
  sendCodeRef.value?.reset()
  formRef.value?.clearValidate()
})

const sendCodeRef = ref<InstanceType<typeof SendCode> | null>(null)

const loading = ref(false)
const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch { return }
  
  const param = { ...loginForm.value, login_type: activeTab.value }
  loading.value = true
  
  try {
    const data: any = await UsersApi.login(param)
    ElNotification.success(t('common.success.operation'))
    clearAllCookies()
    
    const expires = new Date(new Date().getTime() + data.expires_in * 1000)
    Cookies.set('access_token', data.access_token, { expires })
    Cookies.set('refresh_token', data.refresh_token, { expires: 14 })

    // 等待路由注册完成后再跳转
    await setupDynamicRoutes()
    
    if (router.currentRoute.value.path === '/login') {
      const redirect = router.currentRoute.value.query.redirect as string
      await router.replace(redirect || '/home')
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    // 确保 loading 在所有操作完成后才关闭
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page" v-loading="loading" element-loading-text="登录中...">
    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 class="brand-title">智澜管理系统</h1>
          <p class="brand-desc">高效、安全、专业的企业级管理平台</p>
        </div>
        <div class="brand-footer">
          <span>© 2024 智澜科技</span>
        </div>
      </div>
      
      <!-- 右侧登录表单 -->
      <div class="login-form-wrapper">
        <div class="login-card">
          <h2 class="login-title">{{ t('auth.login.title') }}</h2>
          <p class="login-subtitle">欢迎回来，请登录您的账户</p>
          
          <el-tabs v-if="loginTypes.length > 1" v-model="activeTab" class="login-tabs">
            <el-tab-pane v-for="type in loginTypes" :key="type.value" :label="type.label" :name="type.value"/>
          </el-tabs>
          
          <el-form :model="loginForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false" class="login-form">
            <el-form-item :label="t('auth.login.account')" prop="login_account">
              <el-input 
                :placeholder="activeTab === 'email' ? '请输入邮箱' : activeTab === 'phone' ? '请输入手机号' : '请输入邮箱或手机号'" 
                v-model="loginForm.login_account" 
                clearable 
                size="large"
              >
                <template #prefix>
                  <el-icon><component :is="activeTab === 'email' ? 'Message' : activeTab === 'phone' ? 'Iphone' : 'User'" /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item v-if="activeTab === 'password'" :label="t('auth.login.password')" prop="password">
              <el-input :placeholder="t('auth.login.passwordPlaceholder')" v-model="loginForm.password" clearable show-password size="large" @keydown.enter="handleLogin">
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-else :label="t('auth.register.code')" prop="code">
              <SendCode 
                ref="sendCodeRef"
                v-model="loginForm.code" 
                :account="loginForm.login_account" 
                scene="login"
                size="large"
                :placeholder="t('personal.security.codePlaceholder')"
                @keydown.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item class="form-options">
              <el-checkbox v-model="loginForm.remember">{{ t('auth.login.remember') }}</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" size="large" class="login-btn" @click="handleLogin">
                {{ activeTab === 'password' ? t('auth.login.submit') : t('auth.login.submit') + ' / ' + t('auth.register.submit') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page { min-height: 100vh; background: var(--el-bg-color-page); }
.login-container { display: flex; min-height: 100vh; }
.login-brand { flex: 0 0 420px; background: var(--el-color-primary); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 48px; position: relative; }
.brand-content { text-align: center; color: #fff; }
.brand-logo { width: 72px; height: 72px; background: rgba(255, 255, 255, 0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; img { width: 48px; height: 48px; object-fit: contain; } }
.brand-title { font-size: 28px; font-weight: 600; margin-bottom: 12px; letter-spacing: 1px; }
.brand-desc { font-size: 15px; opacity: 0.85; line-height: 1.6; }
.brand-footer { position: absolute; bottom: 32px; color: rgba(255, 255, 255, 0.6); font-size: 13px; }
.login-form-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; background: var(--el-bg-color); }
.login-card { width: 100%; max-width: 400px; }
.login-title { font-size: 24px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 8px; }
.login-subtitle { font-size: 14px; color: var(--el-text-color-regular); margin-bottom: 32px; }
.login-tabs { margin-bottom: 24px; }
.login-form { :deep(.el-form-item__label) { font-weight: 500; color: var(--el-text-color-primary); margin-bottom: 8px; } }
.form-options { margin-bottom: 24px; :deep(.el-form-item__content) { justify-content: space-between; } }
.login-btn { width: 100%; height: 44px; font-size: 15px; font-weight: 500; border-radius: 8px; }

@media (max-width: 992px) { .login-brand { display: none; } .login-form-wrapper { padding: 24px; } }
@media (max-width: 480px) { .login-form-wrapper { padding: 20px; } .login-card { max-width: 100%; } .login-title { font-size: 22px; } }
:global(.dark) .login-brand { background: var(--el-color-primary-dark-2); }
</style>
