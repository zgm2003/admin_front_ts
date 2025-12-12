<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElNotification} from 'element-plus'
import { UsersApi } from '@/api/user/users'
import {clearAllCookies} from '@/utils/cookie'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const emit = defineEmits(['to-edit', 'to-forget'])
const {t} = useI18n()
interface EditPasswordModel { password: string; newpassword: string; respassword: string }
const editPasswordForm = ref<EditPasswordModel>({password: '', newpassword: '', respassword: ''})
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  password: [{ required: true, message: t('auth.edit.oldPassword') + '为必填项', trigger: 'blur' }],
  newpassword: [{ required: true, message: t('auth.edit.newPassword') + '为必填项', trigger: 'blur' }],
  respassword: [
    { required: true, message: t('auth.edit.confirmPassword') + '为必填项', trigger: 'blur' },
    { validator: (_rule, _value, callback) => { if (editPasswordForm.value.respassword !== editPasswordForm.value.newpassword) callback(new Error('两次输入不一致')); else callback() }, trigger: 'blur' }
  ]
}))
const loading = ref(false)
const EditPassword = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    ElNotification.error(t('common.required'))
    return
  }
  const param = editPasswordForm.value
  doSubmit(param)
}
const doSubmit = (param: EditPasswordModel) => {
  loading.value = true;
  UsersApi.EditPassword(param).then(() => {
    loading.value = false;
    clearAllCookies();
    toLogin();
    ElNotification.success(t('common.success.operation'))
  }).catch(() => {
    loading.value = false
  })
}
const toLogin = () => {
  router.push('/login')
}
const toForget = () => {
  emit('to-forget')
}
const back = () => {
  router.go(-1)
}
</script>

<template>
  <el-card shadow="always" class="loginCard" v-loading="loading">
    <h2 style="text-align:center">{{ t('auth.edit.title') }}</h2>
    <el-form :model="editPasswordForm" :rules="rules" ref="formRef" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="t('auth.edit.oldPassword')" prop="password">
        <el-input placeholder="请输入原始密码" v-model="editPasswordForm.password" clearable size="large"
                  style="width:100%"/>
      </el-form-item>
      <el-form-item :label="t('auth.edit.newPassword')" prop="newpassword">
        <el-input placeholder="请输入新密码" v-model="editPasswordForm.newpassword" clearable show-password size="large"
                  style="width:100%"/>
      </el-form-item>
      <el-form-item :label="t('auth.edit.confirmPassword')" prop="respassword">
        <el-input placeholder="请输入新密码" v-model="editPasswordForm.respassword" clearable show-password size="large"
                  style="width:100%"/>
      </el-form-item>
      <el-form-item>
        <el-button style="width:100%" type="primary" size="large" @click="EditPassword">{{
            t('auth.edit.submit')
          }}
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button style="width:100%" size="large" @click="toForget">{{
            t('auth.forget.title')
          }}
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button style="width:100%" size="large" @click="back">{{ t('common.back') }}</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
<style scoped lang="less">
.loginCard {
  width: 100%;
  max-width: 520px;
  margin: 6vh auto;
  padding: 32px;
  border-radius: 18px;
  background: var(--el-card-bg-color);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color)
}

.one {
  width: 100%;
  display: flex;
  justify-content: space-between
}

h2 {
  letter-spacing: 1px;
  margin-bottom: 18px
}

@media (max-width: 768px) {
  .loginCard {
    margin: 4vh auto;
    padding: 24px;
    border-radius: 16px
  }
}
</style>
