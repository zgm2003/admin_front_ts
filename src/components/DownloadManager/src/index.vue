<template>
  <el-drawer
    v-model="visible"
    :title="t('download.manager')"
    direction="rtl"
    size="500px"
    :close-on-click-modal="true"
  >
    <div class="download-manager">
      <!-- 空状态 -->
      <el-empty v-if="downloads.length === 0" :description="t('download.noTasks')" :image-size="120" />

      <!-- 下载列表 -->
      <div v-else ref="listRef" class="download-list">
        <transition-group name="list">
          <div
            v-for="item in sortedDownloads"
            :key="item.id"
            class="download-item"
            :class="`status-${item.status}`"
          >
            <!-- 文件图标和信息 -->
            <div class="item-header">
              <div class="file-icon-wrapper">
                <el-icon class="file-icon" :size="32">
                  <Document v-if="isDocument(item.filename)" />
                  <Picture v-else-if="isImage(item.filename)" />
                  <VideoPlay v-else-if="isVideo(item.filename)" />
                  <Files v-else />
                </el-icon>
              </div>
              
              <div class="file-info">
                <div class="filename" :title="item.filename">
                  {{ item.filename }}
                </div>
                <div class="file-meta">
                  <span class="file-size">
                    {{ formatSize(item.downloaded) }}
                    <template v-if="item.total > 0">
                      / {{ formatSize(item.total) }}
                    </template>
                  </span>
                  <span v-if="item.status === 'downloading'" class="speed">
                    {{ formatSpeed(item.speed) }}
                  </span>
                </div>
              </div>

              <!-- 状态图标 -->
              <div class="status-icon">
                <el-icon v-if="item.status === 'completed'" class="success" :size="24">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else-if="item.status === 'failed' || (item.status === 'downloading' && item.downloaded === 0)" class="error" :size="24">
                  <CircleClose />
                </el-icon>
                <el-icon v-else-if="item.status === 'downloading' && item.downloaded > 0" class="loading" :size="24">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="item.status === 'cancelled'" class="info" :size="24">
                  <Close />
                </el-icon>
              </div>
            </div>

            <!-- 进度条 -->
            <div v-if="item.status === 'downloading' || item.status === 'paused'" class="progress-wrapper">
              <el-progress
                :percentage="Math.round(item.progress)"
                :status="item.status === 'paused' ? 'warning' : undefined"
                :stroke-width="8"
                :show-text="false"
              />
              <span class="progress-text">{{ Math.round(item.progress) }}%</span>
            </div>

            <!-- 状态信息 -->
            <div v-if="item.status !== 'downloading' || item.downloaded === 0" class="status-message">
              <span v-if="item.status === 'completed'" class="success-text">
                {{ t('download.completed') }}
              </span>
              <span v-else-if="item.status === 'failed' || (item.status === 'downloading' && item.downloaded === 0)" class="error-text">
                {{ item.error || t('download.failed') }}
              </span>
              <span v-else-if="item.status === 'cancelled'" class="info-text">
                {{ t('download.cancelled') }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="actions">
              <!-- 只有真正在下载中的任务才显示取消按钮 -->
              <el-button
                v-if="item.status === 'downloading' && item.downloaded > 0"
                size="small"
                type="danger"
                text
                @click="handleCancel(item.id)"
              >
                <el-icon><Close /></el-icon>
                {{ t('download.cancel') }}
              </el-button>
              
              <template v-if="item.status === 'completed'">
                <el-button
                  size="small"
                  type="primary"
                  text
                  @click="handleOpenFolder(item.save_path)"
                >
                  <el-icon><FolderOpened /></el-icon>
                  {{ t('download.openFolder') }}
                </el-button>
                <el-button
                  size="small"
                  type="info"
                  text
                  @click="handleRemove(item.id)"
                >
                  <el-icon><Delete /></el-icon>
                  {{ t('common.actions.del') }}
                </el-button>
              </template>

              <!-- 失败、取消、或卡在 0 字节的任务，直接显示删除 -->
              <el-button
                v-if="item.status === 'failed' || item.status === 'cancelled' || (item.status === 'downloading' && item.downloaded === 0)"
                size="small"
                type="info"
                text
                @click="handleRemove(item.id)"
              >
                <el-icon><Delete /></el-icon>
                {{ t('common.actions.del') }}
              </el-button>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 底部操作 -->
      <div v-if="downloads.length > 0" class="footer-actions">
        <el-button @click="handleClearCompleted" :disabled="!hasCompleted">
          <el-icon><CircleCheck /></el-icon>
          {{ t('download.clearCompleted') }}
        </el-button>
        <el-button type="danger" plain @click="handleClearAll">
          <el-icon><Delete /></el-icon>
          {{ t('download.clearAll') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Document,
  Picture,
  VideoPlay,
  Files,
  CircleCheck,
  CircleClose,
  Loading,
  Close,
  FolderOpened,
  Delete,
} from '@element-plus/icons-vue'
import { downloadManager, type DownloadProgress } from './download'
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()

const visible = defineModel<boolean>('visible', { default: false })
const downloads = ref<DownloadProgress[]>([])
const listRef = ref<HTMLElement>()
let refreshTimer: number | null = null

// 正序显示（最新的在下面）
const sortedDownloads = computed(() => {
  return downloads.value
})

// 判断文件类型
const isDocument = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext || '')
}

const isImage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')
}

const isVideo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')
}

// 是否有已完成的任务
const hasCompleted = computed(() => {
  return downloads.value.some(d => d.status === 'completed')
})

// 格式化文件大小
const formatSize = (bytes: number) => downloadManager.formatSize(bytes)

// 格式化速度
const formatSpeed = (bytesPerSecond: number) => downloadManager.formatSpeed(bytesPerSecond)

// 滚动到底部（最新任务）
const scrollToBottom = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

// 刷新下载列表
const refreshDownloads = async () => {
  const oldLength = downloads.value.length
  downloads.value = await downloadManager.getAllDownloads()
  
  // 如果有新任务，滚动到底部
  if (downloads.value.length > oldLength) {
    scrollToBottom()
  }
}

// 监听抽屉打开，滚动到底部
watch(visible, (newVal) => {
  if (newVal) {
    scrollToBottom()
  }
})

// 取消下载
const handleCancel = async (id: string) => {
  try {
    await ElMessageBox.confirm(t('download.confirmCancel'), t('download.hint'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel'),
    })
    
    // 立即更新 UI 状态
    const task = downloads.value.find(d => d.id === id)
    if (task) {
      task.status = 'cancelled'
    }
    
    // 调用取消接口
    await downloadManager.cancel(id)
    
    // 刷新列表
    await refreshDownloads()
  } catch {
    // 用户取消操作
  }
}

// 打开文件夹
const handleOpenFolder = async (savePath: string) => {
  await downloadManager.openFolder(savePath)
}

// 删除任务
const handleRemove = async (id: string) => {
  await downloadManager.remove(id)
  await refreshDownloads()
}

// 清除已完成
const handleClearCompleted = async () => {
  const completedIds = downloads.value
    .filter(d => d.status === 'completed')
    .map(d => d.id)
  
  for (const id of completedIds) {
    await downloadManager.remove(id)
  }
  
  await refreshDownloads()
}

// 清空列表
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(t('download.confirmClearAll'), t('download.hint'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel'),
    })
    
    const allIds = downloads.value.map(d => d.id)
    for (const id of allIds) {
      await downloadManager.remove(id)
    }
    
    await refreshDownloads()
  } catch {
    // 用户取消操作
  }
}

// 启动定时刷新
onMounted(() => {
  refreshDownloads()
  refreshTimer = window.setInterval(refreshDownloads, 1000)
})

// 清理定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

// 暴露刷新方法
defineExpose({
  refresh: refreshDownloads,
})
</script>

<style scoped lang="scss">
.download-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.download-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
  
  // 列表动画
  .list-enter-active,
  .list-leave-active {
    transition: all 0.3s ease;
  }
  
  .list-enter-from {
    opacity: 0;
    transform: translateX(30px);
  }
  
  .list-leave-to {
    opacity: 0;
    transform: translateX(-30px);
  }
}

.download-item {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--el-color-primary);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    &::before {
      opacity: 1;
    }
  }

  &.status-completed::before {
    background: var(--el-color-success);
    opacity: 1;
  }

  &.status-failed::before {
    background: var(--el-color-danger);
    opacity: 1;
  }

  &.status-downloading::before {
    background: var(--el-color-primary);
    opacity: 1;
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  
  .file-icon {
    color: var(--el-color-primary);
  }
}

.file-info {
  flex: 1;
  min-width: 0;

  .filename {
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .file-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .speed {
      color: var(--el-color-primary);
      font-weight: 600;
      padding: 2px 8px;
      background: var(--el-color-primary-light-9);
      border-radius: 4px;
    }
  }
}

.status-icon {
  flex-shrink: 0;
  
  .success {
    color: var(--el-color-success);
  }
  
  .error {
    color: var(--el-color-danger);
  }
  
  .loading {
    color: var(--el-color-primary);
    animation: rotate 1s linear infinite;
  }
  
  .info {
    color: var(--el-text-color-secondary);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-wrapper {
  position: relative;
  margin-bottom: 12px;
  
  .progress-text {
    position: absolute;
    right: 0;
    top: -20px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
  }
}

.status-message {
  margin-bottom: 12px;
  font-size: 13px;
  
  .success-text {
    color: var(--el-color-success);
    font-weight: 500;
  }
  
  .error-text {
    color: var(--el-color-danger);
  }
  
  .info-text {
    color: var(--el-text-color-secondary);
  }
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-actions {
  padding: 16px 0 0;
  border-top: 1px solid var(--el-border-color);
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-shrink: 0;
}
</style>
