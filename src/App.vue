<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'
import { TauriUpdater } from '@/components/TauriUpdater'
import { isTauri, useTauriStore } from '@/store/tauri'
import { useIsMobile } from '@/hooks/useResponsive'

const { locale } = useI18n()
const isMobile = useIsMobile()
const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))
const elementSize = computed(() => (isMobile.value ? 'small' : 'default'))
const tauriStore = useTauriStore()
</script>

<template>
  <el-config-provider :locale="elementLocale" :size="elementSize">
    <TauriUpdater v-if="isTauri()" />
    <router-view />

    <!-- Tauri 关闭行为询问弹窗 -->
    <el-dialog
      v-if="isTauri()"
      v-model="tauriStore.showCloseDialog"
      title="关闭窗口"
      width="400px"
      :close-on-click-modal="false"
      :show-close="true"
      align-center
    >
      <p style="margin: 0 0 16px; color: var(--el-text-color-regular)">
        是否最小化到系统托盘继续运行？
      </p>
      <el-checkbox v-model="tauriStore.rememberChoice">记住我的选择</el-checkbox>
      <template #footer>
        <el-button @click="tauriStore.handleExit()">退出应用</el-button>
        <el-button type="primary" @click="tauriStore.handleMinimize()">最小化到托盘</el-button>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<style scoped>
</style>
