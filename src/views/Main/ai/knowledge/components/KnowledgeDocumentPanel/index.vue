<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { CommonEnum } from '@/enums'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import type { PageInfo } from '@/types/common'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeDocumentDetail,
  type AiKnowledgeDocumentItem,
  type AiKnowledgeIndexStatus,
  type AiKnowledgeInitResponse,
  type AiKnowledgeStatus,
} from '@/api/ai/knowledge'
import KnowledgeDocumentFormDialog from '../KnowledgeDocumentFormDialog/index.vue'
import KnowledgeChunkDialog from '../KnowledgeChunkDialog/index.vue'
import KnowledgeDocumentHero from '../KnowledgeDocumentHero/index.vue'
import RetrievalTestDialog from '../RetrievalTestDialog/index.vue'

interface Props {
  knowledgeBase: AiKnowledgeBaseItem | null
  refreshSignal: number
}

const props = defineProps<Props>()
const { t } = useI18n()

const dict = shallowRef<AiKnowledgeInitResponse['dict']>({
  common_status_arr: [],
  source_type_arr: [],
  index_status_arr: [],
})
const loading = shallowRef(false)
const documents = ref<AiKnowledgeDocumentItem[]>([])
const page = ref<PageInfo>({ current_page: 1, page_size: 20, total: 0, total_page: 0 })
const searchForm = ref({
  title: '',
  status: '' as AiKnowledgeStatus | '',
})

const formVisible = shallowRef(false)
const formMode = shallowRef<'add' | 'edit'>('add')
const editingDocument = shallowRef<AiKnowledgeDocumentDetail | null>(null)
const chunkDialogVisible = shallowRef(false)
const chunkDocument = shallowRef<AiKnowledgeDocumentItem | null>(null)
const retrievalDialogVisible = shallowRef(false)

const hasBase = computed(() => Boolean(props.knowledgeBase))

const searchFields = computed<SearchField[]>(() => [
  { key: 'title', type: 'input', label: t('aiKnowledge.document.title'), placeholder: t('aiKnowledge.document.title'), width: 170 },
  { key: 'status', type: 'select-v2', label: t('aiKnowledge.filter.status'), placeholder: t('aiKnowledge.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'title', label: t('aiKnowledge.document.title'), minWidth: 170 },
  { key: 'source_type', label: t('aiKnowledge.document.sourceType'), width: 110 },
  { key: 'index_status', label: t('aiKnowledge.document.indexStatus'), width: 120 },
  { key: 'status', label: t('aiKnowledge.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiKnowledge.table.updatedAt'), width: 150 },
  { key: 'actions', label: t('common.actions.action'), width: 400, fixed: 'right' },
])

function indexStatusType(status: AiKnowledgeIndexStatus) {
  if (status === 'indexed') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

async function loadInit() {
  const data = await AiKnowledgeApi.pageInit()
  dict.value = data.dict
}

async function loadDocuments() {
  const baseID = props.knowledgeBase?.id
  if (!baseID) {
    documents.value = []
    page.value = { ...page.value, current_page: 1, total: 0, total_page: 0 }
    return
  }
  loading.value = true
  try {
    const data = await AiKnowledgeApi.documents({
      knowledge_base_id: baseID,
      current_page: page.value.current_page,
      page_size: page.value.page_size,
      title: searchForm.value.title,
      status: searchForm.value.status,
    })
    documents.value = data.list
    page.value = data.page
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = { ...page.value, current_page: 1 }
  void loadDocuments()
}

function onPageChange(nextPage: PageInfo) {
  page.value = nextPage
  void loadDocuments()
}

function openAdd() {
  if (!props.knowledgeBase) {
    ElNotification.warning({ message: t('aiKnowledge.document.selectBase') })
    return
  }
  formMode.value = 'add'
  editingDocument.value = null
  formVisible.value = true
}

async function openEdit(row: AiKnowledgeDocumentItem) {
  formMode.value = 'edit'
  editingDocument.value = await AiKnowledgeApi.documentDetail({ id: row.id })
  formVisible.value = true
}

function openChunks(row: AiKnowledgeDocumentItem) {
  chunkDocument.value = row
  chunkDialogVisible.value = true
}

function openRetrievalTest() {
  if (!props.knowledgeBase) {
    ElNotification.warning({ message: t('aiKnowledge.document.selectBase') })
    return
  }
  retrievalDialogVisible.value = true
}

async function reindex(row: AiKnowledgeDocumentItem) {
  await AiKnowledgeApi.reindexDocument({ id: row.id })
  ElNotification.success({ message: t('aiKnowledge.document.reindexDone') })
  await loadDocuments()
}

async function changeDocumentStatus(row: AiKnowledgeDocumentItem, status: AiKnowledgeStatus) {
  try {
    await ElMessageBox.confirm(t('common.confirmStatusChange'), t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel'),
    })
  } catch {
    return
  }
  await AiKnowledgeApi.documentStatus({ id: row.id, status })
  ElNotification.success({ message: t('common.success.operation') })
  await loadDocuments()
}

async function deleteDocument(row: AiKnowledgeDocumentItem) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.actions.del'),
      cancelButtonText: t('common.actions.cancel'),
    })
  } catch {
    return
  }
  await AiKnowledgeApi.deleteDocument({ id: row.id })
  ElNotification.success({ message: t('common.success.operation') })
  await loadDocuments()
}

watch(
  () => [props.knowledgeBase?.id, props.refreshSignal] as const,
  () => {
    page.value = { ...page.value, current_page: 1 }
    void loadDocuments()
  }
)

onMounted(() => {
  loadInit().catch((error: unknown) => {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.initFailed') })
  })
  void loadDocuments()
})
</script>

<template>
  <div class="knowledge-document-panel">
    <KnowledgeDocumentHero
      :knowledge-base="knowledgeBase"
      @add="openAdd"
      @retrieval-test="openRetrievalTest"
    />

    <template v-if="hasBase">
      <div class="knowledge-document-panel__toolbar">
        <Search
          v-model="searchForm"
          :fields="searchFields"
          @query="onSearch"
          @reset="onSearch"
        />
      </div>
    </template>
    <el-empty
      v-else
      class="knowledge-document-panel__empty"
      :description="t('aiKnowledge.document.selectBaseTip')"
    />

    <AppTable
      v-if="hasBase"
      :columns="columns"
      :data="documents"
      :loading="loading"
      row-key="id"
      :pagination="page"
      :show-index="true"
      @refresh="loadDocuments"
      @update:pagination="onPageChange"
    >
      <template #cell-source_type="{ row }">
        <el-tag type="info">
          {{ row.source_type_name || row.source_type }}
        </el-tag>
      </template>
      <template #cell-index_status="{ row }">
        <el-tag :type="indexStatusType(row.index_status)">
          {{ row.index_status_name || row.index_status }}
        </el-tag>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
          {{ row.status_name || row.status }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          type="primary"
          text
          @click="openEdit(row)"
        >
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button
          type="success"
          text
          @click="reindex(row)"
        >
          {{ t('aiKnowledge.actions.reindex') }}
        </el-button>
        <el-button
          type="info"
          text
          @click="openChunks(row)"
        >
          {{ t('aiKnowledge.document.chunks') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.NO"
          type="warning"
          text
          @click="changeDocumentStatus(row, CommonEnum.YES)"
        >
          {{ t('common.actions.enable') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.YES"
          type="warning"
          text
          @click="changeDocumentStatus(row, CommonEnum.NO)"
        >
          {{ t('common.actions.disable') }}
        </el-button>
        <el-button
          type="danger"
          text
          @click="deleteDocument(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>

    <KnowledgeDocumentFormDialog
      v-model="formVisible"
      :mode="formMode"
      :knowledge-base="knowledgeBase"
      :row="editingDocument"
      :dict="dict"
      @saved="loadDocuments"
    />

    <KnowledgeChunkDialog
      v-model="chunkDialogVisible"
      :document="chunkDocument"
    />
    <RetrievalTestDialog
      v-model="retrievalDialogVisible"
      :knowledge-base="knowledgeBase"
    />
  </div>
</template>

<style scoped>
.knowledge-document-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
}

.knowledge-document-panel__toolbar {
  margin-bottom: 10px;
}

.knowledge-document-panel__empty {
  flex: 1;
  border: 1px dashed var(--el-border-color);
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
}

</style>
