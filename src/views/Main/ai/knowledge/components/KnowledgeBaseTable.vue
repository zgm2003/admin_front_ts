<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import type { PageInfo } from '@/types/common'
import type {
  AiKnowledgeBaseItem,
  AiKnowledgeBaseListParams,
  AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'

const searchForm = defineModel<AiKnowledgeBaseListParams>({ required: true })

const props = defineProps<{
  dict: AiKnowledgeInitResponse['dict']
  list: AiKnowledgeBaseItem[]
  loading: boolean
  page: PageInfo
  selectedId: number | null
}>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'page-change', page: PageInfo): void
  (e: 'refresh'): void
  (e: 'add'): void
  (e: 'select', id: number): void
  (e: 'edit', row: AiKnowledgeBaseItem): void
  (e: 'toggle-status', row: AiKnowledgeBaseItem, status: number): void
  (e: 'delete', row: AiKnowledgeBaseItem): void
}>()

const { t } = useI18n()

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiKnowledge.filter.name'), placeholder: t('aiKnowledge.filter.name'), width: 180 },
  {
    key: 'visibility',
    type: 'select-v2',
    label: t('aiKnowledge.filter.visibility'),
    placeholder: t('aiKnowledge.filter.visibility'),
    width: 140,
    options: props.dict.ai_knowledge_visibility_arr,
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiKnowledge.filter.status'),
    placeholder: t('aiKnowledge.filter.status'),
    width: 120,
    options: props.dict.common_status_arr,
  },
])

const columns = computed(() => [
  { key: 'name', label: t('aiKnowledge.table.name'), minWidth: 150 },
  { key: 'visibility', label: t('aiKnowledge.table.visibility'), width: 100 },
  { key: 'chunk', label: t('aiKnowledge.table.chunk'), width: 120 },
  { key: 'retrieval', label: t('aiKnowledge.table.retrieval'), width: 120 },
  { key: 'status', label: t('aiKnowledge.table.status'), width: 90 },
  { key: 'actions', label: t('common.actions.action'), width: 280 },
])
</script>

<template>
  <section class="knowledge-list">
    <Search v-model="searchForm" :fields="searchFields" @query="emit('search')" @reset="emit('search')" />
    <div class="table-area">
      <AppTable
        :columns="columns"
        :data="props.list"
        :loading="props.loading"
        row-key="id"
        :pagination="props.page"
        :show-index="true"
        @refresh="emit('refresh')"
        @update:pagination="(page: PageInfo) => emit('page-change', page)"
      >
        <template #toolbar-left>
          <el-button type="success" @click="emit('add')">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-name="{ row }">
          <div class="base-name" :class="{ active: props.selectedId === row.id }">
            <strong>{{ row.name }}</strong>
            <span v-if="row.description">{{ row.description }}</span>
          </div>
        </template>
        <template #cell-visibility="{ row }">
          <el-tag size="small">{{ row.visibility_name }}</el-tag>
        </template>
        <template #cell-chunk="{ row }">
          {{ row.chunk_size }} / {{ row.chunk_overlap }}
        </template>
        <template #cell-retrieval="{ row }">
          top {{ row.top_k }} / {{ row.score_threshold }}
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="emit('select', row.id)">{{ t('common.actions.view') }}</el-button>
          <el-button type="primary" text @click="emit('edit', row)">{{ t('common.actions.edit') }}</el-button>
          <el-button
            v-if="row.status === CommonEnum.NO"
            type="warning"
            text
            @click="emit('toggle-status', row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES"
            type="warning"
            text
            @click="emit('toggle-status', row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button type="danger" text @click="emit('delete', row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </section>
</template>

<style scoped>
.knowledge-list {
  display: flex;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  border-radius: 10px;
  background: var(--el-bg-color);
}

.table-area {
  flex: 1 1 auto;
  min-height: 0;
}

.base-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.base-name span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.base-name.active strong {
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .knowledge-list {
    min-height: 420px;
  }
}
</style>
