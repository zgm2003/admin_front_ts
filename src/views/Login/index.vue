<script setup lang="ts">
import { useIsMobile } from '@/hooks/useResponsive'
import { useLoginForm } from './composables/useLoginForm'
import { useForgotPassword } from './composables/useForgotPassword'
import { AppCaptchaOverlay } from '@/components/AppCaptcha'
import LoginBackground from './components/LoginBackground.vue'
import LoginBrandPanel from './components/LoginBrandPanel.vue'
import LoginMobileBrand from './components/LoginMobileBrand.vue'
import LoginFormCard from './components/LoginFormCard.vue'
import LoginPolicyConfirmDialog from './components/LoginPolicyConfirmDialog.vue'
import ForgotPasswordDialog from './components/ForgotPasswordDialog.vue'
import LoginSuccessOverlay from './components/LoginSuccessOverlay.vue'

const isMobile = useIsMobile()

const {
  loginTypes,
  loginForm,
  captchaChallenge,
  captchaX,
  captchaLoading,
  captchaDialogVisible,
  activeAccountType,
  showPassword,
  agreePolicy,
  policyConfirmVisible,
  isSubmitting,
  isSendingCode: isSendingLoginCode,
  isCaptchaSubmitting,
  isShaking,
  isLoginSuccess,
  isPasswordLogin,
  rules,
  handleSubmit,
  confirmPolicyAndContinue,
  cancelPolicyConfirmation,
  requestLoginCode,
  completeCaptchaLogin,
  handleTabChange,
  refreshCaptcha,
  setFormRef,
  setSendCodeRef,
  openService,
  openPolicy,
} = useLoginForm()

const {
  forgotVisible,
  forgotStep,
  isForgotSubmitting,
  forgotForm,
  openForgotDialog,
  handleForgotNext,
  handleResetPassword,
} = useForgotPassword()

</script>

<template>
  <div
    class="login-page login-container"
    :class="{ 'is-mobile': isMobile }"
  >
    <!-- 全局背景装饰 -->
    <LoginBackground />

    <div class="content-wrapper">
      <!-- 左侧品牌区（桌面端） -->
      <LoginBrandPanel v-if="!isMobile" />

      <!-- 右侧登录表单（移动端：品牌 + 表单合一面板） -->
      <div
        class="form-section"
        :class="{ 'login-mobile-sheet': isMobile }"
      >
        <LoginMobileBrand v-if="isMobile" />
        <LoginFormCard
          :login-types="loginTypes"
          :active-type="activeAccountType"
          :login-form="loginForm"
          :rules="rules"
          :show-password="showPassword"
          :is-password-login="isPasswordLogin"
          :is-submitting="isSubmitting"
          :is-sending-code="isSendingLoginCode"
          :is-shaking="isShaking"
          :agree-policy="agreePolicy"
          :register-form="setFormRef"
          :register-send-code="setSendCodeRef"
          @submit="handleSubmit"
          @send-code="requestLoginCode"
          @tab-change="handleTabChange"
          @update:login-account="loginForm.login_account = $event"
          @update:password="loginForm.password = $event"
          @update:code="loginForm.code = $event"
          @update:remember="loginForm.remember = $event"
          @toggle-password="showPassword = !showPassword"
          @forgot-password="openForgotDialog"
          @open-service="openService"
          @open-policy="openPolicy"
          @update:agree-policy="agreePolicy = $event"
        />
      </div>
    </div>

    <AppCaptchaOverlay
      v-model="captchaDialogVisible"
      :challenge="captchaChallenge"
      :slider-x="captchaX"
      :loading="captchaLoading"
      :verifying="isCaptchaSubmitting"
      @update:slider-x="captchaX = $event"
      @refresh="refreshCaptcha"
      @complete="completeCaptchaLogin"
    />

    <LoginPolicyConfirmDialog
      :visible="policyConfirmVisible"
      @confirm="confirmPolicyAndContinue"
      @cancel="cancelPolicyConfirmation"
      @open-service="openService"
      @open-policy="openPolicy"
    />

    <!-- 忘记密码弹窗 -->
    <ForgotPasswordDialog
      :visible="forgotVisible"
      :step="forgotStep"
      :form="forgotForm"
      :is-submitting="isForgotSubmitting"
      @update:visible="forgotVisible = $event"
      @update:form="Object.assign(forgotForm, $event)"
      @next="handleForgotNext"
      @back="forgotStep = 1"
      @reset="handleResetPassword"
    />

    <!-- 登录成功过渡 -->
    <LoginSuccessOverlay :visible="isLoginSuccess" />
  </div>
</template>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color-page);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-container.is-mobile {
  height: auto;
  min-height: 100vh;
  min-height: 100dvh;
  min-height: 100svh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  align-items: stretch;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 80px;
}

.login-container.is-mobile .content-wrapper {
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  min-height: calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  padding: 12px 12px max(12px, env(safe-area-inset-bottom, 0px));
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0;
}

.form-section {
  width: 100%;
  max-width: 480px;
  flex-shrink: 0;
}

.login-container.is-mobile .form-section {
  max-width: 100%;
}

.form-section.login-mobile-sheet {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  box-shadow:
    0 12px 36px -16px rgba(15, 23, 42, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

@media (max-height: 500px) and (orientation: landscape) {
  .login-container.is-mobile .content-wrapper {
    min-height: auto;
    padding-top: 8px;
    justify-content: flex-start;
  }
}
</style>
