<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/cookie'
import { useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
const router = useRouter()
const emit = defineEmits(['to-edit'])
const { t } = useI18n()
interface ForgetPasswordModel { email: string; code: string; newpassword: string; status: number }
const ForgetPasswordForm = ref<ForgetPasswordModel>({ email:'', code:'', newpassword:'', status:2 })
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  email: [{ required: true, message: t('auth.forget.email') + '为必填项', trigger: 'blur' }],
  code: [{ required: true, message: t('auth.forget.code') + '为必填项', trigger: 'blur' }],
  newpassword: [{ required: true, message: t('auth.forget.newPassword') + '为必填项', trigger: 'blur' }]
}))
const loading = ref(false)
const forgetPassword = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElNotification.error(t('common.required'))
    return
  }
  const param = ForgetPasswordForm.value
  doSubmit(param)
}
const doSubmit = (param: ForgetPasswordModel) => { loading.value = true; UsersApi.forgetPassword(param).then(()=>{ ElNotification.success(t('common.success.operation')); loading.value = false; clearAllCookies(); toLogin() }).catch(()=>{ loading.value = false }) }
const toLogin = () => { router.push('/login') }
const toEdit = () => { emit('to-edit') }
const codeLoding = ref(false)
const timer = ref(0)
const sendCode = () => { if (timer.value > 0) return; codeLoding.value = true; const param = ForgetPasswordForm.value; UsersApi.sendCode(param).then(()=>{ codeLoding.value = false; ElNotification.success(t('common.success.sendCode')); startCountdown() }).catch(()=>{ codeLoding.value = false }) }
const startCountdown = () => { timer.value = 60; const interval = setInterval(()=>{ if (timer.value > 0) timer.value--; else clearInterval(interval) }, 1000) }
const back = () => { router.go(-1) }
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.forget.title') }}</h2>
    <el-form :model="ForgetPasswordForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="t('auth.forget.email')" prop="email"><el-input placeholder="请输入邮箱" v-model="ForgetPasswordForm.email" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item prop="code"><el-input :placeholder="t('auth.forget.code')" v-model="ForgetPasswordForm.code" clearable size="large" style="width:60%" /><el-button type="primary" size="large" @click="sendCode" :loading="codeLoding" :disabled="!ForgetPasswordForm.email || timer > 0">{{ timer > 0 ? t('auth.register.resend', { timer }) : t('auth.register.sendCode') }}</el-button></el-form-item>
      <el-form-item :label="t('auth.forget.newPassword')" prop="newpassword"><el-input placeholder="请输入新密码" v-model="ForgetPasswordForm.newpassword" clearable show-password size="large" style="width:100%" @keydown.enter="forgetPassword" /></el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="forgetPassword">{{ t('auth.forget.submit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" size="large" @click="toEdit" v-if="Cookies.get('token')">{{ t('auth.forget.toEdit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" size="large" @click="back">{{ t('common.back') }}</el-button></el-form-item>
    </el-form>
  </el-card>
</template>
<style scoped lang="scss">
.loginCard{ width:100%; max-width:520px; margin:6vh auto; padding:32px; border-radius:18px; background: var(--el-card-bg-color); box-shadow: var(--el-box-shadow-light); border:1px solid var(--el-border-color) }
.one{ width:100%; display:flex; justify-content: space-between }
h2{ letter-spacing:1px; margin-bottom:18px }
@media (max-width:768px){ .loginCard{ margin:4vh auto; padding:24px; border-radius:16px } }
</style>
