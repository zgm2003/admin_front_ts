<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import {
  AiKnowledgeApi,
  type AiKnowledgeDocumentItem,
  type AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'
import KnowledgeBaseDialog from './components/KnowledgeBaseDialog.vue'
import KnowledgeBaseTable from './components/KnowledgeBaseTable.vue'
import KnowledgeDetailPanel from './components/KnowledgeDetailPanel.vue'
import KnowledgeDocumentDialog from './components/KnowledgeDocumentDialog.vue'
import { useKnowledgeBaseManager } from './composables/useKnowledgeBaseManager'
import { useKnowledgeChunks } from './composables/useKnowledgeChunks'
import { useKnowledgeDocuments } from './composables/useKnowledgeDocuments'
import { useKnowledgeRetrieval } from './composables/useKnowledgeRetrieval'

const dict = ref<AiKnowledgeInitResponse['dict']>({
  common_status_arr: [],
  ai_knowledge_visibility_arr: [],
  ai_knowledge_index_status_arr: [],
  ai_knowledge_source_type_arr: [],
})

const activeTab = shallowRef('documents')

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

function selectBase(id: number) {
  setSelectedBase(id)
  resetSelectedDocument()
  activeTab.value = 'documents'
  void loadDocuments()
  void loadChunks()
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
    selectBase(selectId)
    return
  }
  if (!selectedBaseId.value && result?.list?.[0]) {
    selectBase(result.list[0].id)
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

    <KnowledgeDetailPanel
      v-model:active-tab="activeTab"
      v-model:retrieval-query="retrievalQuery"
      v-model:context-prompt="contextPrompt"
      :selected-base="selectedBase"
      :documents="documentList"
      :document-loading="documentLoading"
      :document-page="documentPage"
      :chunks="chunkList"
      :chunk-loading="chunkLoading"
      :chunk-page="chunkPage"
      :retrieval-loading="retrievalLoading"
      :retrieval-chunks="retrievalChunks"
      @add-document="openAddDocument"
      @edit-document="openEditDocument"
      @delete-document="deleteDocument"
      @reindex-document="reindexDocument"
      @view-chunks="viewDocumentChunks"
      @show-all-chunks="showAllChunks"
      @run-retrieval="runRetrievalTest"
      @load-documents="loadDocuments"
      @load-chunks="loadChunks"
    />

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
  display: grid;
  grid-template-rows: minmax(260px, 42%) minmax(360px, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .knowledge-page {
    display: flex;
    flex-direction: column;
    height: auto;
  }
}
</style>
