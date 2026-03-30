<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ visible: boolean }>()
</script>

<template>
  <Transition name="fade-loading">
    <div v-if="visible" class="login-success-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div class="loading-text">{{ t('loginPage.loading.preparing') }}</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.login-success-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
}

.double-bounce1,
.double-bounce2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  opacity: 0.6;
  animation: login-success-bounce 2s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1s;
}

.loading-text {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  animation: login-success-pulse 1.5s infinite;
}

.fade-loading-enter-active,
.fade-loading-leave-active {
  transition: opacity 0.5s ease;
}

.fade-loading-enter-from,
.fade-loading-leave-to {
  opacity: 0;
}

@keyframes login-success-bounce {
  0%,
  100% {
    transform: scale(0);
  }

  50% {
    transform: scale(1);
  }
}

@keyframes login-success-pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}
</style>
