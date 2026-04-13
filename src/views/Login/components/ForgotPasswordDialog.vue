<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Message, Lock } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

const { t } = useI18n()
const isMobile = useIsMobile()

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

<template>
  <el-dialog
    :model-value="visible"
    :title="t('auth.forget.title')"
    :width="isMobile ? '94vw' : '440px'"
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

<style scoped lang="scss">
@mixin input-control(
  $height: 46px,
  $radius: 16px,
  $padding-y: 10px,
  $padding-x: 14px,
  $input-font-size: null
) {
  :deep(.el-input__wrapper) {
    height: $height;
    box-sizing: border-box;
    padding: $padding-y $padding-x !important;
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: $radius !important;
    box-shadow: none !important;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  :deep(.el-input__wrapper.is-focus) {
    background: #ffffff !important;
    border-color: var(--el-color-primary) !important;
    box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.1) !important;
    transform: scale(1.01);
  }

  :deep(.el-input__wrapper.is-focus .el-input__inner:-webkit-autofill) {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  }

  :deep(.el-input__inner) {
    height: 24px;

    @if $input-font-size != null {
      font-size: $input-font-size;
    }
  }

  :deep(.el-input__inner:-webkit-autofill),
  :deep(.el-input__inner:-webkit-autofill:hover),
  :deep(.el-input__inner:-webkit-autofill:focus) {
    -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
    -webkit-text-fill-color: var(--el-text-color-primary) !important;
    caret-color: var(--el-text-color-primary);
    transition: background-color 5000s ease-in-out 0s;
  }
}

@mixin primary-submit-button(
  $height: 52px,
  $radius: 16px,
  $font-size: 16px
) {
  width: 100%;
  height: $height !important;
  border: none !important;
  border-radius: $radius !important;
  font-size: $font-size !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%) !important;
  box-shadow: 0 10px 20px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.25) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.05);
    box-shadow: 0 15px 30px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.35) !important;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 5px 15px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2) !important;
  }
}

:deep(.login-forgot-dialog) {
  overflow: hidden;
  border-radius: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

:deep(.login-forgot-dialog .el-dialog__header) {
  margin: 0;
  padding: 24px 32px;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.login-forgot-dialog .el-dialog__title) {
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

:deep(.login-forgot-dialog .el-dialog__body) {
  padding: 32px;
}

.forgot-content {
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0.4;
    transition: all 0.3s;

    &.active {
      opacity: 1;
    }
  }

  .step-item.active .step-num {
    background: var(--el-color-primary);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
  }

  .step-item.active .step-text {
    color: var(--el-color-primary);
    font-weight: 700;
  }

  .step-num {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 14px;
    font-weight: 700;
  }

  .step-text {
    color: #64748b;
    font-size: 12px;
  }

  .step-line {
    width: 40px;
    height: 2px;
    margin-top: -20px;
    background: #f1f5f9;
  }
}

.input-group {
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(10px);
  animation: login-forgot-slide-up-fade 0.5s ease forwards;

  &:nth-child(1) {
    animation-delay: 0.1s;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.custom-input {
  @include input-control();
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-btn {
  height: 46px !important;
  border-radius: 16px !important;
  font-weight: 600;
}

.submit-btn {
  @include primary-submit-button();
}

.forgot-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.back-btn {
  min-width: 100px;
  height: 46px;
  border-radius: 12px;
  font-weight: 600;
}

.mt-4 {
  margin-top: 16px;
}

.flex-1 {
  flex: 1;
}

.animate-fade-in {
  opacity: 0;
  animation: login-forgot-fade-in 0.5s ease-out 0.4s forwards;
}

@keyframes login-forgot-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes login-forgot-slide-up-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
