<script setup lang="ts">
import { useIsMobile } from '@/hooks/useResponsive'
import { isTauri as isTauriEnv } from '@/store/tauri'
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
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().minimize()
}
async function tauriClose() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().close()
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

<style lang="scss" src="./login.scss" />
