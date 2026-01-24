<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useTauriStore } from '@/store/tauri'
import { TauriVersionApi } from '@/api/devTools/tauriVersion'

const { t } = useI18n()
const tauriStore = useTauriStore()

// 客户端初始化
const clientInit = async () => {
  try {
    await tauriStore.init()
    const res: any = await TauriVersionApi.clientInit({
      version: tauriStore.version,
      platform: tauriStore.platform
    })
    tauriStore.setForceUpdate(res?.force_update || false)
    
    if (tauriStore.forceUpdate) {
      showForceUpdateDialog()
    }
  } catch (error) {
    console.error('客户端初始化失败:', error)
  }
}

// 显示强制更新对话框
const showForceUpdateDialog = async () => {
  try {
    await ElMessageBox.alert('当前版本需要更新才能继续使用', '版本更新', {
      confirmButtonText: '立即更新',
      showCancelButton: false,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      type: 'warning'
    })

    // 直接调用 Tauri updater 下载安装
    ElMessageBox.alert('正在后台下载更新，请勿关闭程序，下载完成后将自动安装...', '更新中', {
      showClose: false,
      showConfirmButton: false
    })
    
    // 动态导入 Tauri 插件，避免 Web 端加载失败
    const { check } = await import('@tauri-apps/plugin-updater')
    const { relaunch } = await import('@tauri-apps/plugin-process')
    const update = await check()
    if (update) {
      await update.downloadAndInstall()
      await relaunch()
    }
  } catch (error: any) {
    console.error('Force update failed:', error)
    // 强制更新失败，继续弹窗
    if (tauriStore.forceUpdate) {
      ElMessageBox.close()
      ElNotification.error({ title: '更新失败', message: error?.message || String(error), duration: 3000 })
      setTimeout(() => showForceUpdateDialog(), 1000)
    }
  }
}

// 检查普通更新
const checkUpdate = async () => {
  try {
    // 动态导入 Tauri 插件，避免 Web 端加载失败
    const { check } = await import('@tauri-apps/plugin-updater')
    const { relaunch } = await import('@tauri-apps/plugin-process')
    const update = await check()
    console.log('update.json:', update)
    
    if (!update) return
    
    const message = update.body 
      ? `${t('updater.newVersion', { version: update.version })}<br><br>${update.body.replace(/\n/g, '<br>')}`
      : t('updater.newVersion', { version: update.version })
    
    const action = await ElMessageBox.confirm(
      message,
      t('updater.title'),
      {
        confirmButtonText: t('updater.updateNow'),
        cancelButtonText: t('updater.later'),
        dangerouslyUseHTMLString: true
      }
    ).catch(() => null)
    
    if (action !== 'confirm') return
    
    ElMessageBox.alert('正在后台下载更新，请勿关闭程序，下载完成后将自动安装...', '更新中', {
      showClose: false,
      showConfirmButton: false
    })
    
    await update.downloadAndInstall()
    await relaunch()
  } catch (e: any) {
    console.error('Update failed:', e)
    ElMessageBox.close()
    ElNotification.error({
      title: '更新失败',
      message: e?.message || String(e),
      duration: 0
    })
  }
}

onMounted(async () => {
  await clientInit()
  if (!tauriStore.forceUpdate) {
    checkUpdate()
  }
})
</script>

<template>
  <!-- 无渲染组件 -->
</template>
