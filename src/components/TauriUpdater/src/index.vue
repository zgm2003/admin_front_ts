<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { isTauri } from '@/utils/download'
import { TauriVersionApi } from '@/api/devTools/tauriVersion'
import { getVersion } from '@tauri-apps/api/app'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

const { t } = useI18n()

const isForceUpdate = ref(false)
const versionInfo = ref<any>(null)

// 获取平台名称
const getPlatformName = (): string => {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows-x86_64'
  if (ua.includes('mac')) return 'macos-x86_64'
  if (ua.includes('linux')) return 'linux-x86_64'
  return 'windows-x86_64'
}

// 客户端初始化
const clientInit = async () => {
  if (!isTauri()) {
    console.log('非 Tauri 环境，跳过初始化')
    return
  }

  try {
    const appVersion = await getVersion()
    const platformName = getPlatformName()

    const response: any = await TauriVersionApi.clientInit({
      version: appVersion,
      platform: platformName
    })

    // 版本不存在或返回空
    if (!response || Object.keys(response).length === 0) {
      console.log('版本信息不存在')
      return
    }

    versionInfo.value = response
    isForceUpdate.value = response.force_update

    // 需要强制更新
    if (response.force_update) {
      showForceUpdateDialog(response)
    }
  } catch (error) {
    console.error('客户端初始化失败:', error)
  }
}

// 显示强制更新对话框
const showForceUpdateDialog = async (info: any) => {
  try {
    await ElMessageBox.alert(`
      <div class="force-update-content">
        <h3 style="margin-top: 0;">需要强制更新</h3>
        <p>您的应用版本存在重要更新</p>
        <p>请立即更新到最新版本以继续使用</p>
        ${info?.notes ? `<div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <strong>更新说明：</strong><br>${info.notes.replace(/\n/g, '<br>')}
        </div>` : ''}
      </div>
    `, '强制更新提醒', {
      confirmButtonText: '立即更新',
      showCancelButton: false,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      dangerouslyUseHTMLString: true,
      type: 'warning'
    })

    if (info?.file_url) {
      window.open(info.file_url, '_blank')
    }
  } catch (error) {
    if (isForceUpdate.value) {
      setTimeout(() => showForceUpdateDialog(info), 1000)
    }
  }
}

// 检查普通更新
const checkUpdate = async () => {
  if (!isTauri()) return
  
  try {
    const update = await check()
    
    if (!update) return
    
    const action = await ElMessageBox.confirm(
      t('updater.newVersion', { version: update.version }),
      t('updater.title'),
      {
        confirmButtonText: t('updater.updateNow'),
        cancelButtonText: t('updater.later')
      }
    ).catch(() => null)
    
    if (action !== 'confirm') return
    
    ElMessageBox.alert(t('updater.downloading'), t('updater.updating'), {
      showClose: false,
      showConfirmButton: false
    })
    
    await update.downloadAndInstall()
    await relaunch()
  } catch (e) {
    console.warn('Update check failed:', e)
  }
}

onMounted(async () => {
  // 客户端初始化
  await clientInit()
  // 如果不需要强制更新，再检查普通更新
  if (!isForceUpdate.value) {
    checkUpdate()
  }
})
</script>

<template>
  <!-- 无渲染组件 -->
</template>
