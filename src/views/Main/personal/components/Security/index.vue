<script setup lang="ts">
import { toRefs } from 'vue'
import { Iphone, Lock, Message } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { SendCode } from '@/components/SendCode'
import type { DictOption } from '@/types/common'
import type { UserPersonalInfo, UserVerifyType } from '@/types/user'
import { useSecuritySettings } from './use-security-settings'

const props = defineProps<{
  userinfo: Pick<UserPersonalInfo, 'phone' | 'email' | 'has_password'>
  verifyTypeArr: Array<DictOption<UserVerifyType>>
}>()
const emit = defineEmits<{ refresh: [] }>()
const { userinfo, verifyTypeArr } = toRefs(props)
const {
  t, isMobile, phoneForm, phoneLoading, isPhoneSendDisabled, savePhone,
  emailForm, emailLoading, isEmailSendDisabled, saveEmail,
  passwordDialogVisible, passwordForm, passwordLoading, passwordAccount,
  canUsePasswordVerify, canUseCodeVerify, verifyType,
  openPasswordDialog, switchVerifyType, savePassword,
} = useSecuritySettings(userinfo, verifyTypeArr, () => emit('refresh'))
</script>

<template>
  <div class="security-section">
    <div class="security-item">
      <div class="item-header">
        <div class="item-info">
          <el-icon><Iphone /></el-icon>
          <span class="title">{{ t('personal.security.phone') }}</span>
          <el-tag
            v-if="userinfo.phone"
            type="success"
            size="small"
          >
            {{ t('personal.security.bound') }}
          </el-tag>
          <el-tag
            v-else
            type="info"
            size="small"
          >
            {{ t('personal.security.unbound') }}
          </el-tag>
        </div>
        <div
          v-if="!isMobile"
          class="item-value"
        >
          {{ userinfo.phone || t('personal.security.notBound') }}
        </div>
      </div>
      <div
        v-if="isMobile"
        class="item-value-mobile"
      >
        {{ userinfo.phone || t('personal.security.notBound') }}
      </div>
      <el-collapse>
        <el-collapse-item name="phone">
          <template #title>
            <el-button
              type="primary"
              link
            >
              {{ userinfo.phone ? t('personal.security.changePhone') : t('personal.security.bindPhone') }}
            </el-button>
          </template>
          <el-form
            v-loading="phoneLoading"
            :model="phoneForm"
            label-width="80px"
            class="security-form"
          >
            <el-form-item :label="t('personal.security.newPhone')">
              <el-input
                v-model="phoneForm.phone"
                :placeholder="t('personal.security.newPhonePlaceholder')"
                clearable
              />
            </el-form-item>
            <el-form-item :label="t('personal.security.code')">
              <SendCode
                v-model="phoneForm.code"
                :account="phoneForm.phone"
                scene="bind_phone"
                :send-disabled="isPhoneSendDisabled"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="savePhone"
              >
                {{ t('personal.security.save') }}
              </el-button>
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
          <el-tag
            v-if="userinfo.email"
            type="success"
            size="small"
          >
            {{ t('personal.security.bound') }}
          </el-tag>
          <el-tag
            v-else
            type="info"
            size="small"
          >
            {{ t('personal.security.unbound') }}
          </el-tag>
        </div>
        <div
          v-if="!isMobile"
          class="item-value"
        >
          {{ userinfo.email || t('personal.security.notBound') }}
        </div>
      </div>
      <div
        v-if="isMobile"
        class="item-value-mobile"
      >
        {{ userinfo.email || t('personal.security.notBound') }}
      </div>
      <el-collapse>
        <el-collapse-item name="email">
          <template #title>
            <el-button
              type="primary"
              link
            >
              {{ userinfo.email ? t('personal.security.changeEmail') : t('personal.security.bindEmail') }}
            </el-button>
          </template>
          <el-form
            v-loading="emailLoading"
            :model="emailForm"
            label-width="80px"
            class="security-form"
          >
            <el-form-item :label="t('personal.security.newEmail')">
              <el-input
                v-model="emailForm.email"
                :placeholder="t('personal.security.newEmailPlaceholder')"
                clearable
              />
            </el-form-item>
            <el-form-item :label="t('personal.security.code')">
              <SendCode
                v-model="emailForm.code"
                :account="emailForm.email"
                scene="bind_email"
                :send-disabled="isEmailSendDisabled"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="saveEmail"
              >
                {{ t('personal.security.save') }}
              </el-button>
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
          <el-tag
            v-if="userinfo.has_password"
            type="success"
            size="small"
          >
            {{ t('personal.set') }}
          </el-tag>
          <el-tag
            v-else
            type="warning"
            size="small"
          >
            {{ t('personal.notSet') }}
          </el-tag>
        </div>
        <div
          v-if="!userinfo.has_password"
          class="item-desc"
        >
          {{ t('personal.security.passwordTip') }}
        </div>
      </div>
      <el-button
        type="primary"
        link
        @click="openPasswordDialog"
      >
        {{ userinfo.has_password ? t('personal.security.changePassword') : t('personal.security.setPassword') }}
      </el-button>
    </div>

    <AppDialog
      v-model="passwordDialogVisible"
      :title="userinfo.has_password ? t('personal.security.changePassword') : t('personal.security.setPassword')"
      width="90%"
      :style="{ maxWidth: '500px' }"
    >
      <el-form
        v-loading="passwordLoading"
        :model="passwordForm"
        label-width="100px"
        label-position="top"
        class="password-form"
      >
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
            <el-button
              type="primary"
              link
              @click="switchVerifyType"
            >
              {{ t('personal.security.forgetOldPassword') }}
            </el-button>
          </el-form-item>
        </template>

        <template v-else>
          <el-alert
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
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
            <el-button
              type="primary"
              link
              @click="switchVerifyType"
            >
              {{ t('personal.security.rememberOldPassword') }}
            </el-button>
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
        <el-button @click="passwordDialogVisible = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="passwordLoading"
          @click="savePassword"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss" src="./styles.scss"></style>
