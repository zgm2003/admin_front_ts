<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Close, Delete, Plus, Refresh } from '@element-plus/icons-vue'
import type { PageInfo } from '@/types/common'
import type { AiImageTaskItem, AiImageTaskStatus } from '@/api/ai/images'

interface Props {
  tasks: AiImageTaskItem[]
  page: PageInfo
  loading: boolean
  selectedTaskId: number | null
  canDelete: boolean
}

interface Emits {
  create: []
  refresh: []
  detail: [task: AiImageTaskItem]
  pageChange: [page: PageInfo]
  deleteSelected: [ids: number[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const selecting = shallowRef(false)
const selectedIds = shallowRef<number[]>([])

const hasRows = computed(() => props.tasks.length > 0)
const hasSelection = computed(() => selectedIds.value.length > 0)
const allSelected = computed(() => props.tasks.length > 0 && selectedIds.value.length === props.tasks.length)
const selectedSet = computed(() => new Set(selectedIds.value))
const totalText = computed(() => t('aiImages.recordsCount', { count: props.page.total }))

watch(
  () => props.tasks.map((task) => task.id),
  (visibleIds) => {
    const visibleSet = new Set(visibleIds)
    selectedIds.value = selectedIds.value.filter((id) => visibleSet.has(id))
    if (visibleIds.length === 0) {
      selecting.value = false
    }
  }
)

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function statusLabel(value: AiImageTaskStatus) {
  const labels = {
    pending: t('aiImages.statusPending'),
    running: t('aiImages.statusRunning'),
    success: t('aiImages.statusSuccess'),
    failed: t('aiImages.statusFailed'),
  } satisfies Record<AiImageTaskStatus, string>
  return labels[value]
}

function taskCardClass(task: AiImageTaskItem) {
  return {
    'record-card': true,
    'record-card--active': props.selectedTaskId === task.id,
    'record-card--checked': selectedSet.value.has(task.id),
  }
}

function updatePage(currentPage: number) {
  emit('pageChange', { ...props.page, current_page: currentPage })
}

function startSelecting() {
  selecting.value = true
  selectedIds.value = []
}

function cancelSelecting() {
  selecting.value = false
  selectedIds.value = []
}

function selectAll() {
  selectedIds.value = props.tasks.map((task) => task.id)
}

function toggleSelected(taskId: number) {
  if (selectedSet.value.has(taskId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== taskId)
    return
  }
  selectedIds.value = [...selectedIds.value, taskId]
}

function handleRecordClick(task: AiImageTaskItem) {
  if (selecting.value) {
    toggleSelected(task.id)
    return
  }
  emit('detail', task)
}

function deleteSelected() {
  if (!hasSelection.value) return
  emit('deleteSelected', selectedIds.value)
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
      <template v-if="selecting">
        <el-button :icon="Check" :disabled="!hasRows || allSelected" @click="selectAll">
          {{ t('aiImages.selectAll') }}
        </el-button>
        <el-button :icon="Close" @click="cancelSelecting">{{ t('aiImages.cancelSelection') }}</el-button>
        <el-button type="danger" :icon="Delete" :disabled="!canDelete || !hasSelection" @click="deleteSelected">
          {{ t('aiImages.deleteSelected') }}
        </el-button>
      </template>
      <template v-else>
        <el-button :disabled="!hasRows" @click="startSelecting">{{ t('aiImages.selectRecords') }}</el-button>
        <el-button :icon="Refresh" circle :title="t('common.actions.refresh')" :aria-label="t('common.actions.refresh')" @click="emit('refresh')" />
      </template>
    </div>

    <div class="records-list">
      <el-empty v-if="!hasRows" :description="t('aiImages.emptyHistory')" />
      <div v-for="task in tasks" v-else :key="task.id" :class="taskCardClass(task)" role="button" tabindex="0" @click="handleRecordClick(task)" @keydown.enter.prevent="handleRecordClick(task)">
        <el-checkbox
          v-if="selecting"
          class="record-check"
          :model-value="selectedSet.has(task.id)"
          :aria-label="t('aiImages.selectRecord')"
          @click.stop
          @change="toggleSelected(task.id)"
        />
        <span class="record-status-line">
          <el-tag :type="statusType(task.status)">{{ statusLabel(task.status) }}</el-tag>
          <span class="record-time">{{ task.created_at }}</span>
        </span>
        <span class="record-prompt">{{ task.prompt }}</span>
        <span class="record-meta">
          <span>{{ task.agent_name_snapshot }}</span>
          <span>{{ task.size }} · {{ task.quality }} · {{ task.n }}</span>
        </span>
      </div>
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
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
  position: relative;
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
.record-card--active,
.record-card--checked {
  border-color: color-mix(in srgb, var(--el-color-primary) 48%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 14px 32px rgba(20, 42, 74, 0.09);
  transform: translateY(-1px);
}

.record-card--active,
.record-card--checked {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 8%, var(--image-studio-surface, var(--el-bg-color))), var(--image-studio-surface-soft, var(--el-fill-color-extra-light)));
}

.record-check {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 1;
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
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
