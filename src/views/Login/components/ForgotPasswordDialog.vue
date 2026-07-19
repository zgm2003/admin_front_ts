<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message, Lock } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { SendCode } from '@/components/SendCode'

const { t } = useI18n()
const isMobile = useIsMobile()

interface ForgotPasswordForm {
  account: string
  code: string
  newPassword: string
  confirmPassword: string
}

const props = defineProps<{
  visible: boolean
  step: number
  form: ForgotPasswordForm
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:form': [value: ForgotPasswordForm]
  next: []
  back: []
  reset: []
}>()

function fieldModel<Key extends keyof ForgotPasswordForm>(key: Key) {
  return computed({
    get: () => props.form[key],
    set: (value: ForgotPasswordForm[Key]) => emit('update:form', { ...props.form, [key]: value }),
  })
}

const account = fieldModel('account')
const code = fieldModel('code')
const newPassword = fieldModel('newPassword')
const confirmPassword = fieldModel('confirmPassword')
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('auth.forget.title')"
    :width="isMobile ? '94vw' : '440px'"
    body-padding="32px"
    append-to-body
    destroy-on-close
    class="login-forgot-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="forgot-content">
      <div class="step-indicator">
        <div :class="['step-item', { active: step >= 1 }]">
          <div class="step-num">
            1
          </div>
          <span class="step-text">{{ t('loginPage.forgot.steps.verify') }}</span>
        </div>
        <div class="step-line" />
        <div :class="['step-item', { active: step >= 2 }]">
          <div class="step-num">
            2
          </div>
          <span class="step-text">{{ t('loginPage.forgot.steps.reset') }}</span>
        </div>
      </div>

      <div
        v-if="step === 1"
        class="step-content animate-fade-in"
      >
        <div class="input-group">
          <label class="input-label">{{ t('auth.forget.account') }}</label>
          <el-input
            v-model="account"
            :placeholder="t('auth.forget.accountPlaceholder')"
            class="custom-input"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.register.code') }}</label>
          <SendCode
            v-model="code"
            :account="account"
            scene="forget"
            :placeholder="t('auth.forget.codePlaceholder')"
            class="forgot-send-code"
          />
        </div>
        <el-button
          type="primary"
          class="submit-btn mt-4"
          @click="$emit('next')"
        >
          {{ t('loginPage.forgot.next') }}
        </el-button>
      </div>

      <div
        v-else
        class="step-content animate-fade-in"
      >
        <div class="input-group">
          <label class="input-label">{{ t('auth.edit.newPassword') }}</label>
          <el-input
            v-model="newPassword"
            type="password"
            :placeholder="t('auth.edit.newPasswordPlaceholder')"
            show-password
            class="custom-input"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.edit.confirmPassword') }}</label>
          <el-input
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.edit.confirmPasswordPlaceholder')"
            show-password
            class="custom-input"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="forgot-actions">
          <el-button
            class="back-btn"
            @click="$emit('back')"
          >
            {{ t('common.back') }}
          </el-button>
          <el-button
            type="primary"
            class="submit-btn flex-1"
            :loading="isSubmitting"
            @click="$emit('reset')"
          >
            {{ isSubmitting ? t('loginPage.forgot.submitting') : t('loginPage.forgot.submit') }}
          </el-button>
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<style scoped lang="scss" src="./ForgotPasswordDialog.styles.scss"></style>
