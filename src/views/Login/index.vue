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
import ParticleBackground from '@/components/ParticleBackground'

const router = useRouter()
const { t } = useI18n()

// 登录配置
const loginTypes = ref<Array<{label: string, value: string}>>([])
onMounted(() => {
  UsersApi.getLoginConfig().then((res: any) => {
    loginTypes.value = res.login_type_arr || []
  })
})

// 登录类型：email/phone 验证码登录，password 密码登录
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

// 初始化 activeTab
watch(() => loginTypes.value, (newVal) => {
  if (newVal && newVal.length > 0) {
    const firstType = newVal[0]
    if (firstType) {
      activeTab.value = firstType.value
    }
  }
}, { immediate: true })

// 验证码
const codeLoding = ref(false)
const timer = ref(0)
const sendCode = () => {
  if (timer.value > 0) return
  if (!loginForm.value.login_account) {
    ElNotification.warning('请输入账号')
    return
  }
  codeLoding.value = true
  UsersApi.sendCode({ account: loginForm.value.login_account, scene: 'login' })
    .then(() => { codeLoding.value = false; ElNotification.success(t('common.success.sendCode')); startCountdown() })
    .catch(() => { codeLoding.value = false })
}
const startCountdown = () => { 
  timer.value = 60
  const interval = setInterval(() => { 
    if (timer.value > 0) timer.value--
    else clearInterval(interval) 
  }, 1000) 
}

// 登录
const loading = ref(false)
const handleLogin = async () => {
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
      Cookies.set('refresh_token', data.refresh_token, { expires: 14 })

      setupDynamicRoutes().then(() => {
        if (router.currentRoute.value.path === '/login') {
          const redirect = router.currentRoute.value.query.redirect as string
          router.replace(redirect || '/home')
        }
      })
    })
    .catch(() => { loading.value = false })
}
</script>

<template>
  <div class="login-page">
    <ParticleBackground />
    <el-card shadow="always" class="login-card" v-loading="loading">
      <h2>{{ t('auth.login.title') }}</h2>
      <el-tabs v-if="loginTypes.length > 1" v-model="activeTab" stretch class="login-tabs">
        <el-tab-pane v-for="type in loginTypes" :key="type.value" :label="type.label" :name="type.value"/>
      </el-tabs>
      <el-form :model="loginForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
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
          <el-input placeholder="请输入密码" v-model="loginForm.password" clearable show-password size="large" @keydown.enter="handleLogin" />
        </el-form-item>

        <el-form-item v-else :label="t('auth.register.code')" prop="code">
          <div class="code-row">
            <el-input placeholder="请输入验证码" v-model="loginForm.code" clearable size="large" @keydown.enter="handleLogin" />
            <el-button type="primary" size="large" @click="sendCode" :loading="codeLoding" :disabled="!loginForm.login_account || timer > 0">
              {{ timer > 0 ? t('auth.register.resend', { timer }) : t('auth.register.sendCode') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember" :label="t('auth.login.remember')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" @click="handleLogin">
            {{ activeTab === 'password' ? t('auth.login.submit') : t('auth.login.submit') + ' / ' + t('auth.register.submit') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background:
    radial-gradient(1000px 600px at 10% 10%, #f6f9ff 0%, #eef2f9 35%, #e9edf5 100%),
    radial-gradient(800px 500px at 90% 90%, #f3f7ff 0%, #edf1f7 40%, transparent 70%),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 12px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 12px);
  background-attachment: fixed;
}

:global(.dark) .login-page {
  background:
    radial-gradient(1000px 600px at 12% 10%, #0f1218 0%, #10141a 40%, #0b0e13 100%),
    radial-gradient(900px 600px at 85% 92%, #11161d 0%, #0e1217 40%, transparent 70%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px);
}

.login-card {
  width: 100%;
  max-width: 520px;
  padding: 32px;
  border-radius: 18px;
  backdrop-filter: blur(12px);
  background: linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55));
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.6);

  h2 {
    text-align: center;
    letter-spacing: 1px;
    margin-bottom: 18px;
  }

  .login-tabs {
    margin-bottom: 16px;
  }

  .code-row {
    display: flex;
    gap: 10px;
    width: 100%;

    .el-input {
      flex: 1;
    }
  }

  .login-btn {
    width: 100%;
  }
}

:global(.dark) .login-card {
  background: linear-gradient(135deg, rgba(32,32,32,0.75), rgba(22,22,22,0.6));
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

@media (max-width: 768px) {
  .login-page {
    padding: 10px;
  }
  
  .login-card {
    padding: 24px;
    border-radius: 16px;
  }
}
</style>
