<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Document, Refresh, Search } from '@element-plus/icons-vue'
import type { SystemLogFileItem } from '@/api/system/log'

interface Props {
  files: SystemLogFileItem[]
  total: number
  selectedFile: string
  loading: boolean
}

interface Emits {
  refresh: []
  select: [name: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileKeyword = defineModel<string>('fileKeyword', { required: true })
const { t } = useI18n()

const countLabel = computed(() => `${props.files.length}/${props.total}`)
</script>

<template>
  <aside class="system-log-file-list">
    <div class="file-list-header">
      <div>
        <div class="file-list-title">
          {{ t('systemLog.sidebar.title') }}
        </div>
        <div class="file-list-count">
          {{ countLabel }}
        </div>
      </div>
      <el-button
        size="small"
        circle
        :loading="loading"
        :icon="Refresh"
        @click="emit('refresh')"
      />
    </div>

    <div class="file-search">
      <el-input
        v-model="fileKeyword"
        size="small"
        clearable
        :prefix-icon="Search"
        :placeholder="t('systemLog.sidebar.search')"
      />
    </div>

    <el-scrollbar class="file-scrollbar">
      <button
        v-for="file in files"
        :key="file.name"
        type="button"
        class="file-item"
        :class="{ active: selectedFile === file.name }"
        @click="emit('select', file.name)"
      >
        <span class="file-name-row">
          <el-icon :size="14">
            <Document />
          </el-icon>
          <span class="file-name">{{ file.name }}</span>
        </span>
        <span class="file-meta-row">
          <span>{{ file.size_human }}</span>
          <span>{{ file.mtime }}</span>
        </span>
      </button>

      <el-empty
        v-if="!files.length && !loading"
        class="file-empty"
        :description="fileKeyword ? t('systemLog.sidebar.noMatched') : t('systemLog.sidebar.empty')"
        :image-size="60"
      />
    </el-scrollbar>
  </aside>
</template>

<style scoped>
.system-log-file-list {
  display: flex;
  width: 296px;
  min-width: 296px;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.file-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}

.file-list-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.file-list-count {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.file-search {
  padding: 0 12px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.file-scrollbar {
  flex: 1;
  min-height: 0;
}

.file-item {
  width: 100%;
  padding: 11px 14px 11px 12px;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-left: 3px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.file-item:hover {
  background: var(--el-fill-color-light);
}

.file-item.active {
  border-left-color: var(--el-color-primary);
  background: linear-gradient(90deg, var(--el-color-primary-light-9), var(--el-bg-color));
}

.file-name-row,
.file-meta-row {
  display: flex;
  align-items: center;
}

.file-name-row {
  gap: 7px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta-row {
  justify-content: space-between;
  margin-top: 6px;
  padding-left: 21px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  gap: 8px;
}

.file-empty {
  padding-top: 36px;
}

@media (max-width: 768px) {
  .system-log-file-list {
    width: 100%;
    min-width: 0;
    max-height: 280px;
  }
}
</style>
