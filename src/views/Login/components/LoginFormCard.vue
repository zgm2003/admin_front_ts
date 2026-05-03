<script setup lang="ts">
import { computed, onBeforeUnmount, type Component, useTemplateRef, watchPostEffect } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { SendCode } from '@/components/SendCode'
import { useIsMobile } from '@/hooks/useResponsive'
import { Message, Lock, View, Hide, Iphone } from '@element-plus/icons-vue'
import type { UserCaptchaChallenge, UserLoginType } from '@/types/user'
import LoginSlideCaptcha from './LoginSlideCaptcha.vue'

type LoginTypeItem = { label: string; value: UserLoginType }
type SendCodeInstance = InstanceType<typeof SendCode>

const props = defineProps<{
  loginTypes: LoginTypeItem[]
  activeType: UserLoginType
  loginForm: { login_account: string; password: string; code: string; remember: boolean }
  captchaChallenge: UserCaptchaChallenge | null
  captchaX: number
  captchaEnabled: boolean
  captchaLoading: boolean
  rules: FormRules
  showPassword: boolean
  isPasswordLogin: boolean
  isSubmitting: boolean
  isShaking: boolean
  agreePolicy: boolean
  registerForm?: (formRef: FormInstance | null | undefined) => void
  registerSendCode?: (sendCodeRef: SendCodeInstance | null) => void
}>()

const isMobile = useIsMobile()
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'tabChange', method: UserLoginType): void
  (e: 'togglePassword'): void
  (e: 'forgotPassword'): void
  (e: 'openService'): void
  (e: 'openPolicy'): void
  (e: 'update:agreePolicy', value: boolean): void
  (e: 'update:captchaX', value: number): void
  (e: 'refreshCaptcha'): void
}>()

const elFormRef = useTemplateRef<FormInstance>('elForm')
const sendCodeRef = useTemplateRef<SendCodeInstance>('sendCode')

const typeConfig = computed<Record<UserLoginType, { label: string; icon: Component; placeholder: string }>>(() => ({
  password: {
    label: t('auth.login.account'),
    icon: Message,
    placeholder: t('auth.login.accountPlaceholder'),
  },
  email: {
    label: t('auth.login.email'),
    icon: Message,
    placeholder: t('auth.login.emailPlaceholder'),
  },
  phone: {
    label: t('auth.login.phone'),
    icon: Iphone,
    placeholder: t('auth.login.phonePlaceholder'),
  },
}))

const activeTypeConfig = computed(() => typeConfig.value[props.activeType] ?? typeConfig.value.password)

watchPostEffect(() => {
  props.registerForm?.(elFormRef.value)
  props.registerSendCode?.(sendCodeRef.value ?? null)
})

onBeforeUnmount(() => {
  props.registerForm?.(undefined)
  props.registerSendCode?.(null)
})
</script>

<template>
  <div :class="['login-form-card', 'animate-fade-in-right', { 'shake-animation': isShaking, 'is-mobile': isMobile }]">
    <div class="header-text">
      <h1 class="welcome-title">{{ t('common.welcomeBack') }}</h1>
      <p class="welcome-desc">{{ t('loginPage.form.welcomeDesc') }}</p>
    </div>

    <div class="method-tabs">
      <button
        v-for="type in loginTypes"
        :key="type.value"
        type="button"
        :class="['tab-btn', { active: activeType === type.value }]"
        @click="$emit('tabChange', type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <el-form
      ref="elForm"
      :model="loginForm"
      :rules="rules"
      :validate-on-rule-change="false"
      class="login-form"
      @submit.prevent="$emit('submit')"
    >
      <div class="form-content-area">
        <div class="method-container">
          <div :key="activeType" class="method-content is-active">
            <div class="input-group">
              <label class="input-label">{{ activeTypeConfig.label }}</label>
              <el-form-item prop="login_account">
                <el-input
                  v-model="loginForm.login_account"
                  :placeholder="activeTypeConfig.placeholder"
                  class="custom-input"
                >
                  <template #prefix>
                    <el-icon><component :is="activeTypeConfig.icon" /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <div class="input-group">
              <template v-if="activeType === 'password'">
                <label class="input-label">{{ t('auth.login.password') }}</label>
                <el-form-item prop="password">
                  <el-input
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="t('auth.login.passwordPlaceholder')"
                    class="custom-input"
                  >
                    <template #prefix><el-icon><Lock /></el-icon></template>
                    <template #suffix>
                      <div class="password-toggle" @click="$emit('togglePassword')">
                        <el-icon v-if="!showPassword"><View /></el-icon>
                        <el-icon v-else><Hide /></el-icon>
                      </div>
                    </template>
                  </el-input>
                </el-form-item>
              </template>
              <template v-else>
                <label class="input-label">{{ t('auth.register.code') }}</label>
                <el-form-item prop="code">
                  <SendCode
                    ref="sendCode"
                    v-model="loginForm.code"
                    class="login-send-code"
                    :account="loginForm.login_account"
                    scene="login"
                    size="large"
                    :mobile="isMobile"
                    :placeholder="t('auth.login.codePlaceholder')"
                  />
                </el-form-item>
              </template>
            </div>

            <div v-if="activeType === 'password' && captchaEnabled" class="input-group captcha-group">
              <LoginSlideCaptcha
                :enabled="captchaEnabled"
                :challenge="captchaChallenge"
                :model-value="captchaX"
                :loading="captchaLoading"
                @update:model-value="$emit('update:captchaX', $event)"
                @refresh="$emit('refreshCaptcha')"
              />
            </div>
          </div>
        </div>

        <div class="form-options">
          <el-checkbox
            v-model="loginForm.remember"
            :label="t('auth.login.remember')"
            :class="{ 'is-invisible': !isPasswordLogin }"
          />
          <span
            class="forget-pwd"
            :class="{ 'is-invisible': !isPasswordLogin }"
            @click="$emit('forgotPassword')"
          >
            {{ t('auth.login.toForget') }}
          </span>
        </div>

        <div class="terms-checkbox">
          <el-checkbox :model-value="agreePolicy" @update:model-value="emit('update:agreePolicy', Boolean($event))">
            {{ t('loginPage.form.agreePrefix') }}
            <span class="term-btn" @click.prevent.stop="$emit('openService')">{{ t('loginPage.form.serviceTerms') }}</span>
            {{ t('loginPage.form.and') }}
            <span class="term-btn" @click.prevent.stop="$emit('openPolicy')">{{ t('loginPage.form.privacyPolicy') }}</span>
          </el-checkbox>
        </div>
      </div>

      <el-button
        native-type="submit"
        type="primary"
        class="submit-btn"
        :loading="isSubmitting"
      >
        {{ isSubmitting ? t('loginPage.form.loggingIn') : t('auth.login.submit') }}
      </el-button>
    </el-form>
  </div>
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

@mixin send-code-control(
  $height: 46px,
  $radius: 16px,
  $padding-y: 10px,
  $padding-x: 14px,
  $input-font-size: null,
  $button-font-size: null,
  $button-padding: null
) {
  @include input-control($height, $radius, $padding-y, $padding-x, $input-font-size);

  :deep(.el-button) {
    height: $height !important;
    border-radius: $radius !important;
    font-weight: 600;

    @if $button-font-size != null {
      font-size: $button-font-size;
    }

    @if $button-padding != null {
      padding: $button-padding;
    }
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

.login-form-card {
  padding: 48px;
  border: 1px solid #ffffff;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);

  @media (max-height: 800px) {
    padding: 32px 40px;
  }
}

.login-form-card.is-mobile {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px 12px;
  border: none;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
}

.header-text {
  margin-bottom: 32px;

  @media (max-height: 800px) {
    margin-bottom: 24px;
  }

  .welcome-title {
    margin-bottom: 12px;
    color: #111827;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;

    @media (max-height: 800px) {
      font-size: 28px;
    }
  }

  .welcome-desc {
    color: #6b7280;
    font-size: 16px;
  }
}

.login-form-card.is-mobile .header-text {
  margin-bottom: 10px;

  .welcome-title {
    margin-bottom: 3px;
    font-size: 20px;
    letter-spacing: -0.03em;
  }

  .welcome-desc {
    font-size: 12px;
    line-height: 1.4;
  }
}

.method-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 6px;
  border-radius: 14px;
  background: #f1f5f9;

  .tab-btn {
    flex: 1;
    padding: 10px 0;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;

    &.active {
      background: #ffffff;
      color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12);
    }
  }
}

.login-form-card.is-mobile .method-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  margin-bottom: 10px;
  padding: 3px;
  border-radius: 10px;

  .tab-btn {
    min-height: 34px;
    padding: 7px 2px;
    border-radius: 7px;
    font-size: 12px;
  }
}

.form-content-area {
  display: flex;
  flex-direction: column;
}

.method-container {
  position: relative;
  height: 382px;
  margin-bottom: 20px;
}

.login-form-card.is-mobile .method-container {
  position: relative;
  height: auto !important;
  min-height: 330px !important;
  margin-bottom: 10px;
}

.method-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateX(20px) scale(0.98);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.is-active {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
    transition-delay: 0.1s;
  }
}

.login-form-card.is-mobile .method-content {
  position: relative !important;
  display: none;

  &.is-active {
    display: block;
  }
}

.input-group {
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(10px);
  animation: login-form-slide-up-fade 0.5s ease forwards;

  &:nth-child(1) {
    animation-delay: 0.1s;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
}

.captcha-group {
  margin-bottom: 0;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.3s;
}

.login-form-card.is-mobile {
  .input-group {
    margin-bottom: 10px;
  }

  .input-label {
    margin-bottom: 4px;
    font-size: 12px;
  }
}

.custom-input {
  @include input-control();
}

.login-form-card.is-mobile .custom-input {
  @include input-control(42px, 12px, 8px, 12px, 16px);
}

.login-send-code {
  width: 100%;
  @include send-code-control();
}

.login-form-card.is-mobile .login-send-code {
  @include send-code-control(42px, 12px, 8px, 12px, 16px, 13px, 0 12px);
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    display: block;
    flex-wrap: nowrap;
  }

  :deep(.el-form-item__error) {
    position: absolute;
    bottom: -18px;
    left: 0;
    font-size: 12px;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  margin-bottom: 12px;

  .is-invisible {
    opacity: 0;
    pointer-events: none;
  }
}

.login-form-card.is-mobile .form-options {
  height: auto;
  min-height: 24px;
  margin-bottom: 10px;
}

.forget-pwd {
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary-dark-2);
    text-decoration: underline;
  }
}

.terms-checkbox {
  margin-bottom: 16px;
  color: #64748b;
  font-size: 13px;

  :deep(.el-checkbox__label) {
    color: #64748b;
    font-size: 13px;
  }
}

.login-form-card.is-mobile .terms-checkbox {
  margin-top: 6px;
  margin-bottom: 10px;
  font-size: 12px;

  :deep(.el-checkbox__label) {
    font-size: 12px;
    line-height: 1.4;
  }
}

.term-btn {
  color: var(--el-color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary-dark-2);
    text-decoration: underline;
  }
}

.submit-btn {
  @include primary-submit-button();
}

.login-form-card.is-mobile .submit-btn {
  @include primary-submit-button(46px, 12px, 15px);
}

.password-toggle {
  cursor: pointer;
}

.shake-animation {
  animation: login-form-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.animate-fade-in-right {
  animation: login-form-fade-in-right 0.4s ease-out forwards;
}

@keyframes login-form-shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

@keyframes login-form-fade-in-right {
  from {
    opacity: 0;
    transform: translateX(30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes login-form-slide-up-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 375px) {
  .login-form-card.is-mobile {
    padding: 8px 12px 10px;
  }

  .login-form-card.is-mobile .method-container {
    min-height: 118px !important;
  }
}
</style>
