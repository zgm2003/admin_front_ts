<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Download, 
  Document, 
  Picture, 
  VideoPlay, 
  FolderOpened,
  InfoFilled,
  Warning,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { 
  downloadFile, 
  downloadManager, 
  DownloadManager,
  type DownloadProgress 
} from '@/components/DownloadManager'
import { isTauri } from '@/store/tauri'

const activeTab = ref('basic')
const showDownloadManager = ref(false)

// 基础下载演示
const testUrl = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4')
const testFilename = ref('test-video.mp4')

// 带进度的下载
const currentDownload = ref<DownloadProgress | null>(null)
const isDownloading = computed(() => currentDownload.value?.status === 'downloading')

// 预设测试文件
const presetFiles = [
  {
    name: 'PDF 文档',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filename: 'test-document.pdf',
    icon: Document,
    type: 'document'
  },
  {
    name: '图片文件',
    url: 'https://picsum.photos/1920/1080',
    filename: 'test-image.jpg',
    icon: Picture,
    type: 'image'
  },
  {
    name: '小视频 (1MB)',
    url: 'https://www.w3schools.com/html/movie.mp4',
    filename: 'small-video.mp4',
    icon: VideoPlay,
    type: 'video'
  },
  {
    name: '大视频 (10MB)',
    url: 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/mp4/xgplayer-demo-360p.mp4',
    filename: 'large-video.mp4',
    icon: VideoPlay,
    type: 'video'
  }
]

// 格式化工具
const formatSize = (bytes: number) => downloadManager.formatSize(bytes)
const formatSpeed = (bytesPerSecond: number) => downloadManager.formatSpeed(bytesPerSecond)

// 简单下载
const handleSimpleDownload = async () => {
  if (!testUrl.value) {
    ElMessage.warning('请输入下载 URL')
    return
  }
  
  try {
    const downloadId = await downloadFile(testUrl.value, testFilename.value || undefined)
    // 只有成功开始下载时才显示消息（用户取消时返回 undefined）
    if (downloadId) {
      ElMessage.success('下载已开始')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
  }
}

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
      onCompleted: (savePath) => {
        ElMessage.success('下载完成')
        setTimeout(() => {
          currentDownload.value = null
        }, 2000)
      },
      onFailed: (error) => {
        ElMessage.error(`下载失败: ${error}`)
        currentDownload.value = null
      }
    })
    
    // 用户取消时，downloadId 为 undefined，清空当前下载状态
    if (!downloadId) {
      currentDownload.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
    currentDownload.value = null
  }
}

// 批量下载
const handleBatchDownload = async () => {
  ElMessage.info('开始批量下载 3 个文件')
  
  for (let i = 0; i < 3; i++) {
    const file = presetFiles[i]
    try {
      await downloadFile(file.url, file.filename)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('下载失败:', error)
    }
  }
  
  ElMessage.success('批量下载已启动')
  showDownloadManager.value = true
}

// 下载预设文件
const downloadPreset = async (file: typeof presetFiles[0]) => {
  testUrl.value = file.url
  testFilename.value = file.filename
  await handleDownloadWithProgress()
}

// API 文档数据
const downloadFileApi = [
  { name: 'url', type: 'string', required: true, default: '-', desc: '下载文件的 URL 地址' },
  { name: 'filename', type: 'string', required: false, default: 'undefined', desc: '建议的文件名（可选）' },
  { name: 'options', type: 'DownloadOptions', required: false, default: '{}', desc: '下载选项配置' }
]

const downloadOptionsApi = [
  { name: 'onProgress', type: '(progress: DownloadProgress) => void', required: false, desc: '下载进度回调' },
  { name: 'onCompleted', type: '(savePath: string) => void', required: false, desc: '下载完成回调' },
  { name: 'onFailed', type: '(error: string) => void', required: false, desc: '下载失败回调' }
]

const downloadProgressApi = [
  { name: 'id', type: 'string', desc: '下载任务唯一标识' },
  { name: 'status', type: "'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'", desc: '下载状态' },
  { name: 'downloaded', type: 'number', desc: '已下载字节数' },
  { name: 'total', type: 'number', desc: '文件总字节数' },
  { name: 'speed', type: 'number', desc: '下载速度（字节/秒）' },
  { name: 'progress', type: 'number', desc: '下载进度百分比（0-100）' },
  { name: 'filename', type: 'string', desc: '文件名' },
  { name: 'save_path', type: 'string', desc: '保存路径' },
  { name: 'error', type: 'string | undefined', desc: '错误信息' }
]

const downloadManagerApi = [
  { name: 'download(options)', type: 'Promise<string>', desc: '开始下载，返回任务 ID' },
  { name: 'cancel(id)', type: 'Promise<void>', desc: '取消指定下载任务' },
  { name: 'getProgress(id)', type: 'Promise<DownloadProgress | null>', desc: '获取指定任务进度' },
  { name: 'getAllDownloads()', type: 'Promise<DownloadProgress[]>', desc: '获取所有下载任务' },
  { name: 'remove(id)', type: 'Promise<void>', desc: '删除指定任务记录' },
  { name: 'openFolder(path)', type: 'Promise<void>', desc: '打开文件所在文件夹' },
  { name: 'formatSize(bytes)', type: 'string', desc: '格式化文件大小' },
  { name: 'formatSpeed(bytesPerSecond)', type: 'string', desc: '格式化下载速度' }
]

const componentPropsApi = [
  { name: 'v-model:visible', type: 'boolean', default: 'false', desc: '控制下载管理器抽屉的显示/隐藏' }
]

const bestPractices = [
  {
    title: '1. 环境检测',
    desc: '使用 isTauri() 判断运行环境，Tauri 环境提供完整下载功能，Web 环境自动降级',
    code: `import { isTauri } from '@/components/DownloadManager'

if (isTauri()) {
  // Tauri 环境：完整下载功能
} else {
  // Web 环境：浏览器下载
}`
  },
  {
    title: '2. 简单下载',
    desc: '最简单的用法，适合不需要进度显示的场景',
    code: `import { downloadFile } from '@/components/DownloadManager'

// 基础下载
await downloadFile('https://example.com/file.pdf')

// 指定文件名
await downloadFile('https://example.com/file.pdf', 'report.pdf')`
  },
  {
    title: '3. 带进度的下载',
    desc: '适合大文件下载，提供实时进度反馈',
    code: `await downloadFile(url, filename, {
  onProgress: (progress) => {
    console.log(\`进度: \${progress.progress}%\`)
    console.log(\`速度: \${progress.speed} bytes/s\`)
  },
  onCompleted: (savePath) => {
    console.log('下载完成:', savePath)
  },
  onFailed: (error) => {
    console.error('下载失败:', error)
  }
})`
  },
  {
    title: '4. 使用下载管理器',
    desc: '高级用法，完全控制下载流程',
    code: `import { downloadManager } from '@/components/DownloadManager'

// 开始下载
const taskId = await downloadManager.download({
  url: 'https://example.com/video.mp4',
  filename: 'tutorial.mp4',
  onProgress: (progress) => {
    updateUI(progress)
  }
})

// 取消下载
await downloadManager.cancel(taskId)

// 获取进度
const progress = await downloadManager.getProgress(taskId)

// 获取所有任务
const allTasks = await downloadManager.getAllDownloads()`
  },
  {
    title: '5. 格式化工具',
    desc: '使用内置工具格式化文件大小和速度',
    code: `import { downloadManager } from '@/components/DownloadManager'

// 格式化文件大小
const size = downloadManager.formatSize(1024 * 1024 * 5.5)
// 输出: "5.50 MB"

// 格式化下载速度
const speed = downloadManager.formatSpeed(1024 * 500)
// 输出: "500.00 KB/s"`
  },
  {
    title: '6. 错误处理',
    desc: '正确处理用户取消（返回 undefined）和下载失败（抛出错误）',
    code: `// ✅ 推荐：检查返回值
const downloadId = await downloadFile(url, filename)
if (downloadId) {
  ElMessage.success('下载已开始')
}

// 处理其他错误
try {
  const downloadId = await downloadFile(url, filename)
  if (downloadId) {
    ElMessage.success('下载已开始')
  }
} catch (error: any) {
  // 只有真正的错误才会到这里
  ElMessage.error(error.message || '下载失败')
}`
  }
]

const features = [
  { icon: CircleCheck, title: 'Tauri 桌面环境', items: ['文件保存对话框', '实时下载进度', '后台下载', '取消下载', '下载完成通知', '打开文件夹', '下载历史管理', '智能文件类型过滤'] },
  { icon: Warning, title: 'Web 浏览器环境', items: ['自动降级到浏览器下载', '支持 <a download> 标签', '新窗口打开 URL'] }
]
</script>

<template>
  <div class="download-demo">
    <!-- 环境提示 -->
    <el-alert 
      v-if="!isTauri()" 
      type="warning" 
      :closable="false"
      style="margin-bottom: 20px;"
    >
      <template #title>
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon><InfoFilled /></el-icon>
          <span>当前为 Web 环境，下载功能将使用浏览器默认下载方式</span>
        </div>
      </template>
      <div style="margin-top: 8px; font-size: 13px;">
        完整的下载管理功能（进度显示、取消、历史管理等）仅在 Tauri 桌面应用中可用。
        <br>
        在 Web 环境下，点击下载会直接触发浏览器下载或打开新窗口。
      </div>
    </el-alert>

    <el-tabs v-model="activeTab">
      <!-- 基础用法 -->
      <el-tab-pane label="基础用法" name="basic">
        <div class="demo-section">
          <h3>
            <el-icon><Download /></el-icon>
            简单下载
          </h3>
          <p class="section-desc">最简单的下载方式，适合不需要进度显示的场景</p>
          
          <div class="demo-block">
            <el-form :inline="true">
              <el-form-item label="下载 URL">
                <el-input
                  v-model="testUrl"
                  placeholder="输入文件 URL"
                  style="width: 400px;"
                  clearable
                />
              </el-form-item>
              <el-form-item label="文件名">
                <el-input
                  v-model="testFilename"
                  placeholder="建议的文件名（可选）"
                  style="width: 200px;"
                  clearable
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSimpleDownload">
                  <el-icon><Download /></el-icon>
                  开始下载
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="demo-code">
            <pre><code>import { downloadFile } from '@/components/DownloadManager'

// 基础下载
await downloadFile('{{ testUrl }}')

// 指定文件名
await downloadFile('{{ testUrl }}', '{{ testFilename }}')</code></pre>
          </div>
        </div>

        <div class="demo-section">
          <h3>
            <el-icon><VideoPlay /></el-icon>
            带进度的下载
          </h3>
          <p class="section-desc">适合大文件下载，提供实时进度、速度显示</p>
          
          <div class="demo-block">
            <el-button 
              type="primary" 
              :loading="isDownloading"
              @click="handleDownloadWithProgress"
            >
              <el-icon><Download /></el-icon>
              {{ isDownloading ? '下载中...' : '开始下载（带进度）' }}
            </el-button>
            
            <!-- 进度显示 -->
            <div v-if="currentDownload" class="progress-display">
              <div class="progress-header">
                <div class="file-info">
                  <el-icon class="file-icon" :size="20">
                    <VideoPlay v-if="currentDownload.filename.includes('.mp4')" />
                    <Document v-else />
                  </el-icon>
                  <span class="filename">{{ currentDownload.filename }}</span>
                </div>
                <span class="speed-badge">{{ formatSpeed(currentDownload.speed) }}</span>
              </div>
              
              <el-progress
                :percentage="Math.round(currentDownload.progress)"
                :stroke-width="12"
                :show-text="false"
              />
              
              <div class="progress-footer">
                <span class="progress-percent">{{ currentDownload.progress.toFixed(1) }}%</span>
                <span class="progress-size">
                  {{ formatSize(currentDownload.downloaded) }} / {{ formatSize(currentDownload.total) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="demo-code">
            <pre><code>await downloadFile(url, filename, {
  onProgress: (progress) => {
    console.log(`进度: ${progress.progress}%`)
    console.log(`速度: ${formatSpeed(progress.speed)}`)
  },
  onCompleted: (savePath) => {
    ElMessage.success('下载完成')
  },
  onFailed: (error) => {
    ElMessage.error(`下载失败: ${error}`)
  }
})</code></pre>
          </div>
        </div>

        <div class="demo-section">
          <h3>
            <el-icon><FolderOpened /></el-icon>
            快速测试
          </h3>
          <p class="section-desc">点击下方按钮快速测试不同类型文件的下载</p>
          
          <div class="demo-block">
            <el-space wrap :size="12">
              <el-button
                v-for="file in presetFiles"
                :key="file.name"
                @click="downloadPreset(file)"
              >
                <el-icon><component :is="file.icon" /></el-icon>
                {{ file.name }}
              </el-button>
              
              <el-button type="warning" @click="handleBatchDownload">
                <el-icon><Download /></el-icon>
                批量下载（3个文件）
              </el-button>
            </el-space>
          </div>
        </div>
        
        <div class="demo-section">
          <h3>
            <el-icon><FolderOpened /></el-icon>
            下载管理器
          </h3>
          <p class="section-desc">查看和管理所有下载任务（仅 Tauri 环境）</p>
          
          <div class="demo-block">
            <el-button 
              type="primary" 
              :disabled="!isTauri()"
              @click="showDownloadManager = true"
            >
              <el-icon><FolderOpened /></el-icon>
              打开下载管理器
            </el-button>
            <el-text v-if="!isTauri()" type="info" style="margin-left: 12px;">
              （Web 环境不支持）
            </el-text>
          </div>
          
          <div class="demo-code">
            <pre><code>&lt;DownloadManager v-model:visible="showManager" /&gt;</code></pre>
          </div>
        </div>
      </el-tab-pane>

      <!-- API 文档 -->
      <el-tab-pane label="API 文档" name="api">
        <div class="demo-section">
          <h3>downloadFile() 函数</h3>
          <p class="section-desc">便捷的下载函数，自动适配 Tauri/Web 环境</p>
          
          <el-table :data="downloadFileApi" border>
            <el-table-column prop="name" label="参数名" width="120" />
            <el-table-column prop="type" label="类型" width="150" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                  {{ row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="default" label="默认值" width="120" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        
        <div class="demo-section">
          <h3>DownloadOptions 配置</h3>
          <p class="section-desc">下载选项配置对象</p>
          
          <el-table :data="downloadOptionsApi" border>
            <el-table-column prop="name" label="属性名" width="150" />
            <el-table-column prop="type" label="类型" width="300" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag type="info" size="small">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        
        <div class="demo-section">
          <h3>DownloadProgress 进度对象</h3>
          <p class="section-desc">下载进度信息对象结构</p>
          
          <el-table :data="downloadProgressApi" border>
            <el-table-column prop="name" label="属性名" width="150" />
            <el-table-column prop="type" label="类型" width="300" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        
        <div class="demo-section">
          <h3>downloadManager 管理器</h3>
          <p class="section-desc">下载管理器单例，提供完整的下载控制能力</p>
          
          <el-table :data="downloadManagerApi" border>
            <el-table-column prop="name" label="方法名" width="200" />
            <el-table-column prop="type" label="返回类型" width="250" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        
        <div class="demo-section">
          <h3>DownloadManager 组件</h3>
          <p class="section-desc">下载管理器 UI 组件</p>
          
          <el-table :data="componentPropsApi" border>
            <el-table-column prop="name" label="属性名" width="200" />
            <el-table-column prop="type" label="类型" width="150" />
            <el-table-column prop="default" label="默认值" width="120" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 最佳实践 -->
      <el-tab-pane label="最佳实践" name="practices">
        <div 
          v-for="(practice, index) in bestPractices" 
          :key="index"
          class="demo-section"
        >
          <h3>{{ practice.title }}</h3>
          <p class="section-desc">{{ practice.desc }}</p>
          
          <div class="demo-code">
            <pre><code>{{ practice.code }}</code></pre>
          </div>
        </div>
        
        <div class="demo-section">
          <h3>7. 注意事项</h3>
          <el-alert type="info" :closable="false">
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>环境检测</strong>：代码会自动检测运行环境（Tauri/Web），无需手动判断</li>
              <li><strong>用户取消</strong>：用户在保存对话框中点击取消时，会抛出 "用户取消下载" 错误</li>
              <li><strong>错误处理</strong>：建议使用 try-catch 包裹下载调用，处理可能的错误</li>
              <li><strong>大文件下载</strong>：对于大文件（>10MB），建议使用进度回调，提供更好的用户体验</li>
              <li><strong>并发下载</strong>：下载管理器支持多个任务同时下载</li>
              <li><strong>文件覆盖</strong>：如果用户选择的保存路径已存在文件，系统会提示是否覆盖</li>
            </ul>
          </el-alert>
        </div>
      </el-tab-pane>
      
      <!-- 功能特性 -->
      <el-tab-pane label="功能特性" name="features">
        <el-row :gutter="20">
          <el-col 
            v-for="(feature, index) in features" 
            :key="index"
            :xs="24" 
            :sm="12"
          >
            <el-card class="feature-card">
              <template #header>
                <div class="feature-header">
                  <el-icon :size="24" :color="index === 0 ? 'var(--el-color-success)' : 'var(--el-color-warning)'">
                    <component :is="feature.icon" />
                  </el-icon>
                  <span>{{ feature.title }}</span>
                </div>
              </template>
              
              <ul class="feature-list">
                <li v-for="(item, i) in feature.items" :key="i">
                  <el-icon color="var(--el-color-primary)"><CircleCheck /></el-icon>
                  {{ item }}
                </li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
        
        <div class="demo-section" style="margin-top: 20px;">
          <h3>技术架构</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="前端框架">Vue 3 + TypeScript</el-descriptions-item>
            <el-descriptions-item label="桌面框架">Tauri 2.x</el-descriptions-item>
            <el-descriptions-item label="后端语言">Rust</el-descriptions-item>
            <el-descriptions-item label="HTTP 客户端">reqwest (Rust)</el-descriptions-item>
            <el-descriptions-item label="异步运行时">tokio</el-descriptions-item>
            <el-descriptions-item label="取消机制">tokio::select! (100ms 响应)</el-descriptions-item>
            <el-descriptions-item label="进度更新">500ms 间隔</el-descriptions-item>
            <el-descriptions-item label="文件对话框">tauri-plugin-dialog</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 下载管理器组件 -->
    <DownloadManager v-if="isTauri()" v-model:visible="showDownloadManager" />
  </div>
</template>

<style scoped lang="scss">
.download-demo {
  height: 100%;
}

.demo-section {
  margin-bottom: 32px;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .section-desc {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
}

.demo-block {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--el-fill-color-blank);
}

.demo-code {
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  
  pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-wrap: break-word;
    
    code {
      display: block;
    }
  }
}

// 进度显示样式
.progress-display {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-blank) 100%);
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .file-info {
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
  
  .progress-footer {
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

// 功能特性卡片
.feature-card {
  height: 100%;
  margin-bottom: 20px;
  
  .feature-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 600;
  }
  
  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
      
      &:not(:last-child) {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .demo-block {
    padding: 16px;
  }
  
  .demo-section :deep(.el-table) {
    font-size: 12px;
  }
  
  .demo-code pre {
    font-size: 12px;
  }
  
  .progress-display {
    padding: 16px;
  }
}
</style>
