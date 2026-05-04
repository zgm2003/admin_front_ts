<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Refresh, Search } from '@element-plus/icons-vue'
import type { DictOption } from '@/types/common'
import type { SystemLogFileItem, SystemLogLevel } from '@/api/system/log'

interface Props {
  currentFile: SystemLogFileItem | null
  levelOptions: DictOption<SystemLogLevel>[]
  tailOptions: DictOption<number>[]
  loading: boolean
  lineCount: number
  filterSummary: string
  hasActiveFilter: boolean
}

interface Emits {
  search: []
  refresh: []
  reset: []
  copyFileName: []
  copyVisibleLines: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const keyword = defineModel<string>('keyword', { required: true })
const level = defineModel<SystemLogLevel | ''>('level', { required: true })
const tail = defineModel<number>('tail', { required: true })
const autoScroll = defineModel<boolean>('autoScroll', { required: true })

const { t } = useI18n()

const currentFileLabel = computed(() => t('systemLog.meta.currentFile'))
</script>

<template>
  <section class="system-log-toolbar">
    <div class="meta-bar">
      <div class="current-file">
        <span class="meta-label">{{ currentFileLabel }}</span>
        <strong>{{ currentFile?.name || '-' }}</strong>
      </div>
      <div class="meta-details">
        <span v-if="currentFile">{{ currentFile.size_human }}</span>
        <span v-if="currentFile">{{ currentFile.mtime }}</span>
        <el-tag
          size="small"
          effect="plain"
          type="info"
        >
          {{ lineCount }} {{ t('systemLog.toolbar.lines') }}
        </el-tag>
        <el-tag
          v-if="hasActiveFilter"
          size="small"
          effect="plain"
          type="warning"
        >
          {{ t('systemLog.meta.filtered') }}
        </el-tag>
      </div>
    </div>

    <div class="control-bar">
      <el-input
        v-model="keyword"
        class="keyword-input"
        :placeholder="t('systemLog.toolbar.keyword')"
        clearable
        @keyup.enter="emit('search')"
        @clear="emit('search')"
      >
        <template #prefix>
          <el-icon :size="14">
            <Search />
          </el-icon>
        </template>
      </el-input>

      <el-select-v2
        v-model="level"
        class="level-select"
        :options="levelOptions"
        :placeholder="t('systemLog.toolbar.level')"
        clearable
        @change="emit('search')"
      />

      <el-select-v2
        v-model="tail"
        class="tail-select"
        :options="tailOptions"
        @change="emit('search')"
      />

      <el-button
        type="primary"
        :loading="loading"
        :icon="Search"
        @click="emit('search')"
      >
        {{ t('systemLog.toolbar.query') }}
      </el-button>

      <el-button
        :loading="loading"
        :icon="Refresh"
        @click="emit('refresh')"
      >
        {{ t('systemLog.toolbar.refresh') }}
      </el-button>

      <el-button
        :disabled="!hasActiveFilter || loading"
        @click="emit('reset')"
      >
        {{ t('systemLog.actions.resetFilter') }}
      </el-button>

      <div class="toolbar-spacer" />

      <el-checkbox v-model="autoScroll">
        {{ t('systemLog.toolbar.autoScroll') }}
      </el-checkbox>

      <el-button
        :icon="CopyDocument"
        :disabled="!currentFile"
        @click="emit('copyFileName')"
      >
        {{ t('systemLog.actions.copyFile') }}
      </el-button>

      <el-button
        :icon="CopyDocument"
        :disabled="!lineCount"
        @click="emit('copyVisibleLines')"
      >
        {{ t('systemLog.actions.copyVisible') }}
      </el-button>
    </div>

    <div class="filter-summary">
      {{ filterSummary }}
    </div>
  </section>
</template>

<style scoped>
.system-log-toolbar {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 8px;
}

.current-file {
  min-width: 0;
}

.current-file strong {
  display: block;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-label,
.meta-details {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.meta-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 12px;
  flex-wrap: wrap;
}

.keyword-input {
  width: 240px;
}

.level-select {
  width: 132px;
}

.tail-select {
  width: 150px;
}

.toolbar-spacer {
  flex: 1;
  min-width: 12px;
}

.filter-summary {
  overflow: hidden;
  padding: 0 16px 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .meta-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .meta-details {
    justify-content: flex-start;
  }

  .keyword-input,
  .level-select,
  .tail-select {
    width: 100%;
  }

  .control-bar {
    gap: 8px;
  }

  .toolbar-spacer {
    display: none;
  }
}
</style>
