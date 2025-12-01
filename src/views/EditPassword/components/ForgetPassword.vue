<script setup>
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { forgetPasswordApi, sendCodeApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/cookie'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { useI18n } from 'vue-i18n'
const router = useRouter()
const emit = defineEmits(['to-edit'])
const { t } = useI18n()
const ForgetPasswordForm = ref({ email:'', code:'', newpassword:'', status:2 })
const loading = ref(false)
const forgetPassword = () => { const param = ForgetPasswordForm.value; loading.value = true; forgetPasswordApi(param).then(()=>{ ElNotification.success(t('common.success.editPassword')); loading.value = false; clearAllCookies(); toLogin() }).catch(()=>{ loading.value = false }) }
const toLogin = () => { router.push('/login') }
const toEdit = () => { emit('to-edit') }
const codeLoding = ref(false)
const timer = ref(0)
const sendCode = () => { if (timer.value > 0) return; codeLoding.value = true; const param = ForgetPasswordForm.value; sendCodeApi(param).then(()=>{ codeLoding.value = false; ElNotification.success(t('common.success.sendCode')); startCountdown() }).catch(()=>{ codeLoding.value = false }) }
const startCountdown = () => { timer.value = 60; const interval = setInterval(()=>{ if (timer.value > 0) timer.value--; else clearInterval(interval) }, 1000) }
const back = () => { router.go(-1) }
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.forget.title') }}</h2>
    <el-form :model="ForgetPasswordForm" label-position="top">
      <el-form-item :label="t('auth.forget.email')"><el-input placeholder="请输入邮箱" v-model="ForgetPasswordForm.email" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item><el-input :placeholder="t('auth.forget.code')" v-model="ForgetPasswordForm.code" clearable size="large" style="width:60%" /><el-button type="primary" size="large" @click="sendCode" :loading="codeLoding" :disabled="!ForgetPasswordForm.email || timer > 0">{{ timer > 0 ? t('auth.register.resend', { timer }) : t('auth.register.sendCode') }}</el-button></el-form-item>
      <el-form-item :label="t('auth.forget.newPassword')"><el-input placeholder="请输入新密码" v-model="ForgetPasswordForm.newpassword" clearable show-password size="large" style="width:100%" @keydown.enter="forgetPassword" /></el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="forgetPassword">{{ t('auth.forget.submit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" type="success" size="large" @click="toEdit" v-if="Cookies.get('token')">{{ t('auth.forget.toEdit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" size="large" @click="back">{{ t('common.back') }}</el-button></el-form-item>
    </el-form>
  </el-card>
</template>
<style scoped lang="less">
.loginCard{ width:100%; max-width:520px; margin:6vh auto; padding:32px; border-radius:18px; backdrop-filter: blur(12px); background: linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)); box-shadow: 0 20px 60px rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.6) }
:global(.dark) .loginCard{ background: linear-gradient(135deg, rgba(32,32,32,0.75), rgba(22,22,22,0.6)); border-color: rgba(255,255,255,0.08); box-shadow: 0 20px 60px rgba(0,0,0,0.4) }
.one{ width:100%; display:flex; justify-content: space-between }
h2{ letter-spacing:1px; margin-bottom:18px }
@media (max-width:768px){ .loginCard{ margin:4vh auto; padding:24px; border-radius:16px } }
</style>
