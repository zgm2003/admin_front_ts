<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import type { PageInfo } from '@/types/common'
import type {
  AiKnowledgeBaseItem,
  AiKnowledgeChunkItem,
  AiKnowledgeDocumentItem,
  AiKnowledgeRetrievalChunk,
} from '@/api/ai/knowledge'

const activeTab = defineModel<string>('activeTab', { required: true })
const retrievalQuery = defineModel<string>('retrievalQuery', { required: true })
const contextPrompt = defineModel<string>('contextPrompt', { required: true })

const props = defineProps<{
  selectedBase: AiKnowledgeBaseItem | null
  documents: AiKnowledgeDocumentItem[]
  documentLoading: boolean
  documentPage: PageInfo
  chunks: AiKnowledgeChunkItem[]
  chunkLoading: boolean
  chunkPage: PageInfo
  retrievalLoading: boolean
  retrievalChunks: AiKnowledgeRetrievalChunk[]
}>()

const emit = defineEmits<{
  (e: 'add-document'): void
  (e: 'edit-document', row: AiKnowledgeDocumentItem): void
  (e: 'delete-document', row: AiKnowledgeDocumentItem): void
  (e: 'reindex-document', row: AiKnowledgeDocumentItem): void
  (e: 'view-chunks', row: AiKnowledgeDocumentItem): void
  (e: 'show-all-chunks'): void
  (e: 'run-retrieval'): void
  (e: 'load-documents', page?: PageInfo): void
  (e: 'load-chunks', documentId?: number, page?: PageInfo): void
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

const chunkColumns = computed(() => [
  { key: 'chunk_no', label: t('aiKnowledge.chunk.no'), width: 90 },
  { key: 'content', label: t('aiKnowledge.chunk.content'), minWidth: 360, overflowTooltip: true },
  { key: 'token_estimate', label: t('aiKnowledge.chunk.tokens'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 160 },
])
</script>

<template>
  <section class="knowledge-detail">
    <el-empty v-if="!props.selectedBase" :description="t('common.pleaseSelect')" />
    <template v-else>
      <div class="detail-header">
        <div>
          <h3>{{ props.selectedBase.name }}</h3>
          <p>{{ props.selectedBase.description || t('common.noData') }}</p>
        </div>
        <el-tag :type="props.selectedBase.status === CommonEnum.YES ? 'success' : 'danger'">
          {{ props.selectedBase.status_name }}
        </el-tag>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane :label="t('aiKnowledge.tabs.documents')" name="documents">
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
              <el-button type="success" @click="emit('add-document')">{{ t('aiKnowledge.document.add') }}</el-button>
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
              <el-button type="primary" text @click="emit('view-chunks', row)">{{ t('aiKnowledge.document.viewChunks') }}</el-button>
              <el-button type="primary" text @click="emit('edit-document', row)">{{ t('common.actions.edit') }}</el-button>
              <el-button type="warning" text @click="emit('reindex-document', row)">{{ t('aiKnowledge.document.reindex') }}</el-button>
              <el-button type="danger" text @click="emit('delete-document', row)">{{ t('common.actions.del') }}</el-button>
            </template>
          </AppTable>
        </el-tab-pane>

        <el-tab-pane :label="t('aiKnowledge.tabs.chunks')" name="chunks">
          <AppTable
            :columns="chunkColumns"
            :data="props.chunks"
            :loading="props.chunkLoading"
            row-key="id"
            :pagination="props.chunkPage"
            :show-index="true"
            @refresh="emit('load-chunks')"
            @update:pagination="(page: PageInfo) => emit('load-chunks', undefined, page)"
          >
            <template #toolbar-left>
              <el-button @click="emit('show-all-chunks')">{{ t('aiKnowledge.chunk.showAll') }}</el-button>
            </template>
          </AppTable>
        </el-tab-pane>

        <el-tab-pane :label="t('aiKnowledge.tabs.retrieval')" name="retrieval">
          <div class="retrieval-box">
            <el-input
              v-model="retrievalQuery"
              type="textarea"
              :rows="3"
              :placeholder="t('aiKnowledge.retrieval.placeholder')"
            />
            <el-button type="primary" :loading="props.retrievalLoading" @click="emit('run-retrieval')">
              {{ t('aiKnowledge.retrieval.run') }}
            </el-button>
          </div>
          <div class="retrieval-results">
            <el-card v-for="chunk in props.retrievalChunks" :key="`${chunk.document_id}-${chunk.chunk_no}`" shadow="never">
              <template #header>
                <span>{{ chunk.document_title }} #{{ chunk.chunk_no }} · {{ chunk.score.toFixed(2) }}</span>
              </template>
              <p>{{ chunk.content }}</p>
            </el-card>
            <el-input
              v-if="contextPrompt"
              v-model="contextPrompt"
              type="textarea"
              :rows="6"
              readonly
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </section>
</template>

<style scoped>
.knowledge-detail {
  min-height: 0;
  overflow: hidden;
  padding: 12px;
  border-radius: 10px;
  background: var(--el-bg-color);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-header h3,
.detail-header p {
  margin: 0;
}

.detail-header p {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.detail-tabs {
  height: calc(100% - 52px);
}

.detail-tabs :deep(.el-tabs__content),
.detail-tabs :deep(.el-tab-pane) {
  height: calc(100% - 8px);
}

.retrieval-box,
.retrieval-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-results {
  margin-top: 12px;
}

.retrieval-results p {
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .knowledge-detail {
    min-height: 420px;
  }
}
</style>
