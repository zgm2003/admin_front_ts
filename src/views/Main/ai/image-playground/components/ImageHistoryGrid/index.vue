<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PageInfo } from '@/types/common'
import type { AiImageInitResponse, AiImageTaskItem, AiImageTaskStatus } from '@/api/ai/images'

interface Props {
  tasks: AiImageTaskItem[]
  page: PageInfo
  dict: AiImageInitResponse['dict']
  loading: boolean
}

interface Emits {
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
const statusLabelMap = computed(() => {
  return new Map(props.dict.status_arr.map((item) => [item.value, item.label]))
})

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function statusLabel(value: AiImageTaskStatus) {
  return statusLabelMap.value.get(value) ?? value
}

function updatePage(currentPage: number) {
  emit('pageChange', { ...props.page, current_page: currentPage })
}
</script>

<template>
  <div class="history-grid" v-loading="loading">
    <div class="history-toolbar">
      <el-select-v2 v-model="status" :options="dict.status_arr" :placeholder="t('aiImages.status')" clearable />
      <el-select-v2 v-model="favorite" :options="dict.favorite_arr" :placeholder="t('aiImages.favorite')" clearable />
      <el-button class="history-refresh" @click="emit('refresh')">{{ t('common.actions.refresh') }}</el-button>
    </div>

    <el-empty v-if="!hasRows" :description="t('aiImages.emptyHistory')" />
    <div v-else class="task-grid">
      <button v-for="task in tasks" :key="task.id" class="task-card" type="button" @click="emit('detail', task)">
        <div class="task-card-head">
          <el-tag :type="statusType(task.status)">{{ statusLabel(task.status) }}</el-tag>
          <span class="task-time">{{ task.created_at }}</span>
        </div>
        <div class="task-prompt">{{ task.prompt }}</div>
        <div class="task-meta">
          <span>{{ task.agent_name_snapshot }}</span>
          <span>{{ task.size }} · {{ task.quality }} · {{ task.n }}</span>
        </div>
      </button>
    </div>

    <div class="history-pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :page-size="page.page_size"
        :current-page="page.current_page"
        :total="page.total"
        @current-change="updatePage"
      />
    </div>
  </div>
</template>

<style scoped>
.history-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.history-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.history-toolbar :deep(.el-select),
.history-toolbar :deep(.el-select-v2) {
  width: 100%;
}

.history-refresh {
  min-width: 76px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
  gap: 14px;
  min-width: 0;
}

.task-card {
  position: relative;
  background:
    linear-gradient(180deg, var(--image-studio-surface, var(--el-bg-color)), var(--image-studio-surface-soft, var(--el-fill-color-extra-light)));
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 16px;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 156px;
  min-width: 0;
  padding: 16px;
  text-align: left;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    box-shadow var(--app-motion-fast) var(--app-ease-standard),
    transform var(--app-motion-fast) var(--app-ease-standard);
}

.task-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 44%, var(--image-studio-line, var(--el-border-color)));
  box-shadow: 0 14px 32px rgba(20, 42, 74, 0.08);
  transform: translateY(-2px);
}

.task-card:focus-visible {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.task-card-head,
.task-meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.task-time,
.task-meta {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.task-time,
.task-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-prompt {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--image-studio-text, var(--el-text-color-primary));
  display: -webkit-box;
  flex: 1;
  font-size: 14px;
  line-height: 1.65;
  overflow: hidden;
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  overflow-x: auto;
}

@media (max-width: 640px) {
  .history-toolbar {
    grid-template-columns: 1fr;
  }

  .history-refresh {
    width: 100%;
  }

  .history-pagination {
    justify-content: flex-start;
  }
}
</style>
