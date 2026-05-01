<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AiKnowledgeApi,
  type AiKnowledgeDocumentItem,
  type AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'
import KnowledgeBaseDialog from './components/KnowledgeBaseDialog.vue'
import KnowledgeBaseSummary from './components/KnowledgeBaseSummary.vue'
import KnowledgeBaseTable from './components/KnowledgeBaseTable.vue'
import KnowledgeChunkPanel from './components/KnowledgeChunkPanel.vue'
import KnowledgeDocumentDialog from './components/KnowledgeDocumentDialog.vue'
import KnowledgeDocumentPanel from './components/KnowledgeDocumentPanel.vue'
import KnowledgeRetrievalPanel from './components/KnowledgeRetrievalPanel.vue'
import { useKnowledgeBaseManager } from './composables/useKnowledgeBaseManager'
import { useKnowledgeChunks } from './composables/useKnowledgeChunks'
import { useKnowledgeDocuments } from './composables/useKnowledgeDocuments'
import { useKnowledgeRetrieval } from './composables/useKnowledgeRetrieval'

type KnowledgePageTab = 'bases' | 'documents' | 'chunks' | 'retrieval'

const { t } = useI18n()

const dict = ref<AiKnowledgeInitResponse['dict']>({
  common_status_arr: [],
  ai_knowledge_visibility_arr: [],
  ai_knowledge_index_status_arr: [],
  ai_knowledge_source_type_arr: [],
})

const activeTab = shallowRef<KnowledgePageTab>('bases')

const {
  searchForm,
  baseLoading,
  baseList,
  basePage,
  selectedBaseId,
  selectedBase,
  baseDialogVisible,
  baseDialogMode,
  baseForm,
  setBaseDialogRef,
  baseRules,
  getBaseList,
  onSearch,
  onPageChange,
  refresh,
  confirmDel,
  toggleStatus,
  setSelectedBase,
  openAddBase,
  openEditBase,
  submitBase: saveBase,
} = useKnowledgeBaseManager()

const {
  selectedDocumentId,
  chunkLoading,
  chunkList,
  chunkPage,
  loadChunks,
  resetSelectedDocument,
  showAllChunks,
} = useKnowledgeChunks(selectedBaseId)

const {
  documentLoading,
  documentList,
  documentPage,
  documentDialogVisible,
  documentDialogMode,
  documentForm,
  setDocumentDialogRef,
  documentRules,
  loadDocuments,
  openAddDocument,
  openEditDocument,
  submitDocument,
  deleteDocument,
  reindexDocument,
  viewChunks,
} = useKnowledgeDocuments({
  selectedBaseId,
  selectedDocumentId,
  loadChunks,
})

const {
  retrievalQuery,
  retrievalLoading,
  retrievalChunks,
  contextPrompt,
  runRetrievalTest,
} = useKnowledgeRetrieval({
  selectedBaseId,
  selectedBase,
})

const sourceTypeOptions = computed(() =>
  dict.value.ai_knowledge_source_type_arr.filter((item) => ['manual', 'text'].includes(item.value)),
)

function setCurrentBase(id: number, nextTab?: KnowledgePageTab) {
  setSelectedBase(id)
  resetSelectedDocument()
  if (nextTab) activeTab.value = nextTab
  void loadDocuments()
  void loadChunks()
}

function selectBase(id: number) {
  setCurrentBase(id, 'documents')
}

function openChunksTab() {
  activeTab.value = 'chunks'
}

function viewDocumentChunks(row: AiKnowledgeDocumentItem) {
  viewChunks(row, openChunksTab)
}

async function reloadBaseList(selectId?: number) {
  const result = await getBaseList()
  if (selectId) {
    setCurrentBase(selectId, 'documents')
    return
  }
  if (!selectedBaseId.value && result?.list?.[0]) {
    setCurrentBase(result.list[0].id)
  }
}

async function submitBase() {
  const selectId = await saveBase()
  if (selectId) {
    await reloadBaseList(selectId)
  }
}

onMounted(async () => {
  const data = await AiKnowledgeApi.init()
  dict.value = data.dict
  await reloadBaseList()
})
</script>

<template>
  <div class="knowledge-page">
    <el-tabs v-model="activeTab" class="knowledge-tabs">
      <el-tab-pane :label="t('aiKnowledge.tabs.bases')" name="bases" lazy>
        <div class="knowledge-pane">
          <KnowledgeBaseTable
            v-model="searchForm"
            :dict="dict"
            :list="baseList"
            :loading="baseLoading"
            :page="basePage"
            :selected-id="selectedBaseId"
            @search="onSearch"
            @page-change="onPageChange"
            @refresh="refresh"
            @add="openAddBase"
            @select="selectBase"
            @edit="openEditBase"
            @toggle-status="toggleStatus"
            @delete="confirmDel"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('aiKnowledge.tabs.documents')" name="documents" lazy>
        <div class="knowledge-pane detail-pane">
          <template v-if="selectedBase">
            <KnowledgeBaseSummary :base="selectedBase" />
            <div class="detail-pane__body">
              <KnowledgeDocumentPanel
                :documents="documentList"
                :document-loading="documentLoading"
                :document-page="documentPage"
                @add-document="openAddDocument"
                @edit-document="openEditDocument"
                @delete-document="deleteDocument"
                @reindex-document="reindexDocument"
                @view-chunks="viewDocumentChunks"
                @load-documents="loadDocuments"
              />
            </div>
          </template>
          <el-empty v-else class="knowledge-empty" :description="t('common.pleaseSelect')" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('aiKnowledge.tabs.chunks')" name="chunks" lazy>
        <div class="knowledge-pane detail-pane">
          <template v-if="selectedBase">
            <KnowledgeBaseSummary :base="selectedBase" />
            <div class="detail-pane__body">
              <KnowledgeChunkPanel
                :chunks="chunkList"
                :chunk-loading="chunkLoading"
                :chunk-page="chunkPage"
                @show-all-chunks="showAllChunks"
                @load-chunks="loadChunks"
              />
            </div>
          </template>
          <el-empty v-else class="knowledge-empty" :description="t('common.pleaseSelect')" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('aiKnowledge.tabs.retrieval')" name="retrieval" lazy>
        <div class="knowledge-pane detail-pane">
          <template v-if="selectedBase">
            <KnowledgeBaseSummary :base="selectedBase" />
            <div class="detail-pane__body">
              <KnowledgeRetrievalPanel
                v-model:retrieval-query="retrievalQuery"
                v-model:context-prompt="contextPrompt"
                :retrieval-loading="retrievalLoading"
                :retrieval-chunks="retrievalChunks"
                @run-retrieval="runRetrievalTest"
              />
            </div>
          </template>
          <el-empty v-else class="knowledge-empty" :description="t('common.pleaseSelect')" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <KnowledgeBaseDialog
      :ref="setBaseDialogRef"
      v-model="baseDialogVisible"
      v-model:form="baseForm"
      :mode="baseDialogMode"
      :dict="dict"
      :rules="baseRules"
      @submit="submitBase"
    />

    <KnowledgeDocumentDialog
      :ref="setDocumentDialogRef"
      v-model="documentDialogVisible"
      v-model:form="documentForm"
      :mode="documentDialogMode"
      :source-type-options="sourceTypeOptions"
      :rules="documentRules"
      @submit="submitDocument"
    />
  </div>
</template>

<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 12px;
  border-radius: 10px;
  background: var(--el-bg-color);
}

.knowledge-tabs {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.knowledge-tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
  margin: 0 0 12px;
}

.knowledge-tabs :deep(.el-tabs__content) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.knowledge-tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
}

.knowledge-pane {
  height: 100%;
  min-height: 0;
}

.detail-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-pane__body {
  min-height: 0;
  flex: 1 1 auto;
}

.knowledge-empty {
  height: 100%;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 10px;
}

@media (max-width: 768px) {
  .knowledge-page {
    height: auto;
    min-height: 100%;
  }

  .knowledge-tabs :deep(.el-tabs__content),
  .knowledge-tabs :deep(.el-tab-pane),
  .knowledge-pane {
    height: auto;
  }

  .detail-pane__body {
    min-height: 420px;
  }
}
</style>
