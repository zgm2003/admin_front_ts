<script setup lang="ts">
import { useIsMobile } from '@/hooks/useResponsive'
import { Cherry, StarFilled, CircleCheckFilled, Plus, ChatDotRound, Setting, Bell, Timer } from '@element-plus/icons-vue'

const isMobile = useIsMobile()
</script>

<template>
  <div class="login-background" :class="{ 'is-mobile': isMobile }">
    <div class="mesh-gradient"></div>
    <div class="dot-pattern"></div>
    <div class="deco-blob blob-1"></div>
    <div class="deco-blob blob-2"></div>
    <div class="deco-blob blob-3"></div>
    <div class="deco-blob blob-4"></div>

    <div class="floating-icons">
      <el-icon class="float-item icon-1"><Cherry /></el-icon>
      <el-icon class="float-item icon-2"><StarFilled /></el-icon>
      <el-icon class="float-item icon-3"><CircleCheckFilled /></el-icon>
      <el-icon class="float-item icon-4"><Plus /></el-icon>
      <el-icon class="float-item icon-5"><ChatDotRound /></el-icon>
      <el-icon class="float-item icon-6"><Setting /></el-icon>
      <el-icon class="float-item icon-7"><ChatDotRound /></el-icon>
      <el-icon class="float-item icon-8"><Bell /></el-icon>
      <el-icon class="float-item icon-9"><Timer /></el-icon>
      <el-icon class="float-item icon-10"><Timer /></el-icon>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.mesh-gradient {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(at 0% 0%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.06) 0px, transparent 50%);
  filter: blur(100px);
}

.dot-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image: radial-gradient(var(--el-color-primary) 1px, transparent 1px);
  background-size: 32px 32px;
}

.deco-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: login-bg-float 15s infinite ease-in-out;

  &.blob-1 {
    top: -120px;
    left: -120px;
    width: 450px;
    height: 450px;
    background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.16);
  }

  &.blob-2 {
    right: -80px;
    bottom: -80px;
    width: 350px;
    height: 350px;
    background: rgba(59, 130, 246, 0.08);
  }

  &.blob-3 {
    top: 25%;
    right: 15%;
    width: 250px;
    height: 250px;
    background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12);
  }

  &.blob-4 {
    bottom: 30%;
    left: 15%;
    width: 200px;
    height: 200px;
    background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.08);
  }
}

.floating-icons {
  .float-item {
    position: absolute;
    opacity: 0.25;
    font-size: 32px;
    color: var(--el-color-primary);
    animation: login-bg-float 8s infinite ease-in-out;

    &.icon-1 { top: 12%; left: 15%; animation-delay: 0s; }
    &.icon-2 { top: 18%; right: 18%; animation-delay: 1s; }
    &.icon-3 { bottom: 25%; left: 12%; animation-delay: 2s; }
    &.icon-4 { right: 25%; bottom: 15%; animation-delay: 3s; }
    &.icon-5 { top: 45%; left: 8%; animation-delay: 4s; }
    &.icon-6 { top: 55%; right: 10%; animation-delay: 5s; }
    &.icon-7 { top: 8%; left: 45%; animation-delay: 6s; }
    &.icon-8 { bottom: 10%; left: 40%; animation-delay: 7s; }
    &.icon-9 { top: 20%; left: 35%; animation-delay: 1.5s; }
    &.icon-10 { right: 35%; bottom: 40%; animation-delay: 2.5s; }
  }
}

.login-background.is-mobile {
  .floating-icons {
    display: none;
  }

  .deco-blob {
    opacity: 0.3;
  }
}

@keyframes login-bg-float {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }

  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}
</style>
