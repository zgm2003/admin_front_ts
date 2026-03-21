<template>
  <div :class="['form-card', 'animate-fade-in-right', { 'shake-animation': isShaking }]">
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

<script setup lang="ts">
import { computed, onBeforeUnmount, type Component, useTemplateRef, watchPostEffect } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { SendCode } from '@/components/SendCode'
import { useIsMobile } from '@/hooks/useResponsive'
import { Message, Lock, View, Hide, Iphone } from '@element-plus/icons-vue'
import type { UserLoginType } from '@/types/user'

type LoginTypeItem = { label: string; value: UserLoginType }
type SendCodeInstance = InstanceType<typeof SendCode>

const props = defineProps<{
  loginTypes: LoginTypeItem[]
  activeType: UserLoginType
  loginForm: { login_account: string; password: string; code: string; remember: boolean }
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
