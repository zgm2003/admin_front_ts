<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'
import { TauriUpdater } from '@/components/TauriUpdater'

const { locale } = useI18n()
const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <TauriUpdater />
    <router-view />
  </el-config-provider>
</template>

<style scoped>
</style>
