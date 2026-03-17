<template>
  <el-card shadow="never">
    <template #header>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;font-weight:700;">主题切换</span>
      </div>
    </template>
    <el-switch v-model="isDark" active-text="暗黑" inactive-text="明亮" @change="toggleDarkMode"/>
  </el-card>

  <el-card shadow="never" style="margin-top:16px;">
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:16px;font-weight:700;">下载功能测试</span>
        <el-button type="primary" size="small" @click="showManager = true">
          <el-icon><FolderOpened /></el-icon>
          下载管理器
        </el-button>
      </div>
    </template>
    
    <el-space direction="vertical" :size="16" style="width:100%;">
      <!-- 测试 URL 输入 -->
      <el-form :inline="true">
        <el-form-item label="下载 URL">
          <el-input
            v-model="testUrl"
            placeholder="输入文件 URL"
            style="width:400px;"
            clearable
          />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input
            v-model="testFilename"
            placeholder="建议的文件名（可选）"
            style="width:200px;"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleDownloadWithProgress">
            开始下载
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 快速测试 -->
      <div>
        <div style="margin-bottom:8px;color:var(--el-text-color-secondary);font-size:13px;">
          快速测试：
        </div>
        <el-space wrap>
          <el-button size="small" @click="downloadPreset('pdf')">
            <el-icon><Document /></el-icon>
            PDF 文档
          </el-button>
          <el-button size="small" @click="downloadPreset('image')">
            <el-icon><Picture /></el-icon>
            图片
          </el-button>
          <el-button size="small" @click="downloadPreset('video')">
            <el-icon><VideoPlay /></el-icon>
            视频 (1MB)
          </el-button>
          <el-button size="small" @click="downloadPreset('large')">
            <el-icon><Download /></el-icon>
            大文件 (10MB)
          </el-button>
          <el-button size="small" type="warning" @click="handleMultipleDownloads">
            批量下载 (3个)
          </el-button>
        </el-space>
      </div>

      <!-- 当前下载进度 -->
      <div v-if="currentDownload" class="current-download">
        <div class="download-header">
          <div class="file-info-compact">
            <el-icon class="file-icon" :size="20">
              <VideoPlay v-if="currentDownload.filename.includes('.mp4')" />
              <Document v-else />
            </el-icon>
            <span class="filename">{{ currentDownload.filename }}</span>
          </div>
          <span class="speed-badge">{{ formatSpeed(currentDownload.speed) }}</span>
        </div>
        
        <div class="progress-section">
          <el-progress
            :percentage="Math.round(currentDownload.progress)"
            :stroke-width="10"
            :show-text="false"
          />
          <div class="progress-info">
            <span class="progress-percent">{{ currentDownload.progress.toFixed(1) }}%</span>
            <span class="progress-size">
              {{ formatSize(currentDownload.downloaded) }} / {{ formatSize(currentDownload.total) }}
            </span>
          </div>
        </div>
      </div>
    </el-space>
  </el-card>

  <el-card shadow="never" style="margin-top:16px;">
    <template #header>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;font-weight:700;">富文本编辑器</span>
      </div>
    </template>
    <RichEditor v-model="content" :height="350" @change="onEditorChange"/>
  </el-card>

  <!-- 下载管理器抽屉 -->
  <DownloadManager v-model:visible="showManager" />
</template>
<script setup lang="ts">
import {ref, onMounted, defineAsyncComponent} from 'vue'
import {toggleDarkMode as _toggleDarkMode} from '@/utils/theme'
import {
  Document,
  Picture,
  VideoPlay,
  Download,
  FolderOpened,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { downloadFile, downloadManager, type DownloadProgress } from '@/components/DownloadManager'

const RichEditor = defineAsyncComponent(() => import('@/components/Editor').then(m => m.Editor))
const DownloadManager = defineAsyncComponent(() => import('@/components/DownloadManager').then(m => m.DownloadManager))

const isDark = ref(false)
const content = ref('<p>欢迎使用富文本编辑器</p>')

// 下载相关
const testUrl = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4')
const testFilename = ref('test-video.mp4')
const currentDownload = ref<DownloadProgress | null>(null)
const showManager = ref(false)

// 预设测试文件
const presetFiles = {
  pdf: {
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filename: 'test-document.pdf',
  },
  image: {
    url: 'https://picsum.photos/1920/1080',
    filename: 'test-image.jpg',
  },
  video: {
    url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
    filename: 'test-video.mp4',
  },
  large: {
    url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
    filename: 'large-video.mp4',
  },
}

const toggleDarkMode = (val: string | number | boolean) => {
  _toggleDarkMode(Boolean(val))
}

const onEditorChange = () => {
}

// 格式化文件大小
const formatSize = (bytes: number) => downloadManager.formatSize(bytes)

// 格式化速度
const formatSpeed = (bytesPerSecond: number) => downloadManager.formatSpeed(bytesPerSecond)

// 带进度的下载
const handleDownloadWithProgress = async () => {
  if (!testUrl.value) {
    ElMessage.warning('请输入下载 URL')
    return
  }

  try {
    currentDownload.value = null
    
    const downloadId = await downloadFile(testUrl.value, testFilename.value || undefined, {
      onProgress: (progress) => {
        currentDownload.value = progress
      },
      onCompleted: (_savePath) => {
        ElMessage.success(`下载完成`)
        setTimeout(() => {
          currentDownload.value = null
        }, 2000)
      },
      onFailed: (error) => {
        ElMessage.error(`下载失败: ${error}`)
        currentDownload.value = null
      },
    })
    
    // 用户取消时，清空当前下载状态
    if (!downloadId) {
      currentDownload.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
    currentDownload.value = null
  }
}

// 批量下载
const handleMultipleDownloads = async () => {
  const files = [
    presetFiles.pdf,
    presetFiles.image,
    presetFiles.video,
  ]

  ElMessage.info(`开始批量下载 ${files.length} 个文件`)

  for (const file of files) {
    try {
      await downloadFile(file.url, file.filename)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  ElMessage.success('批量下载已启动，请在下载管理器中查看')
  showManager.value = true
}

// 下载预设文件
const downloadPreset = async (type: keyof typeof presetFiles) => {
  const file = presetFiles[type]
  testUrl.value = file.url
  testFilename.value = file.filename
  await handleDownloadWithProgress()
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  _toggleDarkMode(isDark.value)
})
</script>


<style scoped lang="scss">
.current-download {
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-blank) 100%);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .download-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .file-info-compact {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;

      .file-icon {
        color: var(--el-color-primary);
        flex-shrink: 0;
      }

      .filename {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .speed-badge {
      flex-shrink: 0;
      padding: 4px 12px;
      background: var(--el-color-primary);
      color: white;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
    }
  }

  .progress-section {
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;

      .progress-percent {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-color-primary);
      }

      .progress-size {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
