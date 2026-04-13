<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'
import { TauriManager } from '@/components/TauriManager'
import { isTauri } from '@/platform/tauri'
import { useIsMobile } from '@/hooks/useResponsive'

const { locale } = useI18n()
const isMobile = useIsMobile()
const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))
const elementSize = computed(() => (isMobile.value ? 'small' : 'default'))
</script>

<template>
  <el-config-provider :locale="elementLocale" :size="elementSize">
    <TauriManager v-if="isTauri()" />
    <router-view />
  </el-config-provider>
</template>

<style scoped>
</style>
