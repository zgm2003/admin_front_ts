<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import type { PageInfo } from '@/types/common'
import type { AiKnowledgeDocumentItem } from '@/api/ai/knowledge'

const props = defineProps<{
  documents: AiKnowledgeDocumentItem[]
  documentLoading: boolean
  documentPage: PageInfo
}>()

const emit = defineEmits<{
  (e: 'add-document'): void
  (e: 'edit-document', row: AiKnowledgeDocumentItem): void
  (e: 'delete-document', row: AiKnowledgeDocumentItem): void
  (e: 'reindex-document', row: AiKnowledgeDocumentItem): void
  (e: 'view-chunks', row: AiKnowledgeDocumentItem): void
  (e: 'load-documents', page?: PageInfo): void
}>()

const { t } = useI18n()

const documentColumns = computed(() => [
  { key: 'title', label: t('aiKnowledge.document.title'), minWidth: 180 },
  { key: 'chunk_count', label: t('aiKnowledge.document.chunkCount'), width: 90 },
  { key: 'index_status', label: t('aiKnowledge.document.indexStatus'), width: 100 },
  { key: 'status', label: t('aiKnowledge.document.status'), width: 90 },
  { key: 'created_at', label: t('common.createdAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 260 },
])
</script>

<template>
  <section class="document-panel">
    <AppTable
      :columns="documentColumns"
      :data="props.documents"
      :loading="props.documentLoading"
      row-key="id"
      :pagination="props.documentPage"
      :show-index="true"
      @refresh="emit('load-documents')"
      @update:pagination="(page: PageInfo) => emit('load-documents', page)"
    >
      <template #toolbar-left>
        <el-button type="success" @click="emit('add-document')">
          {{ t('aiKnowledge.document.add') }}
        </el-button>
      </template>
      <template #cell-index_status="{ row }">
        <el-tag :type="row.index_status === CommonEnum.YES ? 'success' : 'danger'" size="small">
          {{ row.index_status_name }}
        </el-tag>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'" size="small">
          {{ row.status_name }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button type="primary" text @click="emit('view-chunks', row)">
          {{ t('aiKnowledge.document.viewChunks') }}
        </el-button>
        <el-button type="primary" text @click="emit('edit-document', row)">
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button type="warning" text @click="emit('reindex-document', row)">
          {{ t('aiKnowledge.document.reindex') }}
        </el-button>
        <el-button type="danger" text @click="emit('delete-document', row)">
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>
  </section>
</template>

<style scoped>
.document-panel {
  height: 100%;
  min-height: 0;
}
</style>
