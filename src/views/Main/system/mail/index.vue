<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'

const { t } = useI18n()
const isMobile = useIsMobile()
const activeTab = shallowRef('config')

const MailConfigPanel = defineAsyncComponent(() => import('./components/MailConfigPanel.vue'))
const MailTemplatePanel = defineAsyncComponent(() => import('./components/MailTemplatePanel.vue'))
const MailLogPanel = defineAsyncComponent(() => import('./components/MailLogPanel.vue'))
</script>

<template>
  <div class="mail-page">
    <el-tabs v-model="activeTab" :stretch="isMobile" class="mail-page__tabs">
      <el-tab-pane :label="t('mail.tabs.config')" name="config" lazy>
        <MailConfigPanel />
      </el-tab-pane>
      <el-tab-pane :label="t('mail.tabs.template')" name="template" lazy>
        <MailTemplatePanel />
      </el-tab-pane>
      <el-tab-pane :label="t('mail.tabs.log')" name="log" lazy>
        <MailLogPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.mail-page {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 4px 0;
  overflow-x: hidden;
}

.mail-page__tabs {
  width: 100%;
  max-width: 100%;
  min-height: 480px;
  min-width: 0;
  box-sizing: border-box;
}

.mail-page__tabs :deep(.el-tabs__content),
.mail-page__tabs :deep(.el-tab-pane) {
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}
</style>
