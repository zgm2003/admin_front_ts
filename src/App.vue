<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enUs from 'element-plus/dist/locale/en.mjs'
import { isTauri } from '@/utils/download'

const { locale, t } = useI18n()
const elementLocale = computed(() => (locale.value === 'en-US' ? enUs : zhCn))

// Tauri 自动更新检测
const checkUpdate = async () => {
  if (!isTauri()) return
  try {
    const tauri = (window as any).__TAURI__
    const update = await tauri.updater.check()
    if (update) {
      const action = await ElMessageBox.confirm(
        `发现新版本 ${update.version}，是否立即更新？`,
        '版本更新',
        { confirmButtonText: '更新', cancelButtonText: '稍后' }
      ).catch(() => null)
      if (action === 'confirm') {
        ElMessageBox.alert('正在下载更新，请稍候...', '更新中', { showClose: false, showConfirmButton: false })
        await update.downloadAndInstall()
        // 安装完成后重启应用
        await tauri.core.invoke('plugin:process|restart')
      }
    }
  } catch (e) {
    console.warn('Update check failed:', e)
  }
}

onMounted(() => {
  checkUpdate()
})
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<style scoped>
</style>
