<script setup lang="ts">
import {ref, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'

const {t} = useI18n()
const isMobile = useIsMobile()

const active = ref('driver')

const DriversTab = defineAsyncComponent(() => import('./components/UploadDriver/index.vue'))
const RulesTab = defineAsyncComponent(() => import('./components/UploadRule/index.vue'))
const SettingsTab = defineAsyncComponent(() => import('./components/UploadSetting/index.vue'))
</script>

<template>
  <div class="upload-config-page">
    <el-tabs
      v-model="active"
      :stretch="isMobile"
      class="upload-config-page__tabs"
    >
      <el-tab-pane
        :label="t('upload.tabs.driver')"
        name="driver"
        lazy
      >
        <DriversTab />
      </el-tab-pane>
      <el-tab-pane
        :label="t('upload.tabs.rule')"
        name="rule"
        lazy
      >
        <RulesTab />
      </el-tab-pane>
      <el-tab-pane
        :label="t('upload.tabs.setting')"
        name="setting"
        lazy
      >
        <SettingsTab />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.upload-config-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.upload-config-page__tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.upload-config-page__tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
}

.upload-config-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.upload-config-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: auto;
}
</style>
