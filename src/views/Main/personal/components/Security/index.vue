<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElNotification} from 'element-plus'
import {UsersApi} from '@/api/user/users.ts'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {Iphone, Lock, Message} from "@element-plus/icons-vue"
import SendCode from '@/components/SendCode'

const props = defineProps<{
  userinfo: {
    phone: string
    email: string
    has_password: boolean
  }
  verifyTypeArr: Array<{label: string, value: string}>
}>()

const emit = defineEmits(['refresh'])

const {t} = useI18n()
const isMobile = useIsMobile()

// ============ 手机号修改 ============
const phoneForm = ref({phone: '', code: ''})
const phoneLoading = ref(false)

const savePhone = () => {
  if (!phoneForm.value.phone || !phoneForm.value.code) {
    ElNotification.warning(t('personal.security.warning.fillComplete'))
    return
  }
  phoneLoading.value = true
  UsersApi.updatePhone(phoneForm.value).then(() => {
    phoneLoading.value = false
    ElNotification.success(t('common.success.operation'))
    phoneForm.value = {phone: '', code: ''}
    emit('refresh')
  }).catch(() => { phoneLoading.value = false })
}

// ============ 邮箱修改 ============
const emailForm = ref({email: '', code: ''})
const emailLoading = ref(false)

const saveEmail = () => {
  if (!emailForm.value.email || !emailForm.value.code) {
    ElNotification.warning(t('personal.security.warning.fillComplete'))
    return
  }
  emailLoading.value = true
  UsersApi.updateEmail(emailForm.value).then(() => {
    emailLoading.value = false
    ElNotification.success(t('common.success.operation'))
    emailForm.value = {email: '', code: ''}
    emit('refresh')
  }).catch(() => { emailLoading.value = false })
}

// ============ 密码设置/修改 ============
const passwordDialogVisible = ref(false)
const passwordForm = ref({old_password: '', new_password: '', confirm_password: '', code: ''})
const passwordLoading = ref(false)
const verifyType = ref<'password' | 'code'>('password')
const canUsePassword = computed(() => props.userinfo.has_password)
const passwordAccount = computed(() => props.userinfo.email || props.userinfo.phone)

const openPasswordDialog = () => {
  passwordForm.value = {old_password: '', new_password: '', confirm_password: '', code: ''}
  verifyType.value = props.userinfo.has_password ? 'password' : 'code'
  passwordDialogVisible.value = true
}

const switchVerifyType = () => {
  verifyType.value = verifyType.value === 'password' ? 'code' : 'password'
  passwordForm.value.old_password = ''
  passwordForm.value.code = ''
}

const savePassword = () => {
  if (!passwordForm.value.new_password || !passwordForm.value.confirm_password) {
    ElNotification.warning(t('personal.security.warning.enterNewPassword'))
    return
  }
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    ElNotification.warning(t('personal.security.warning.passwordNotMatch'))
    return
  }
  if (passwordForm.value.new_password.length < 6) {
    ElNotification.warning(t('personal.security.warning.passwordMinLength'))
    return
  }
  if (verifyType.value === 'password' && !passwordForm.value.old_password) {
    ElNotification.warning(t('personal.security.warning.enterOldPassword'))
    return
  }
  if (verifyType.value === 'code' && !passwordForm.value.code) {
    ElNotification.warning(t('personal.security.warning.enterCode'))
    return
  }

  passwordLoading.value = true
  UsersApi.updatePassword({
    verify_type: verifyType.value,
    old_password: passwordForm.value.old_password,
    code: passwordForm.value.code,
    new_password: passwordForm.value.new_password,
    confirm_password: passwordForm.value.confirm_password
  }).then(() => {
    passwordLoading.value = false
    ElNotification.success(t('common.success.operation'))
    passwordDialogVisible.value = false
    emit('refresh')
  }).catch(() => { passwordLoading.value = false })
}
</script>

<template>
  <div class="security-section">
    <!-- 手机号绑定 -->
    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Iphone/></el-icon>
          <span class="title">{{ t('personal.security.phone') }}</span>
          <el-tag v-if="userinfo.phone" type="success" size="small">{{ t('personal.security.bound') }}</el-tag>
          <el-tag v-else type="info" size="small">{{ t('personal.security.unbound') }}</el-tag>
        </div>
        <div class="item-value" v-if="!isMobile">{{ userinfo.phone || t('personal.security.notBound') }}</div>
      </div>
      <div class="item-value-mobile" v-if="isMobile">{{ userinfo.phone || t('personal.security.notBound') }}</div>
      <el-collapse>
        <el-collapse-item name="phone">
          <template #title>
            <el-button type="primary" link>{{ userinfo.phone ? t('personal.security.changePhone') : t('personal.security.bindPhone') }}</el-button>
          </template>
          <el-form :model="phoneForm" label-width="80px" v-loading="phoneLoading" class="security-form">
            <el-form-item :label="t('personal.security.newPhone')">
              <el-input v-model="phoneForm.phone" :placeholder="t('personal.security.newPhonePlaceholder')" clearable/>
            </el-form-item>
            <el-form-item :label="t('personal.security.code')">
              <SendCode v-model="phoneForm.code" :account="phoneForm.phone" scene="bind_phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePhone">{{ t('personal.security.save') }}</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-divider/>

    <!-- 邮箱绑定 -->
    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Message/></el-icon>
          <span class="title">{{ t('personal.security.email') }}</span>
          <el-tag v-if="userinfo.email" type="success" size="small">{{ t('personal.security.bound') }}</el-tag>
          <el-tag v-else type="info" size="small">{{ t('personal.security.unbound') }}</el-tag>
        </div>
        <div class="item-value" v-if="!isMobile">{{ userinfo.email || t('personal.security.notBound') }}</div>
      </div>
      <div class="item-value-mobile" v-if="isMobile">{{ userinfo.email || t('personal.security.notBound') }}</div>
      <el-collapse>
        <el-collapse-item name="email">
          <template #title>
            <el-button type="primary" link>{{ userinfo.email ? t('personal.security.changeEmail') : t('personal.security.bindEmail') }}</el-button>
          </template>
          <el-form :model="emailForm" label-width="80px" v-loading="emailLoading" class="security-form">
            <el-form-item :label="t('personal.security.newEmail')">
              <el-input v-model="emailForm.email" :placeholder="t('personal.security.newEmailPlaceholder')" clearable/>
            </el-form-item>
            <el-form-item :label="t('personal.security.code')">
              <SendCode v-model="emailForm.code" :account="emailForm.email" scene="bind_email" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveEmail">{{ t('personal.security.save') }}</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-divider/>

    <!-- 密码设置 -->
    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Lock/></el-icon>
          <span class="title">{{ t('personal.security.password') }}</span>
          <el-tag v-if="userinfo.has_password" type="success" size="small">{{ t('personal.set') }}</el-tag>
          <el-tag v-else type="warning" size="small">{{ t('personal.notSet') }}</el-tag>
        </div>
        <div class="item-desc" v-if="!userinfo.has_password">{{ t('personal.security.passwordTip') }}</div>
      </div>
      <el-button type="primary" link @click="openPasswordDialog">
        {{ userinfo.has_password ? t('personal.security.changePassword') : t('personal.security.setPassword') }}
      </el-button>
    </div>

    <!-- 密码设置弹窗 -->
    <el-dialog v-model="passwordDialogVisible" 
               :title="userinfo.has_password ? t('personal.security.changePassword') : t('personal.security.setPassword')" 
               width="90%" 
               :style="{maxWidth: '500px'}">
      <el-form :model="passwordForm" label-width="100px" v-loading="passwordLoading" label-position="top" class="password-form">
        <template v-if="verifyType === 'password'">
          <el-form-item :label="t('personal.security.oldPassword')">
            <el-input v-model="passwordForm.old_password" type="password" show-password 
                      :placeholder="t('personal.security.oldPasswordPlaceholder')" clearable/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" link @click="switchVerifyType">{{ t('personal.security.forgetOldPassword') }}</el-button>
          </el-form-item>
        </template>

        <template v-else>
          <el-alert type="info" :closable="false" style="margin-bottom:20px">
            {{ t('personal.security.codeSendTo') }} {{ userinfo.email || userinfo.phone }}
          </el-alert>
          <el-form-item :label="t('personal.security.code')">
            <SendCode v-model="passwordForm.code" :account="passwordAccount" scene="change_password" :send-disabled="!passwordAccount" />
          </el-form-item>
          <el-form-item v-if="canUsePassword">
            <el-button type="primary" link @click="switchVerifyType">{{ t('personal.security.rememberOldPassword') }}</el-button>
          </el-form-item>
        </template>

        <el-form-item :label="t('personal.security.newPassword')">
          <el-input v-model="passwordForm.new_password" type="password" show-password 
                    :placeholder="t('personal.security.newPasswordPlaceholder')" clearable/>
        </el-form-item>
        <el-form-item :label="t('personal.security.confirmPassword')">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password 
                    :placeholder="t('personal.security.confirmPasswordPlaceholder')" clearable/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="savePassword" :loading="passwordLoading">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.security-section {
  padding: 10px 0;
}

.security-item {
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;

    .item-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .title {
        font-weight: 500;
        font-size: 15px;
      }
    }

    .item-value {
      color: #606266;
    }

    .item-desc {
      color: #909399;
      font-size: 13px;
      width: 100%;
    }
  }

  .item-value-mobile {
    color: #606266;
    margin-bottom: 10px;
    font-size: 13px;
  }

  .security-form {
    max-width: 500px;
  }

  :deep(.el-collapse) {
    border: none;

    .el-collapse-item__header {
      border: none;
      height: 32px;
      line-height: 32px;
    }

    .el-collapse-item__wrap {
      border: none;
    }

    .el-collapse-item__content {
      padding-bottom: 0;
    }
  }
}
</style>
