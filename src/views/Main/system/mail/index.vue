<script setup lang="ts">
import { defineAsyncComponent, nextTick, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'

type MailTab = 'config' | 'template' | 'log'

interface MailLogPanelExpose {
  refreshLogs: () => Promise<void>
}

const { t } = useI18n()
const isMobile = useIsMobile()
const activeTab = shallowRef<MailTab>('config')
const mailLogPanelRef = shallowRef<MailLogPanelExpose | null>(null)
const hasActivatedLogTab = shallowRef(false)

const MailConfigPanel = defineAsyncComponent(() => import('./components/MailConfigPanel.vue'))
const MailTemplatePanel = defineAsyncComponent(() => import('./components/MailTemplatePanel.vue'))
const MailLogPanel = defineAsyncComponent(() => import('./components/MailLogPanel.vue'))

async function handleTabChange(name: string | number) {
  if (name !== 'log') {
    return
  }
  if (!hasActivatedLogTab.value) {
    hasActivatedLogTab.value = true
    return
  }
  await nextTick()
  await mailLogPanelRef.value?.refreshLogs()
}
</script>

<template>
  <div class="mail-page">
    <el-tabs v-model="activeTab" :stretch="isMobile" class="mail-page__tabs" @tab-change="handleTabChange">
      <el-tab-pane :label="t('mail.tabs.config')" name="config" lazy>
        <MailConfigPanel />
      </el-tab-pane>
      <el-tab-pane :label="t('mail.tabs.template')" name="template" lazy>
        <MailTemplatePanel />
      </el-tab-pane>
      <el-tab-pane :label="t('mail.tabs.log')" name="log" lazy>
        <MailLogPanel ref="mailLogPanelRef" />
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
