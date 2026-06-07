<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { PageInfo } from '@/types/common'
import type { AiImageInitResponse, AiImageTaskItem, AiImageTaskStatus } from '@/api/ai/images'

interface Props {
  tasks: AiImageTaskItem[]
  page: PageInfo
  dict: AiImageInitResponse['dict']
  loading: boolean
  selectedTaskId: number | null
}

interface Emits {
  create: []
  refresh: []
  detail: [task: AiImageTaskItem]
  pageChange: [page: PageInfo]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const status = defineModel<AiImageTaskStatus | ''>('status', { required: true })
const favorite = defineModel<number | ''>('favorite', { required: true })
const { t } = useI18n()

const hasRows = computed(() => props.tasks.length > 0)
const totalText = computed(() => t('aiImages.recordsCount', { count: props.page.total }))
const statusLabelMap = computed(() => new Map(props.dict.status_arr.map((item) => [item.value, item.label])))

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function statusLabel(value: AiImageTaskStatus) {
  return statusLabelMap.value.get(value) ?? value
}

function taskCardClass(task: AiImageTaskItem) {
  return {
    'record-card': true,
    'record-card--active': props.selectedTaskId === task.id,
  }
}

function updatePage(currentPage: number) {
  emit('pageChange', { ...props.page, current_page: currentPage })
}
</script>

<template>
  <div class="records-panel" v-loading="loading">
    <header class="records-header">
      <div>
        <h2 class="records-title">{{ t('aiImages.records') }}</h2>
        <p class="records-count">{{ totalText }}</p>
      </div>
      <el-button :icon="Plus" @click="emit('create')">{{ t('aiImages.newTask') }}</el-button>
    </header>

    <div class="records-actions">
      <el-select-v2 v-model="status" :options="dict.status_arr" :placeholder="t('aiImages.status')" clearable />
      <el-select-v2 v-model="favorite" :options="dict.favorite_arr" :placeholder="t('aiImages.favorite')" clearable />
      <el-button :icon="Refresh" circle :title="t('common.actions.refresh')" :aria-label="t('common.actions.refresh')" @click="emit('refresh')" />
    </div>

    <div class="records-list">
      <el-empty v-if="!hasRows" :description="t('aiImages.emptyHistory')" />
      <button v-for="task in tasks" v-else :key="task.id" :class="taskCardClass(task)" type="button" @click="emit('detail', task)">
        <span class="record-status-line">
          <el-tag :type="statusType(task.status)">{{ statusLabel(task.status) }}</el-tag>
          <span class="record-time">{{ task.created_at }}</span>
        </span>
        <span class="record-prompt">{{ task.prompt }}</span>
        <span class="record-meta">
          <span>{{ task.agent_name_snapshot }}</span>
          <span>{{ task.size }} · {{ task.quality }} · {{ task.n }}</span>
        </span>
      </button>
    </div>

    <div class="records-pagination">
      <el-pagination
        small
        background
        layout="prev, pager, next"
        :page-size="page.page_size"
        :current-page="page.current_page"
        :total="page.total"
        @current-change="updatePage"
      />
    </div>
  </div>
</template>

<style scoped>
.records-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.records-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.records-title {
  color: var(--image-studio-text, var(--el-text-color-primary));
  font-size: 18px;
  font-weight: 760;
  line-height: 1.2;
  margin: 0;
}

.records-count {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
  margin: 7px 0 0;
}

.records-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.records-actions :deep(.el-select),
.records-actions :deep(.el-select-v2) {
  width: 100%;
}

.records-list {
  border: 1px dashed var(--image-studio-line-strong, var(--el-border-color));
  border-radius: 16px;
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  scrollbar-gutter: stable;
}

.record-card {
  width: 100%;
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 14px;
  background:
    linear-gradient(180deg, var(--image-studio-surface, var(--el-bg-color)), var(--image-studio-surface-soft, var(--el-fill-color-extra-light)));
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 10px;
  min-width: 0;
  padding: 12px;
  text-align: left;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);
}

.record-card:hover,
.record-card--active {
  border-color: color-mix(in srgb, var(--el-color-primary) 48%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 14px 32px rgba(20, 42, 74, 0.09);
  transform: translateY(-1px);
}

.record-card--active {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 8%, var(--image-studio-surface, var(--el-bg-color))), var(--image-studio-surface-soft, var(--el-fill-color-extra-light)));
}

.record-status-line,
.record-meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.record-time,
.record-meta {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.record-time,
.record-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-prompt {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--image-studio-text, var(--el-text-color-primary));
  display: -webkit-box;
  font-size: 13px;
  line-height: 1.65;
  overflow: hidden;
}

.records-pagination {
  display: flex;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
}

@media (max-width: 760px) {
  .records-actions {
    grid-template-columns: 1fr;
  }
}
</style>
