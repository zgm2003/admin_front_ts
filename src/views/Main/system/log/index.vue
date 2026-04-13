<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  SystemLogApi,
  type SystemLogFileItem,
  type SystemLogInitResponse,
} from '@/api/system/log'
import { ElNotification } from 'element-plus'
import { Refresh, Document, Search } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

const { t } = useI18n()
const isMobile = useIsMobile()

const files = ref<SystemLogFileItem[]>([])
const filesLoading = ref(false)
const selectedFile = ref('')

const lines = ref<string[]>([])
const contentLoading = ref(false)
const keyword = ref('')
const level = ref('')
const tail = ref(500)
const logContainerRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const dict = ref<SystemLogInitResponse['dict']>({
  log_level_arr: [],
  log_tail_arr: [],
})
const showSidebar = ref(true)

const loadFiles = async () => {
  filesLoading.value = true
  try {
    const res = await SystemLogApi.files()
    files.value = res.list
    if (files.value.length && !selectedFile.value) {
      const firstFile = files.value[0]
      if (!firstFile) return
      selectedFile.value = firstFile.name
      await loadContent()
    }
  } catch (e: unknown) {
    ElNotification.error({ message: e instanceof Error ? e.message : t('systemLog.error.loadFiles') })
  } finally {
    filesLoading.value = false
  }
}

const loadContent = async () => {
  if (!selectedFile.value) return
  contentLoading.value = true
  try {
    const res = await SystemLogApi.content({
      filename: selectedFile.value,
      keyword: keyword.value,
      level: level.value,
      tail: tail.value,
    })
    lines.value = res.lines
    if (autoScroll.value) {
      nextTick(() => {
        const el = logContainerRef.value
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  } catch (e: unknown) {
    ElNotification.error({ message: e instanceof Error ? e.message : t('systemLog.error.loadContent') })
  } finally {
    contentLoading.value = false
  }
}

const onSelectFile = (name: string) => {
  selectedFile.value = name
  keyword.value = ''
  level.value = ''
  loadContent()
  // 移动端选完文件自动收起侧栏
  if (isMobile.value) showSidebar.value = false
}

const onSearch = () => loadContent()

const getLineClass = (line: string): string => {
  if (line.includes('.ERROR:') || line.includes('.CRITICAL:') || line.includes('Exception') || line.includes('Stack trace'))
    return 'log-error'
  if (line.includes('.WARNING:')) return 'log-warning'
  if (line.includes('.INFO:')) return 'log-info'
  if (line.includes('.DEBUG:')) return 'log-debug'
  return ''
}

const highlightLine = (line: string): string => {
  let text = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (!keyword.value) return text
  const specialChars = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'])
  let escaped = ''
  for (const ch of keyword.value) {
    if (specialChars.has(ch)) escaped += '\\' + ch
    else escaped += ch
  }
  const regex = new RegExp('(' + escaped + ')', 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

onMounted(() => {
  SystemLogApi.init().then((res) => {
    dict.value = res.dict
  })
  void loadFiles()
})
</script>

<template>
  <div class="system-log-page">
    <!-- 移动端：文件列表切换按钮 -->
    <el-button v-if="isMobile" class="mobile-toggle" size="small" @click="showSidebar = !showSidebar" :icon="Document">
      {{ selectedFile || t('systemLog.sidebar.title') }}
    </el-button>

    <!-- 左侧文件列表 -->
    <div v-show="!isMobile || showSidebar" class="log-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">{{ t('systemLog.sidebar.title') }}</span>
        <el-button size="small" circle @click="loadFiles" :loading="filesLoading" :icon="Refresh" />
      </div>
      <el-scrollbar class="file-list">
        <div
          v-for="f in files" :key="f.name"
          class="file-item" :class="{ active: selectedFile === f.name }"
          @click="onSelectFile(f.name)"
        >
          <div class="file-name">
            <el-icon :size="14"><Document /></el-icon>
            <span>{{ f.name }}</span>
          </div>
          <div class="file-meta">
            <span>{{ f.size_human }}</span>
            <span>{{ f.mtime }}</span>
          </div>
        </div>
        <el-empty v-if="!files.length && !filesLoading" :description="t('systemLog.sidebar.empty')" :image-size="60" />
      </el-scrollbar>
    </div>

    <!-- 右侧日志内容 -->
    <div class="log-content">
      <div class="log-toolbar">
        <el-input v-model="keyword" :placeholder="t('systemLog.toolbar.keyword')" clearable style="width: 220px"
          @keyup.enter="onSearch" @clear="onSearch">
          <template #prefix><el-icon :size="14"><Search /></el-icon></template>
        </el-input>
        <el-select-v2 v-model="level" :options="dict.log_level_arr" :placeholder="t('systemLog.toolbar.level')" clearable style="width: 130px" @change="onSearch" />
        <el-select-v2 v-model="tail" :options="dict.log_tail_arr" style="width: 150px" @change="onSearch" />
        <el-button type="primary" @click="onSearch" :loading="contentLoading" :icon="Search">
          {{ t('systemLog.toolbar.query') }}
        </el-button>
        <el-button @click="loadContent" :loading="contentLoading" :icon="Refresh">
          {{ t('systemLog.toolbar.refresh') }}
        </el-button>
        <div class="toolbar-right">
          <el-checkbox v-model="autoScroll">{{ t('systemLog.toolbar.autoScroll') }}</el-checkbox>
          <el-tag type="info" size="small">{{ lines.length }} {{ t('systemLog.toolbar.lines') }}</el-tag>
        </div>
      </div>

      <div ref="logContainerRef" class="log-viewer" v-loading="contentLoading">
        <div v-if="lines.length" class="log-lines">
          <div v-for="(line, idx) in lines" :key="idx" class="log-line" :class="getLineClass(line)">
            <span class="line-number">{{ idx + 1 }}</span>
            <span class="line-content" v-html="highlightLine(line)"></span>
          </div>
        </div>
        <el-empty v-else-if="!contentLoading" :description="t('systemLog.empty')" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-log-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.mobile-toggle {
  flex-shrink: 0;
  margin-bottom: 8px;
  width: 100%;
  justify-content: flex-start;
}
.log-sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.file-item {
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background 0.2s;
}
.file-item:hover { background: var(--el-fill-color-light); }
.file-item.active {
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}
.file-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.file-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  min-height: 0;
}
.log-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}
.toolbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.log-viewer {
  flex: 1;
  overflow: auto;
  background: #1e1e1e;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 0;
}
.log-lines { padding: 8px 0; }
.log-line {
  display: flex;
  padding: 1px 12px;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-line:hover { background: rgba(255, 255, 255, 0.05); }
.line-number {
  min-width: 45px;
  text-align: right;
  padding-right: 12px;
  color: #858585;
  user-select: none;
  flex-shrink: 0;
}
.line-content { flex: 1; }
.log-error { color: #f48771; background: rgba(244, 135, 113, 0.08); }
.log-warning { color: #cca700; background: rgba(204, 167, 0, 0.08); }
.log-info { color: #89d185; }
.log-debug { color: #9cdcfe; }
:deep(mark) {
  background: #ffd33d;
  color: #1e1e1e;
  padding: 0 2px;
  border-radius: 2px;
}

/* 桌面端：左右布局 */
@media (min-width: 769px) {
  .system-log-page {
    flex-direction: row;
    gap: 12px;
  }
  .mobile-toggle { display: none; }
}

/* 移动端 */
@media (max-width: 768px) {
  .log-sidebar {
    width: 100%;
    min-width: auto;
    max-height: 240px;
    margin-bottom: 8px;
  }
  .log-viewer { min-height: 300px; }
  .log-toolbar { padding: 8px 12px; gap: 6px; }
  .toolbar-right { margin-left: 0; width: 100%; justify-content: space-between; }
  .log-line { padding: 1px 8px; font-size: 11px; }
  .line-number { min-width: 35px; padding-right: 8px; }
}
</style>
