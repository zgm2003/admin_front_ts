<script setup lang="ts">
import { ref, computed } from 'vue'
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
const { t } = useI18n()
const loginForm = ref({ email: '', password: '', remember: true })
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  email: [{ required: true, message: t('auth.login.email') + '为必填项', trigger: 'blur' }],
  password: [{ required: true, message: t('auth.login.password') + '为必填项', trigger: 'blur' }]
}))
const loading = ref(false)
const Login = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const param = loginForm.value
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
    <el-form :model="loginForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="t('auth.login.email')" prop="email"><el-input placeholder="请输入邮箱" v-model="loginForm.email" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.login.password')" prop="password"><el-input placeholder="请输入密码" v-model="loginForm.password" clearable show-password size="large" style="width:100%" @keydown.enter="Login" /></el-form-item>
      <el-form-item>
        <div class="one"><div class="left"><el-checkbox v-model="loginForm.remember" :label="t('auth.login.remember')" /></div><div class="right"><el-text type="primary" @click="toForgetPassword" style="cursor:pointer">{{ t('auth.login.toForget') }}</el-text></div></div>
      </el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="Login">{{ t('auth.login.submit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" size="large" @click="toRegister">{{ t('auth.login.toRegister') }}</el-button></el-form-item>
    </el-form>
  </el-card>
  </template>
<style scoped lang="less">
.loginCard{ width:100%; max-width:520px; margin:6vh auto; padding:32px; border-radius:18px; backdrop-filter:blur(12px); background:linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)); box-shadow:0 20px 60px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.6) }
:global(.dark) .loginCard{ background:linear-gradient(135deg, rgba(32,32,32,0.75), rgba(22,22,22,0.6)); border-color:rgba(255,255,255,0.08); box-shadow:0 20px 60px rgba(0,0,0,0.4) }
.one{ width:100%; display:flex; justify-content:space-between }
h2{ letter-spacing:1px; margin-bottom:18px }
@media (max-width:768px){ .loginCard{ margin:4vh auto; padding:24px; border-radius:16px } }
</style>
