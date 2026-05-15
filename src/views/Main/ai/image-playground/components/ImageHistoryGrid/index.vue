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

function statusType(value: AiImageTaskStatus) {
  if (value === 'success') return 'success'
  if (value === 'failed') return 'danger'
  if (value === 'running') return 'warning'
  return 'info'
}

function updatePage(currentPage: number) {
  emit('pageChange', { ...props.page, current_page: currentPage })
}
</script>

<template>
  <el-card class="history-grid" shadow="never" v-loading="loading">
    <template #header>
      <div class="history-header">
        <div>
          <h3 class="history-title">{{ t('aiImages.history') }}</h3>
          <p class="history-subtitle">{{ t('aiImages.historyTip') }}</p>
        </div>
        <el-button @click="emit('refresh')">{{ t('common.actions.refresh') }}</el-button>
      </div>
    </template>

    <div class="history-filters">
      <el-select-v2 v-model="status" :options="dict.status_arr" :placeholder="t('aiImages.status')" clearable />
      <el-select-v2 v-model="favorite" :options="dict.favorite_arr" :placeholder="t('aiImages.favorite')" clearable />
    </div>

    <el-empty v-if="!hasRows" :description="t('aiImages.emptyHistory')" />
    <div v-else class="task-grid">
      <button v-for="task in tasks" :key="task.id" class="task-card" type="button" @click="emit('detail', task)">
        <div class="task-card-head">
          <el-tag :type="statusType(task.status)">{{ task.status_name || task.status }}</el-tag>
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
  </el-card>
</template>

<style scoped>
.history-grid {
  min-width: 0;
}

.history-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.history-title {
  font-size: 18px;
  margin: 0;
}

.history-subtitle {
  color: var(--el-text-color-secondary);
  margin: 6px 0 0;
}

.history-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.task-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 150px;
  padding: 14px;
  text-align: left;
}

.task-card:hover {
  border-color: var(--el-color-primary);
}

.task-card-head,
.task-meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.task-time,
.task-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.task-prompt {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  display: -webkit-box;
  flex: 1;
  line-height: 1.55;
  overflow: hidden;
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
