<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'
import { TauriManager } from '@/components/TauriManager'
import { NetworkStatusNotice } from '@/components/NetworkStatusNotice'
import { isTauri } from '@/platform/tauri'
import { useIsMobile } from '@/hooks/useResponsive'
import { useAppKernel } from '@/app/injection'
import LoginView from '@/views/Login/index.vue'

const { locale } = useI18n()
const kernel = useAppKernel()
const bootstrapState = kernel.state
const isMobile = useIsMobile()
const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))
const elementSize = computed(() => (isMobile.value ? 'small' : 'default'))
const fatalMessage = computed(() => bootstrapState.value.kind === 'failed'
  ? bootstrapState.value.error.messageKey
  : '')
</script>

<template>
  <el-config-provider
    :locale="elementLocale"
    :size="elementSize"
  >
    <main
      v-if="bootstrapState.kind === 'cold'
        || bootstrapState.kind === 'restoring-session'
        || bootstrapState.kind === 'loading-principal'
        || bootstrapState.kind === 'installing-routes'"
      class="app-bootstrap-shell"
      aria-busy="true"
    >
      <span class="app-bootstrap-shell__spinner" />
    </main>

    <main
      v-else-if="bootstrapState.kind === 'failed'"
      class="app-bootstrap-shell app-bootstrap-shell--failed"
      role="alert"
    >
      {{ fatalMessage }}
    </main>

    <LoginView v-else-if="bootstrapState.kind === 'anonymous'" />

    <template v-else-if="bootstrapState.kind === 'ready'">
      <TauriManager v-if="isTauri()" />
      <NetworkStatusNotice />
      <router-view />
    </template>
  </el-config-provider>
</template>

<style scoped>
.app-bootstrap-shell {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.app-bootstrap-shell__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: app-bootstrap-spin 0.8s linear infinite;
}

.app-bootstrap-shell--failed {
  padding: 24px;
  text-align: center;
}

@keyframes app-bootstrap-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
