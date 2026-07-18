<script setup lang="ts">
import { defineAsyncComponent, nextTick, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'

type SmsTab = 'config' | 'template' | 'log'

interface SmsLogPanelExpose {
  refreshLogs: () => Promise<void>
}

const { t } = useI18n()
const isMobile = useIsMobile()
const activeTab = shallowRef<SmsTab>('config')
const smsLogPanelRef = shallowRef<SmsLogPanelExpose | null>(null)
const hasActivatedLogTab = shallowRef(false)

const SmsConfigPanel = defineAsyncComponent(() => import('./components/SmsConfigPanel.vue'))
const SmsTemplatePanel = defineAsyncComponent(() => import('./components/SmsTemplatePanel.vue'))
const SmsLogPanel = defineAsyncComponent(() => import('./components/SmsLogPanel.vue'))

async function handleTabChange(name: string | number) {
  if (name !== 'log') {
    return
  }
  if (!hasActivatedLogTab.value) {
    hasActivatedLogTab.value = true
    return
  }
  await nextTick()
  await smsLogPanelRef.value?.refreshLogs()
}
</script>

<template>
  <div class="sms-page">
    <el-tabs
      v-model="activeTab"
      :stretch="isMobile"
      class="sms-page__tabs"
      @tab-change="handleTabChange"
    >
      <el-tab-pane
        :label="t('sms.tabs.config')"
        name="config"
        lazy
      >
        <SmsConfigPanel />
      </el-tab-pane>
      <el-tab-pane
        :label="t('sms.tabs.template')"
        name="template"
        lazy
      >
        <SmsTemplatePanel />
      </el-tab-pane>
      <el-tab-pane
        :label="t('sms.tabs.log')"
        name="log"
        lazy
      >
        <SmsLogPanel ref="smsLogPanelRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.sms-page {
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

.sms-page__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}

.sms-page__tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
}

.sms-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.sms-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: auto;
}
</style>
