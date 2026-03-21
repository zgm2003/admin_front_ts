<template>
  <el-dialog
    :model-value="visible"
    :title="t('auth.forget.title')"
    width="440px"
    append-to-body
    destroy-on-close
    class="login-forgot-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="forgot-content">
      <div class="step-indicator">
        <div :class="['step-item', { active: step >= 1 }]">
          <div class="step-num">1</div>
          <span class="step-text">{{ t('loginPage.forgot.steps.verify') }}</span>
        </div>
        <div class="step-line"></div>
        <div :class="['step-item', { active: step >= 2 }]">
          <div class="step-num">2</div>
          <span class="step-text">{{ t('loginPage.forgot.steps.reset') }}</span>
        </div>
      </div>

      <div v-if="step === 1" class="step-content animate-fade-in">
        <div class="input-group">
          <label class="input-label">{{ t('auth.forget.account') }}</label>
          <el-input v-model="form.account" :placeholder="t('auth.forget.accountPlaceholder')" class="custom-input">
            <template #prefix><el-icon><Message /></el-icon></template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.register.code') }}</label>
          <div class="code-input-wrapper">
            <el-input
              v-model="form.code"
              :placeholder="t('auth.forget.codePlaceholder')"
              maxlength="6"
              class="custom-input flex-1"
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
            <el-button
              class="code-btn"
              :disabled="countdown > 0 || isSendingCode"
              :type="countdown > 0 ? 'info' : 'primary'"
              :loading="isSendingCode"
              plain
              @click="$emit('sendCode')"
            >
              {{ countdown > 0 ? t('auth.register.resend', { timer: countdown }) : t('auth.register.sendCode') }}
            </el-button>
          </div>
        </div>
        <el-button type="primary" class="submit-btn mt-4" @click="$emit('next')">{{ t('loginPage.forgot.next') }}</el-button>
      </div>

      <div v-else class="step-content animate-fade-in">
        <div class="input-group">
          <label class="input-label">{{ t('auth.edit.newPassword') }}</label>
          <el-input
            v-model="form.newPassword"
            type="password"
            :placeholder="t('auth.edit.newPasswordPlaceholder')"
            show-password
            class="custom-input"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">{{ t('auth.edit.confirmPassword') }}</label>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('auth.edit.confirmPasswordPlaceholder')"
            show-password
            class="custom-input"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </div>
        <div class="forgot-actions">
          <el-button class="back-btn" @click="$emit('back')">{{ t('common.back') }}</el-button>
          <el-button type="primary" class="submit-btn flex-1" :loading="isSubmitting" @click="$emit('reset')">
            {{ isSubmitting ? t('loginPage.forgot.submitting') : t('loginPage.forgot.submit') }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Message, Lock } from '@element-plus/icons-vue'

const { t } = useI18n()

defineProps<{
  visible: boolean
  step: number
  form: { account: string; code: string; newPassword: string; confirmPassword: string }
  countdown: number
  isSendingCode: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  sendCode: []
  next: []
  back: []
  reset: []
}>()
</script>
