<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, type Component, useTemplateRef, watchPostEffect } from 'vue'
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
  isSendingCode: boolean
  isShaking: boolean
  agreePolicy: boolean
  registerForm?: (formRef: FormInstance | null | undefined) => void
  registerSendCode?: (sendCodeRef: SendCodeInstance | null) => void
}>()

const isMobile = useIsMobile()
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'sendCode'): void
  (e: 'tabChange', method: UserLoginType): void
  (e: 'togglePassword'): void
  (e: 'forgotPassword'): void
  (e: 'openService'): void
  (e: 'openPolicy'): void
  (e: 'update:agreePolicy', value: boolean): void
  (e: 'update:loginAccount', value: string): void
  (e: 'update:password', value: string): void
  (e: 'update:code', value: string): void
  (e: 'update:remember', value: boolean): void
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
const accountAutocomplete = computed(() => props.activeType === 'password'
  ? 'username'
  : props.activeType === 'email' ? 'email' : 'tel')
const accountInputMode = computed(() => props.activeType === 'phone'
  ? 'tel'
  : props.activeType === 'email' ? 'email' : 'text')
const loginAccount = computed({
  get: () => props.loginForm.login_account,
  set: (value: string) => emit('update:loginAccount', value),
})
const password = computed({
  get: () => props.loginForm.password,
  set: (value: string) => emit('update:password', value),
})
const code = computed({
  get: () => props.loginForm.code,
  set: (value: string) => emit('update:code', value),
})
const remember = computed({
  get: () => props.loginForm.remember,
  set: (value: boolean) => emit('update:remember', value),
})
const isLoginCodeAccountInvalid = computed(() => {
  const account = props.loginForm.login_account.trim()
  if (props.activeType === 'email') {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
  }
  if (props.activeType === 'phone') {
    return !/^1[3-9]\d{9}$/.test(account)
  }
  return true
})

async function handleMethodKeydown(event: KeyboardEvent, index: number) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const lastIndex = props.loginTypes.length - 1
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? lastIndex
      : event.key === 'ArrowRight'
        ? (index + 1) % props.loginTypes.length
        : (index - 1 + props.loginTypes.length) % props.loginTypes.length
  const method = props.loginTypes[nextIndex]
  if (!method) return
  emit('tabChange', method.value)
  await nextTick()
  document.getElementById(`login-method-${method.value}`)?.focus()
}

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
      <h1 class="welcome-title">
        {{ t('common.welcomeBack') }}
      </h1>
      <p class="welcome-desc">
        {{ t('loginPage.form.welcomeDesc') }}
      </p>
    </div>

    <div
      class="method-tabs"
      role="tablist"
      :aria-label="t('accessibility.loginMethods')"
    >
      <button
        v-for="(type, index) in loginTypes"
        :id="`login-method-${type.value}`"
        :key="type.value"
        type="button"
        role="tab"
        :aria-selected="activeType === type.value"
        :aria-controls="`login-panel-${type.value}`"
        :tabindex="activeType === type.value ? 0 : -1"
        :class="['tab-btn', { active: activeType === type.value }]"
        @click="$emit('tabChange', type.value)"
        @keydown="handleMethodKeydown($event, index)"
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
      :aria-busy="isSubmitting"
      @submit.prevent="$emit('submit')"
    >
      <div class="form-content-area">
        <div class="method-container">
          <div
            :id="`login-panel-${activeType}`"
            :key="activeType"
            class="method-content is-active"
            role="tabpanel"
            :aria-labelledby="`login-method-${activeType}`"
          >
            <div class="input-group">
              <label
                class="input-label"
                for="login-account"
              >{{ activeTypeConfig.label }}</label>
              <el-form-item prop="login_account">
                <el-input
                  id="login-account"
                  v-model="loginAccount"
                  :autocomplete="accountAutocomplete"
                  :inputmode="accountInputMode"
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
                <label
                  class="input-label"
                  for="login-password"
                >{{ t('auth.login.password') }}</label>
                <el-form-item prop="password">
                  <el-input
                    id="login-password"
                    v-model="password"
                    autocomplete="current-password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="t('auth.login.passwordPlaceholder')"
                    class="custom-input"
                  >
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                    <template #suffix>
                      <button
                        type="button"
                        class="password-toggle"
                        :aria-label="showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')"
                        :aria-pressed="showPassword"
                        @click="$emit('togglePassword')"
                      >
                        <el-icon v-if="!showPassword">
                          <View />
                        </el-icon>
                        <el-icon v-else>
                          <Hide />
                        </el-icon>
                      </button>
                    </template>
                  </el-input>
                </el-form-item>
              </template>
              <template v-else>
                <label
                  class="input-label"
                  for="login-code"
                >{{ t('auth.register.code') }}</label>
                <el-form-item prop="code">
                  <SendCode
                    ref="sendCode"
                    v-model="code"
                    input-id="login-code"
                    class="login-send-code"
                    :account="loginAccount"
                    scene="login"
                    size="large"
                    :mobile="isMobile"
                    :sending="isSendingCode"
                    :send-disabled="isLoginCodeAccountInvalid"
                    :placeholder="t('auth.login.codePlaceholder')"
                    @request="$emit('sendCode')"
                  />
                </el-form-item>
              </template>
            </div>
          </div>
        </div>

        <div class="form-options">
          <el-checkbox
            v-model="remember"
            :label="t('auth.login.remember')"
            :class="{ 'is-invisible': !isPasswordLogin }"
          />
          <button
            type="button"
            class="forget-pwd"
            :class="{ 'is-invisible': !isPasswordLogin }"
            :tabindex="isPasswordLogin ? 0 : -1"
            :aria-hidden="!isPasswordLogin"
            @click="$emit('forgotPassword')"
          >
            {{ t('auth.login.toForget') }}
          </button>
        </div>

        <div class="terms-checkbox">
          <el-checkbox
            :model-value="agreePolicy"
            @update:model-value="emit('update:agreePolicy', Boolean($event))"
          >
            {{ t('loginPage.form.agreePrefix') }}
          </el-checkbox>
          <button
            type="button"
            class="term-btn"
            @click="$emit('openService')"
          >
            {{ t('loginPage.form.serviceTerms') }}
          </button>
          <span>{{ t('loginPage.form.and') }}</span>
          <button
            type="button"
            class="term-btn"
            @click="$emit('openPolicy')"
          >
            {{ t('loginPage.form.privacyPolicy') }}
          </button>
        </div>
      </div>

      <el-button
        native-type="submit"
        type="primary"
        class="submit-btn"
        :loading="isSubmitting"
        :aria-busy="isSubmitting"
      >
        {{ isSubmitting ? t('loginPage.form.loggingIn') : t('auth.login.submit') }}
      </el-button>
    </el-form>
  </div>
</template>

<style scoped lang="scss" src="./LoginFormCard.styles.scss"></style>
