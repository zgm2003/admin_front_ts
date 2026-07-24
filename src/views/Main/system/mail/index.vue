<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  shallowRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { isApiError } from '@/modules/http/error'
import { useUserStore } from '@/store/user'

type MailTab = 'config' | 'template' | 'log'

interface MailLogPanelExpose {
  activate(): Promise<void>
  clearDiagnostics(): void
  refreshLogs(): Promise<void>
}

const { t } = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()
const activeTab = shallowRef<MailTab>('config')
const mailLogPanelRef = shallowRef<MailLogPanelExpose | null>(null)
const hasActivatedLogTab = shallowRef(false)
const canViewLogs = computed(() => userStore.can('system_mail_logView'))

function reportActivationError(error: unknown) {
  if (isApiError(error) && error.kind === 'canceled') return
  const report = (globalThis as typeof globalThis & { reportError?: (error: unknown) => void }).reportError
  if (typeof report === 'function') report(error)
  else console.error(error)
}

function activatePanel(panel: MailLogPanelExpose) {
  void panel.activate().catch(reportActivationError)
}

const MailConfigPanel = defineAsyncComponent(() => import('./components/MailConfigPanel.vue'))
const MailTemplatePanel = defineAsyncComponent(() => import('./components/MailTemplatePanel.vue'))
const MailLogPanel = defineAsyncComponent(() => import('./components/MailLogPanel.vue'))

async function handleTabChange(name: string | number) {
  if (name !== 'log') {
    mailLogPanelRef.value?.clearDiagnostics()
    return
  }
  if (!canViewLogs.value) {
    activeTab.value = 'config'
    return
  }
  hasActivatedLogTab.value = true
  await nextTick()
  await mailLogPanelRef.value?.activate()
}

function clearDiagnostics() {
  mailLogPanelRef.value?.clearDiagnostics()
}

watch(canViewLogs, (allowed) => {
  if (allowed) return
  clearDiagnostics()
  if (activeTab.value === 'log') activeTab.value = 'config'
  hasActivatedLogTab.value = false
}, { flush: 'sync' })

watch(mailLogPanelRef, (panel) => {
  if (!panel || activeTab.value !== 'log' || !canViewLogs.value) return
  activatePanel(panel)
}, { flush: 'post' })

onActivated(() => {
  if (activeTab.value !== 'log' || !canViewLogs.value) return
  hasActivatedLogTab.value = true
  void nextTick().then(() => {
    const panel = mailLogPanelRef.value
    if (panel) activatePanel(panel)
  }).catch(reportActivationError)
})
onDeactivated(clearDiagnostics)
onBeforeUnmount(clearDiagnostics)
</script>

<template>
  <div class="mail-page">
    <el-tabs
      v-model="activeTab"
      :stretch="isMobile"
      class="mail-page__tabs"
      @tab-change="handleTabChange"
    >
      <el-tab-pane
        data-testid="mail-tab-config"
        :label="t('mail.tabs.config')"
        name="config"
        lazy
      >
        <MailConfigPanel />
      </el-tab-pane>
      <el-tab-pane
        data-testid="mail-tab-template"
        :label="t('mail.tabs.template')"
        name="template"
        lazy
      >
        <MailTemplatePanel />
      </el-tab-pane>
      <el-tab-pane
        v-if="canViewLogs"
        data-testid="mail-tab-log"
        :label="t('mail.tabs.log')"
        name="log"
        lazy
      >
        <MailLogPanel
          v-if="hasActivatedLogTab"
          ref="mailLogPanelRef"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.mail-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  padding: 4px 0;
  overflow: hidden;
}

.mail-page__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}

.mail-page__tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
}

.mail-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.mail-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: auto;
}
</style>
