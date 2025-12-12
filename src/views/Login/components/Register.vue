<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/cookie'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { setupDynamicRoutes } from '@/router'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
const router = useRouter()
const emit = defineEmits(['to-login'])
const { t } = useI18n()
const toLogin = () => { emit('to-login') }
const registerForm = ref({ username:'', email:'', password:'', respassword:'', code:'', status:1 })
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.register.username') + '为必填项', trigger: 'blur' }],
  email: [{ required: true, message: t('auth.register.email') + '为必填项', trigger: 'blur' }],
  password: [{ required: true, message: t('auth.register.password') + '为必填项', trigger: 'blur' }],
  respassword: [
    { required: true, message: t('auth.register.confirmPassword') + '为必填项', trigger: 'blur' },
    { validator: (_r, _v, cb) => { if (registerForm.value.respassword !== registerForm.value.password) cb(new Error('两次输入不一致')); else cb() }, trigger: 'blur' }
  ],
  code: [{ required: true, message: t('auth.register.code') + '为必填项', trigger: 'blur' }]
}))
const loading = ref(false)
const Register = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElNotification.error(t('common.required'))
    return
  }
  const param = registerForm.value
  loading.value = true
  UsersApi.register(param)
    .then((data: any) => {
      ElNotification.success(t('common.success.operation'))
      loading.value = false
      clearAllCookies()
      Cookies.set('token', data.token, { expires: 7 })
      setupDynamicRoutes().then(() => { if (router.currentRoute.value.path === '/login') router.replace('/home') })
    })
    .catch(() => { loading.value = false })
}
const codeLoding = ref(false)
const timer = ref(0)
const sendCode = () => {
  if (timer.value > 0) return
  codeLoding.value = true
  const param = registerForm.value as any
  UsersApi.sendCode(param)
    .then(() => { codeLoding.value = false; ElNotification.success(t('common.success.sendCode')); startCountdown() })
    .catch(() => { codeLoding.value = false })
}
const startCountdown = () => { timer.value = 60; const interval = setInterval(() => { if (timer.value > 0) timer.value--; else clearInterval(interval) }, 1000) }
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.register.title') }}</h2>
    <el-form :model="registerForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="t('auth.register.username')" prop="username"><el-input placeholder="请输入用户名" v-model="registerForm.username" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.register.email')" prop="email"><el-input placeholder="请输入邮箱" v-model="registerForm.email" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.register.password')" prop="password"><el-input placeholder="请输入密码" v-model="registerForm.password" clearable show-password size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.register.confirmPassword')" prop="respassword"><el-input placeholder="请输入密码" v-model="registerForm.respassword" clearable show-password size="large" style="width:100%" /></el-form-item>
      <el-form-item prop="code">
        <el-input :placeholder="t('auth.register.code')" v-model="registerForm.code" clearable size="large" style="width:60%" />
        <el-button type="primary" size="large" @click="sendCode" :loading="codeLoding" :disabled="!registerForm.email || timer > 0">{{ timer > 0 ? t('auth.register.resend', { timer }) : t('auth.register.sendCode') }}</el-button>
      </el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="Register">{{ t('auth.register.submit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" size="large" @click="toLogin">{{ t('auth.register.toLogin') }}</el-button></el-form-item>
    </el-form>
  </el-card>
  </template>
<style scoped lang="less">
.loginCard{ width:100%; max-width:560px; margin:6vh auto; padding:32px; border-radius:18px; backdrop-filter:blur(12px); background:linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)); box-shadow:0 20px 60px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.6) }
:global(.dark) .loginCard{ background:linear-gradient(135deg, rgba(32,32,32,0.75), rgba(22,22,22,0.6)); border-color:rgba(255,255,255,0.08); box-shadow:0 20px 60px rgba(0,0,0,0.4) }
.one{ width:100%; display:flex; justify-content:space-between }
h2{ letter-spacing:1px; margin-bottom:18px }
@media (max-width:768px){ .loginCard{ margin:4vh auto; padding:24px; border-radius:16px } }
</style>
