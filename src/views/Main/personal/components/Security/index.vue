<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { Iphone, Lock, Message } from '@element-plus/icons-vue'
import { SendCode } from '@/components/SendCode'
import { UsersApi } from '@/api/user/users.ts'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { UserPersonalInfo, UserVerifyType } from '@/types/user'

const props = defineProps<{
  userinfo: Pick<UserPersonalInfo, 'phone' | 'email' | 'has_password'>
  verifyTypeArr: Array<DictOption<UserVerifyType>>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const phoneForm = ref({ phone: '', code: '' })
const phoneLoading = ref(false)

const savePhone = async () => {
  if (!phoneForm.value.phone || !phoneForm.value.code) {
    ElNotification.warning(t('personal.security.warning.fillComplete'))
    return
  }

  phoneLoading.value = true
  try {
    await UsersApi.updatePhone(phoneForm.value)
    ElNotification.success(t('common.success.operation'))
    phoneForm.value = { phone: '', code: '' }
    emit('refresh')
  } finally {
    phoneLoading.value = false
  }
}

const emailForm = ref({ email: '', code: '' })
const emailLoading = ref(false)

const saveEmail = async () => {
  if (!emailForm.value.email || !emailForm.value.code) {
    ElNotification.warning(t('personal.security.warning.fillComplete'))
    return
  }

  emailLoading.value = true
  try {
    await UsersApi.updateEmail(emailForm.value)
    ElNotification.success(t('common.success.operation'))
    emailForm.value = { email: '', code: '' }
    emit('refresh')
  } finally {
    emailLoading.value = false
  }
}

const passwordDialogVisible = ref(false)
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
  code: '',
})
const passwordLoading = ref(false)
const availableVerifyTypes = computed(() => props.verifyTypeArr.map((item) => item.value))
const canUsePasswordVerify = computed(() => props.userinfo.has_password && availableVerifyTypes.value.includes('password'))
const canUseCodeVerify = computed(() => availableVerifyTypes.value.includes('code'))
const verifyType = ref<UserVerifyType>('password')
const passwordAccount = computed(() => props.userinfo.email || props.userinfo.phone)

const openPasswordDialog = () => {
  passwordForm.value = {
    old_password: '',
    new_password: '',
    confirm_password: '',
    code: '',
  }

  verifyType.value = canUsePasswordVerify.value ? 'password' : 'code'
  passwordDialogVisible.value = true
}

const switchVerifyType = () => {
  if (!canUsePasswordVerify.value || !canUseCodeVerify.value) {
    return
  }

  verifyType.value = verifyType.value === 'password' ? 'code' : 'password'
  passwordForm.value.old_password = ''
  passwordForm.value.code = ''
}

const savePassword = async () => {
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

  passwordLoading.value = true
  try {
    if (verifyType.value === 'password') {
      if (!passwordForm.value.old_password) {
        ElNotification.warning(t('personal.security.warning.enterOldPassword'))
        return
      }

      await UsersApi.updatePassword({
        verify_type: 'password',
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password,
        confirm_password: passwordForm.value.confirm_password,
      })
    } else {
      if (!passwordForm.value.code) {
        ElNotification.warning(t('personal.security.warning.enterCode'))
        return
      }

      await UsersApi.updatePassword({
        verify_type: 'code',
        code: passwordForm.value.code,
        new_password: passwordForm.value.new_password,
        confirm_password: passwordForm.value.confirm_password,
      })
    }

    ElNotification.success(t('common.success.operation'))
    passwordDialogVisible.value = false
    emit('refresh')
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="security-section">
    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Iphone /></el-icon>
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
              <el-input v-model="phoneForm.phone" :placeholder="t('personal.security.newPhonePlaceholder')" clearable />
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

    <el-divider />

    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Message /></el-icon>
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
              <el-input v-model="emailForm.email" :placeholder="t('personal.security.newEmailPlaceholder')" clearable />
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

    <el-divider />

    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Lock /></el-icon>
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

    <el-dialog
      v-model="passwordDialogVisible"
      :title="userinfo.has_password ? t('personal.security.changePassword') : t('personal.security.setPassword')"
      width="90%"
      :style="{ maxWidth: '500px' }"
    >
      <el-form :model="passwordForm" label-width="100px" v-loading="passwordLoading" label-position="top" class="password-form">
        <template v-if="verifyType === 'password'">
          <el-form-item :label="t('personal.security.oldPassword')">
            <el-input
              v-model="passwordForm.old_password"
              type="password"
              show-password
              :placeholder="t('personal.security.oldPasswordPlaceholder')"
              clearable
            />
          </el-form-item>
          <el-form-item v-if="canUseCodeVerify">
            <el-button type="primary" link @click="switchVerifyType">{{ t('personal.security.forgetOldPassword') }}</el-button>
          </el-form-item>
        </template>

        <template v-else>
          <el-alert type="info" :closable="false" style="margin-bottom: 20px">
            {{ t('personal.security.codeSendTo') }} {{ userinfo.email || userinfo.phone }}
          </el-alert>
          <el-form-item :label="t('personal.security.code')">
            <SendCode
              v-model="passwordForm.code"
              :account="passwordAccount"
              scene="change_password"
              :send-disabled="!passwordAccount"
            />
          </el-form-item>
          <el-form-item v-if="canUsePasswordVerify">
            <el-button type="primary" link @click="switchVerifyType">{{ t('personal.security.rememberOldPassword') }}</el-button>
          </el-form-item>
        </template>

        <el-form-item :label="t('personal.security.newPassword')">
          <el-input
            v-model="passwordForm.new_password"
            type="password"
            show-password
            :placeholder="t('personal.security.newPasswordPlaceholder')"
            clearable
          />
        </el-form-item>
        <el-form-item :label="t('personal.security.confirmPassword')">
          <el-input
            v-model="passwordForm.confirm_password"
            type="password"
            show-password
            :placeholder="t('personal.security.confirmPasswordPlaceholder')"
            clearable
          />
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
