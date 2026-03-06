<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Loading, CircleClose } from '@element-plus/icons-vue'
import { useTauriStore } from '@/store/tauri'
import { TauriVersionApi } from '@/api/system/tauriVersion'
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater'

const { t } = useI18n()
const tauriStore = useTauriStore()

// 更新进度状态
const showUpdateDialog = ref(false)
const updateStatus = ref<'checking' | 'confirm' | 'downloading' | 'installing' | 'failed'>('checking')
const updateInfo = ref<{ version: string; body?: string } | null>(null)
const downloaded = ref(0)
const contentLength = ref(0)
const lastTimestamp = ref(0)
const lastDownloaded = ref(0)
const speed = ref(0)
const errorMessage = ref('')

const progress = computed(() => {
  if (contentLength.value <= 0) return 0
  return Math.min(100, (downloaded.value / contentLength.value) * 100)
})

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const formatSpeed = (bytesPerSecond: number): string => `${formatSize(bytesPerSecond)}/s`

// 处理下载事件回调
const handleDownloadEvent = (event: DownloadEvent) => {
  if (event.event === 'Started') {
    contentLength.value = event.data.contentLength ?? 0
    downloaded.value = 0
    speed.value = 0
    lastTimestamp.value = Date.now()
    lastDownloaded.value = 0
  } else if (event.event === 'Progress') {
    downloaded.value += event.data.chunkLength
    // 每 500ms 计算一次速度
    const now = Date.now()
    const elapsed = now - lastTimestamp.value
    if (elapsed >= 500) {
      speed.value = ((downloaded.value - lastDownloaded.value) / elapsed) * 1000
      lastTimestamp.value = now
      lastDownloaded.value = downloaded.value
    }
  } else if (event.event === 'Finished') {
    speed.value = 0
  }
}

// 执行下载并安装
const doDownloadAndInstall = async (update: Update, isForce: boolean) => {
  updateStatus.value = 'downloading'
  showUpdateDialog.value = true

  try {
    await update.download(handleDownloadEvent)
    updateStatus.value = 'installing'
    await update.install()

    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (error: any) {
    console.error('Update failed:', error)
    updateStatus.value = 'failed'
    errorMessage.value = error?.message || String(error)

    if (isForce) {
      ElNotification.error({ title: '更新失败', message: errorMessage.value, duration: 3000 })
      // 强制更新失败，3 秒后重试
      setTimeout(() => showForceUpdateDialog(), 3000)
    }
  }
}

// 重试更新
const retryUpdate = async () => {
  downloaded.value = 0
  contentLength.value = 0
  speed.value = 0
  errorMessage.value = ''
  updateStatus.value = 'downloading'

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (update) {
      await doDownloadAndInstall(update, false)
    }
  } catch (error: any) {
    updateStatus.value = 'failed'
    errorMessage.value = error?.message || String(error)
  }
}

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

// 强制更新
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

    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (update) {
      updateInfo.value = { version: update.version, body: update.body }
      await doDownloadAndInstall(update, true)
    }
  } catch (error: any) {
    console.error('Force update check failed:', error)
    if (tauriStore.forceUpdate) {
      ElNotification.error({ title: '检查更新失败', message: error?.message || String(error), duration: 3000 })
      setTimeout(() => showForceUpdateDialog(), 3000)
    }
  }
}

// 普通更新
const checkUpdate = async () => {
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return

    updateInfo.value = { version: update.version, body: update.body }

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

    await doDownloadAndInstall(update, false)
  } catch (e: any) {
    console.error('Update check failed:', e)
    ElNotification.error({
      title: '检查更新失败',
      message: e?.message || String(e),
      duration: 5000
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
  <!-- 更新进度弹窗 -->
  <el-dialog
    v-model="showUpdateDialog"
    :title="updateInfo ? `更新到 v${updateInfo.version}` : '应用更新'"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="updateStatus === 'failed' && !tauriStore.forceUpdate"
    align-center
  >
    <div class="update-progress">
      <!-- 下载中 -->
      <template v-if="updateStatus === 'downloading'">
        <div class="status-row">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在下载更新，请勿关闭程序...</span>
        </div>
        <el-progress
          :percentage="Math.round(progress)"
          :stroke-width="10"
          :show-text="false"
          style="margin: 16px 0 8px"
        />
        <div class="meta-row">
          <span>{{ formatSize(downloaded) }}<template v-if="contentLength > 0"> / {{ formatSize(contentLength) }}</template></span>
          <span v-if="speed > 0" class="speed">{{ formatSpeed(speed) }}</span>
          <span v-if="contentLength > 0" class="percent">{{ Math.round(progress) }}%</span>
        </div>
      </template>

      <!-- 安装中 -->
      <template v-else-if="updateStatus === 'installing'">
        <div class="status-row">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>下载完成，正在安装更新...</span>
        </div>
        <el-progress :percentage="100" :stroke-width="10" status="success" style="margin-top: 16px" />
      </template>

      <!-- 失败 -->
      <template v-else-if="updateStatus === 'failed'">
        <div class="status-row error">
          <el-icon><CircleClose /></el-icon>
          <span>更新失败</span>
        </div>
        <p class="error-message">{{ errorMessage }}</p>
      </template>
    </div>

    <template v-if="updateStatus === 'failed' && !tauriStore.forceUpdate" #footer>
      <el-button @click="showUpdateDialog = false">关闭</el-button>
      <el-button type="primary" @click="retryUpdate">重试</el-button>
    </template>
  </el-dialog>

  <!-- 关闭行为询问弹窗 -->
  <el-dialog
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
</template>

<style scoped>
.update-progress {
  padding: 4px 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.status-row.error {
  color: var(--el-color-danger);
}

.loading-icon {
  color: var(--el-color-primary);
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.meta-row .speed {
  color: var(--el-color-primary);
  font-weight: 600;
  padding: 2px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.meta-row .percent {
  margin-left: auto;
  font-weight: 600;
  color: var(--el-color-primary);
}

.error-message {
  margin: 12px 0 0;
  padding: 10px 12px;
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  color: var(--el-color-danger);
  font-size: 13px;
  word-break: break-all;
}
</style>
