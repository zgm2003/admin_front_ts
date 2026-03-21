<template>
  <div :class="['form-card', 'animate-fade-in-right', { 'shake-animation': isShaking }]">
    <div class="header-text">
      <h1 class="welcome-title">欢迎回来</h1>
      <p class="welcome-desc">登录智澜系统后台，继续高效管理</p>
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
                <label class="input-label">密码</label>
                <el-form-item prop="password">
                  <el-input
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="请输入密码"
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
                <label class="input-label">验证码</label>
                <el-form-item prop="code">
                  <SendCode
                    ref="sendCode"
                    v-model="loginForm.code"
                    class="login-send-code"
                    :account="loginForm.login_account"
                    scene="login"
                    size="large"
                    :mobile="isMobile"
                    placeholder="请输入验证码"
                  />
                </el-form-item>
              </template>
            </div>
          </div>
        </div>

        <div class="form-options">
          <el-checkbox
            v-model="loginForm.remember"
            label="记住我"
            :class="{ 'is-invisible': !isPasswordLogin }"
          />
          <span
            class="forget-pwd"
            :class="{ 'is-invisible': !isPasswordLogin }"
            @click="$emit('forgotPassword')"
          >
            忘记密码
          </span>
        </div>

        <div class="terms-checkbox">
          <el-checkbox :model-value="agreePolicy" @update:model-value="emit('update:agreePolicy', Boolean($event))">
            我已阅读并同意
            <span class="term-btn" @click.prevent.stop="$emit('openService')">服务条款</span>
            和
            <span class="term-btn" @click.prevent.stop="$emit('openPolicy')">隐私政策</span>
          </el-checkbox>
        </div>
      </div>

      <el-button
        native-type="submit"
        type="primary"
        class="submit-btn"
        :loading="isSubmitting"
      >
        {{ isSubmitting ? '登录中...' : '登录' }}
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, type Component, useTemplateRef, watchPostEffect } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
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

const typeConfig: Record<UserLoginType, { label: string; icon: Component; placeholder: string }> = {
  password: { label: '账号', icon: Message, placeholder: '请输入账号' },
  email: { label: '邮箱', icon: Message, placeholder: '请输入邮箱' },
  phone: { label: '手机号', icon: Iphone, placeholder: '请输入手机号' },
}

const activeTypeConfig = computed(() => typeConfig[props.activeType] ?? typeConfig.password)

watchPostEffect(() => {
  props.registerForm?.(elFormRef.value)
  props.registerSendCode?.(sendCodeRef.value ?? null)
})

onBeforeUnmount(() => {
  props.registerForm?.(undefined)
  props.registerSendCode?.(null)
})
</script>
