<script setup>
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { EditPasswordApi } from '@/api/user/users'
import { clearAllCookies } from '@/utils/cookie'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const router = useRouter()
const emit = defineEmits(['to-edit','to-forget'])
const { t } = useI18n()
const editPasswordForm = ref({ password:'', newpassword:'', respassword:'' })
const loading = ref(false)
const EditPassword = () => { const param = editPasswordForm.value; loading.value = true; EditPasswordApi(param).then(()=>{ loading.value = false; clearAllCookies(); toLogin(); ElNotification.success(t('common.success.editPassword')) }).catch(()=>{ loading.value = false }) }
const toLogin = () => { router.push('/login') }
const toForget = () => { emit('to-forget') }
const back = () => { router.go(-1) }
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.edit.title') }}</h2>
    <el-form :model="editPasswordForm" label-position="top">
      <el-form-item :label="t('auth.edit.oldPassword')"><el-input placeholder="请输入原始密码" v-model="editPasswordForm.password" clearable size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.edit.newPassword')"><el-input placeholder="请输入新密码" v-model="editPasswordForm.newpassword" clearable show-password size="large" style="width:100%" /></el-form-item>
      <el-form-item :label="t('auth.edit.confirmPassword')"><el-input placeholder="请输入新密码" v-model="editPasswordForm.respassword" clearable show-password size="large" style="width:100%" /></el-form-item>
      <el-form-item><el-button style="width:100%" type="primary" size="large" @click="EditPassword">{{ t('auth.edit.submit') }}</el-button></el-form-item>
      <el-form-item><el-button style="width:100%" type="success" size="large" @click="toForget">{{ t('auth.forget.title') }}</el-button></el-form-item>
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
