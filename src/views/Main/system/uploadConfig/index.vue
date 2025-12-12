<script setup lang="ts">
import {ref, defineAsyncComponent} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/utils/responsive'

const {t} = useI18n()
const isMobile = useIsMobile()

const active = ref('driver')

const DriversTab = defineAsyncComponent(() => import('./components/UploadDriver/index.vue'))
const RulesTab = defineAsyncComponent(() => import('./components/UploadRule/index.vue'))
const SettingsTab = defineAsyncComponent(() => import('./components/UploadSetting/index.vue'))
</script>

<template>
  <el-tabs v-model="active" :stretch="isMobile">
    <el-tab-pane :label="t('upload.tabs.driver')" name="driver" lazy>
      <DriversTab/>
    </el-tab-pane>
    <el-tab-pane :label="t('upload.tabs.rule')" name="rule" lazy>
      <RulesTab/>
    </el-tab-pane>
    <el-tab-pane :label="t('upload.tabs.setting')" name="setting" lazy>
      <SettingsTab/>
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped>
</style>
