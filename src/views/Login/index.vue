<script setup lang="ts">
import { useIsMobile } from '@/hooks/useResponsive'
import { closeAppWindow, isTauri as isTauriEnv, minimizeAppWindow } from '@/platform/tauri'
import { SemiSelect, CloseBold } from '@element-plus/icons-vue'
import { useLoginForm } from './composables/useLoginForm'
import { useForgotPassword } from './composables/useForgotPassword'
import LoginBackground from './components/LoginBackground.vue'
import LoginBrandPanel from './components/LoginBrandPanel.vue'
import LoginMobileBrand from './components/LoginMobileBrand.vue'
import LoginFormCard from './components/LoginFormCard.vue'
import ForgotPasswordDialog from './components/ForgotPasswordDialog.vue'
import LoginSuccessOverlay from './components/LoginSuccessOverlay.vue'

const isMobile = useIsMobile()

const {
  loginTypes,
  loginForm,
  activeAccountType,
  showPassword,
  agreePolicy,
  isSubmitting,
  isShaking,
  isLoginSuccess,
  isPasswordLogin,
  rules,
  handleSubmit,
  handleTabChange,
  setFormRef,
  setSendCodeRef,
  openService,
  openPolicy,
} = useLoginForm()

const {
  forgotVisible,
  forgotStep,
  forgotCountdown,
  isForgotSubmitting,
  isSendingCode,
  forgotForm,
  openForgotDialog,
  sendForgotCode,
  handleForgotNext,
  handleResetPassword,
} = useForgotPassword()

// Tauri 窗口操作
async function tauriMinimize() {
  await minimizeAppWindow()
}
async function tauriClose() {
  await closeAppWindow()
}
</script>

<template>
  <div
    class="login-page login-container"
    :class="{ 'is-mobile': isMobile, 'is-tauri-mobile': isMobile && isTauriEnv() }"
  >
    <!-- Tauri 无边框模式：顶部拖拽条 -->
    <div v-if="isTauriEnv()" class="tauri-drag-bar">
      <div class="tauri-drag-controls">
        <el-button text size="small" :icon="SemiSelect" @click="tauriMinimize" />
        <el-button text size="small" type="danger" :icon="CloseBold" @click="tauriClose" />
      </div>
    </div>

    <!-- 全局背景装饰 -->
    <LoginBackground />

    <div class="content-wrapper">
      <!-- 左侧品牌区（桌面端） -->
      <LoginBrandPanel v-if="!isMobile" />

      <!-- 右侧登录表单（移动端：品牌 + 表单合一面板） -->
      <div class="form-section" :class="{ 'login-mobile-sheet': isMobile }">
        <LoginMobileBrand v-if="isMobile" />
        <LoginFormCard
          :login-types="loginTypes"
          :active-type="activeAccountType"
          :login-form="loginForm"
          :rules="rules"
          :show-password="showPassword"
          :is-password-login="isPasswordLogin"
          :is-submitting="isSubmitting"
          :is-shaking="isShaking"
          :agree-policy="agreePolicy"
          :register-form="setFormRef"
          :register-send-code="setSendCodeRef"
          @submit="handleSubmit"
          @tab-change="handleTabChange"
          @toggle-password="showPassword = !showPassword"
          @forgot-password="openForgotDialog"
          @open-service="openService"
          @open-policy="openPolicy"
          @update:agree-policy="agreePolicy = $event"
        />
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <ForgotPasswordDialog
      :visible="forgotVisible"
      :step="forgotStep"
      :form="forgotForm"
      :countdown="forgotCountdown"
      :is-sending-code="isSendingCode"
      :is-submitting="isForgotSubmitting"
      @update:visible="forgotVisible = $event"
      @send-code="sendForgotCode"
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

.tauri-drag-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 9998;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  -webkit-app-region: drag;
}

.tauri-drag-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  -webkit-app-region: no-drag;
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

.login-container.is-tauri-mobile .form-section.login-mobile-sheet {
  padding-top: calc(36px + env(safe-area-inset-top, 0px));
}

@media (max-height: 500px) and (orientation: landscape) {
  .login-container.is-mobile .content-wrapper {
    min-height: auto;
    padding-top: 8px;
    justify-content: flex-start;
  }
}
</style>
