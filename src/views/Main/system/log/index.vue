<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Document } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'
import SystemLogFileList from './components/SystemLogFileList.vue'
import SystemLogToolbar from './components/SystemLogToolbar.vue'
import SystemLogViewer from './components/SystemLogViewer.vue'
import { useSystemLog } from './composables/useSystemLog'

const { t } = useI18n()
const isMobile = useIsMobile()
const showSidebar = shallowRef(true)

const log = useSystemLog(t)

const selectFile = async (name: string) => {
  await log.selectFile(name)
  if (isMobile.value) showSidebar.value = false
}

onMounted(() => {
  void log.loadInit()
  void log.loadFiles()
})
</script>

<template>
  <div class="system-log-page">
    <el-button
      v-if="isMobile"
      class="mobile-toggle"
      size="small"
      :icon="Document"
      @click="showSidebar = !showSidebar"
    >
      {{ log.selectedFile.value || t('systemLog.sidebar.title') }}
    </el-button>

    <SystemLogFileList
      v-show="!isMobile || showSidebar"
      v-model:file-keyword="log.fileKeyword.value"
      :files="log.filteredFiles.value"
      :total="log.files.value.length"
      :selected-file="log.selectedFile.value"
      :loading="log.filesLoading.value"
      @refresh="log.loadFiles"
      @select="selectFile"
    />

    <section class="log-content-card">
      <SystemLogToolbar
        v-model:keyword="log.keyword.value"
        v-model:level="log.level.value"
        v-model:tail="log.tail.value"
        v-model:auto-scroll="log.autoScroll.value"
        :current-file="log.currentFile.value"
        :level-options="log.dict.value.log_level_arr"
        :tail-options="log.dict.value.log_tail_arr"
        :loading="log.contentLoading.value"
        :line-count="log.lines.value.length"
        :filter-summary="log.filterSummary.value"
        :has-active-filter="log.hasActiveFilter.value"
        @search="log.loadContent"
        @refresh="log.loadContent"
        @reset="log.resetFilters"
        @copy-file-name="log.copyFileName"
        @copy-visible-lines="log.copyVisibleLines"
      />

      <SystemLogViewer
        :lines="log.displayLines.value"
        :loading="log.contentLoading.value"
        :auto-scroll="log.autoScroll.value"
        @copy-line="log.copyLine"
      />
    </section>
  </div>
</template>

<style scoped>
.system-log-page {
  display: flex;
  height: 100%;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}

.mobile-toggle {
  flex-shrink: 0;
  width: 100%;
  justify-content: flex-start;
}

.log-content-card {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

@media (max-width: 768px) {
  .system-log-page {
    flex-direction: column;
    overflow: auto;
  }

  .log-content-card {
    min-height: 520px;
  }
}
</style>
