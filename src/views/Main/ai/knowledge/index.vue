<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import {
  AiKnowledgeMapApi,
  type AiKnowledgeDocumentItem,
  type AiKnowledgeDocumentMutationParams,
  type AiKnowledgeMapInitResponse,
  type AiKnowledgeMapItem,
  type AiKnowledgeMapMutationParams,
  type AiKnowledgeSourceType,
  type AiKnowledgeVisibility,
  type JsonObject,
} from '@/api/ai/knowledgeMaps'

interface MapForm {
  id?: number
  provider_id: number | null
  name: string
  code: string
  engine_dataset_id: string
  visibility: AiKnowledgeVisibility
  meta_json_text: string
  status: number
}

interface DocumentForm {
  name: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  meta_json_text: string
  status: number
}

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = shallowRef<AiKnowledgeMapInitResponse['dict']>({
  visibility_arr: [],
  source_type_arr: [],
  indexing_status_arr: [],
  common_status_arr: [],
  provider_options: [],
})

const searchForm = ref({
  name: '',
  code: '',
  visibility: '' as AiKnowledgeVisibility | '',
  provider_id: '' as number | '',
  status: '' as number | '',
})

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
  confirmDel,
  toggleStatus,
} = useCrudTable<AiKnowledgeMapItem>({
  api: AiKnowledgeMapApi,
  searchForm,
})

const mapDialogVisible = ref(false)
const mapDialogMode = ref<'add' | 'edit'>('add')
const mapFormRef = ref<FormInstance | null>(null)
const mapForm = ref<MapForm>(defaultMapForm())

const selectedMap = ref<AiKnowledgeMapItem | null>(null)
const documentLoading = ref(false)
const documentList = ref<AiKnowledgeDocumentItem[]>([])
const documentDialogVisible = ref(false)
const documentFormRef = ref<FormInstance | null>(null)
const documentForm = ref<DocumentForm>(defaultDocumentForm())

function defaultMapForm(): MapForm {
  return {
    provider_id: null,
    name: '',
    code: '',
    engine_dataset_id: '',
    visibility: 'private',
    meta_json_text: '{}',
    status: CommonEnum.YES,
  }
}

function defaultDocumentForm(): DocumentForm {
  return {
    name: '',
    source_type: 'text',
    source_ref: '',
    content: '',
    meta_json_text: '{}',
    status: CommonEnum.YES,
  }
}

const mapRules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiKnowledge.form.name') + t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('aiKnowledge.form.code') + t('common.required'), trigger: 'blur' }],
  provider_id: [{ required: true, message: t('aiKnowledge.form.provider') + t('common.required'), trigger: 'change' }],
  visibility: [{ required: true, message: t('aiKnowledge.form.visibility') + t('common.required'), trigger: 'change' }],
}))

const documentRules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiKnowledge.document.title') + t('common.required'), trigger: 'blur' }],
  source_type: [{ required: true, message: t('aiKnowledge.document.sourceType') + t('common.required'), trigger: 'change' }],
}))

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiKnowledge.filter.name'), placeholder: t('aiKnowledge.filter.name'), width: 160 },
  { key: 'code', type: 'input', label: t('aiKnowledge.filter.code'), placeholder: t('aiKnowledge.filter.code'), width: 150 },
  { key: 'provider_id', type: 'select-v2', label: t('aiKnowledge.filter.provider'), placeholder: t('aiKnowledge.filter.provider'), width: 180, options: dict.value.provider_options },
  { key: 'visibility', type: 'select-v2', label: t('aiKnowledge.filter.visibility'), placeholder: t('aiKnowledge.filter.visibility'), width: 130, options: dict.value.visibility_arr },
  { key: 'status', type: 'select-v2', label: t('aiKnowledge.filter.status'), placeholder: t('aiKnowledge.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiKnowledge.table.name'), minWidth: 160 },
  { key: 'code', label: t('aiKnowledge.table.code'), width: 140 },
  { key: 'provider_name', label: t('aiKnowledge.table.provider'), width: 160 },
  { key: 'engine_dataset_id', label: t('aiKnowledge.table.dataset'), minWidth: 180, overflowTooltip: true },
  { key: 'visibility', label: t('aiKnowledge.table.visibility'), width: 110 },
  { key: 'status', label: t('aiKnowledge.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiKnowledge.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 300 },
])

function jsonText(value: JsonObject | null | undefined): string {
  return value ? JSON.stringify(value, null, 2) : '{}'
}

function parseJsonObject(text: string, errorMessage: string): JsonObject | null {
  const raw = text.trim()
  if (!raw) return null
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(errorMessage)
  return parsed as JsonObject
}

async function init() {
  const data = await AiKnowledgeMapApi.init()
  dict.value = data.dict
}

function addMap() {
  mapDialogMode.value = 'add'
  mapForm.value = defaultMapForm()
  mapDialogVisible.value = true
  void nextTick(() => mapFormRef.value?.clearValidate())
}

function editMap(row: AiKnowledgeMapItem) {
  mapDialogMode.value = 'edit'
  mapForm.value = {
    id: row.id,
    provider_id: row.provider_id,
    name: row.name,
    code: row.code,
    engine_dataset_id: row.engine_dataset_id,
    visibility: row.visibility,
    meta_json_text: jsonText(row.meta_json),
    status: row.status,
  }
  mapDialogVisible.value = true
  void nextTick(() => mapFormRef.value?.clearValidate())
}

async function submitMap() {
  if (!mapFormRef.value) return
  try {
    await mapFormRef.value.validate()
  } catch {
    return
  }
  if (!mapForm.value.provider_id) return

  let meta: JsonObject | null
  try {
    meta = parseJsonObject(mapForm.value.meta_json_text, t('aiKnowledge.form.invalidJson'))
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.form.invalidJson') })
    return
  }

  const payload: AiKnowledgeMapMutationParams = {
    id: mapForm.value.id,
    provider_id: mapForm.value.provider_id,
    name: mapForm.value.name,
    code: mapForm.value.code,
    engine_dataset_id: mapForm.value.engine_dataset_id || undefined,
    visibility: mapForm.value.visibility,
    meta_json: meta,
    status: mapForm.value.status,
  }
  const api = mapDialogMode.value === 'add' ? AiKnowledgeMapApi.add : AiKnowledgeMapApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  mapDialogVisible.value = false
  await getList()
}

async function syncMap(row: AiKnowledgeMapItem) {
  await AiKnowledgeMapApi.sync({ id: row.id })
  ElNotification.success({ message: t('aiKnowledge.syncDone') })
  await getList()
}

async function selectMap(row: AiKnowledgeMapItem) {
  selectedMap.value = row
  await loadDocuments()
}

async function loadDocuments() {
  if (!selectedMap.value) return
  documentLoading.value = true
  try {
    const data = await AiKnowledgeMapApi.documents({ knowledge_map_id: selectedMap.value.id })
    documentList.value = data.list
  } finally {
    documentLoading.value = false
  }
}

function addDocument() {
  if (!selectedMap.value) {
    ElNotification.warning({ message: t('common.pleaseSelect') })
    return
  }
  documentForm.value = defaultDocumentForm()
  documentDialogVisible.value = true
  void nextTick(() => documentFormRef.value?.clearValidate())
}

async function submitDocument() {
  if (!documentFormRef.value || !selectedMap.value) return
  try {
    await documentFormRef.value.validate()
  } catch {
    return
  }
  let meta: JsonObject | null
  try {
    meta = parseJsonObject(documentForm.value.meta_json_text, t('aiKnowledge.form.invalidJson'))
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiKnowledge.form.invalidJson') })
    return
  }
  const payload: AiKnowledgeDocumentMutationParams = {
    knowledge_map_id: selectedMap.value.id,
    name: documentForm.value.name,
    source_type: documentForm.value.source_type,
    source_ref: documentForm.value.source_ref || undefined,
    content: documentForm.value.content || undefined,
    meta_json: meta,
    status: documentForm.value.status,
  }
  await AiKnowledgeMapApi.addDocument(payload)
  ElNotification.success({ message: t('common.success.operation') })
  documentDialogVisible.value = false
  await loadDocuments()
}

async function refreshDocument(row: AiKnowledgeDocumentItem) {
  await AiKnowledgeMapApi.refreshDocumentStatus({ id: row.id })
  ElNotification.success({ message: t('common.success.operation') })
  await loadDocuments()
}

async function deleteDocument(row: AiKnowledgeDocumentItem) {
  await AiKnowledgeMapApi.deleteDocument({ id: row.id })
  ElNotification.success({ message: t('common.success.operation') })
  await loadDocuments()
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="knowledge-map-page">
    <div class="knowledge-map-page__left">
      <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #toolbar-left>
          <el-button type="success" @click="addMap">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-name="{ row }">
          <el-button text type="primary" @click="selectMap(row)">{{ row.name }}</el-button>
        </template>
        <template #cell-visibility="{ row }">
          <el-tag>{{ row.visibility_name || row.visibility }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="editMap(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="success" text @click="syncMap(row)">{{ t('aiKnowledge.actions.sync') }}</el-button>
          <el-button type="info" text @click="selectMap(row)">{{ t('aiKnowledge.document.title') }}</el-button>
          <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>

    <div class="knowledge-map-page__right">
      <div class="document-header">
        <div>
          <h3>{{ selectedMap?.name || t('aiKnowledge.document.selectMap') }}</h3>
          <p>{{ selectedMap?.engine_dataset_id || '-' }}</p>
        </div>
        <el-button type="primary" :disabled="!selectedMap" @click="addDocument">{{ t('aiKnowledge.document.add') }}</el-button>
      </div>
      <el-table v-loading="documentLoading" :data="documentList" size="small" height="100%">
        <el-table-column prop="name" :label="t('aiKnowledge.document.title')" min-width="160" />
        <el-table-column prop="source_type_name" :label="t('aiKnowledge.document.sourceType')" width="110">
          <template #default="{ row }">{{ row.source_type_name || row.source_type }}</template>
        </el-table-column>
        <el-table-column prop="indexing_status" :label="t('aiKnowledge.document.indexStatus')" width="130" />
        <el-table-column prop="error_message" :label="t('aiKnowledge.document.error')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('common.actions.action')" width="170">
          <template #default="{ row }">
            <el-button type="primary" text @click="refreshDocument(row)">{{ t('common.actions.refresh') }}</el-button>
            <el-button type="danger" text @click="deleteDocument(row)">{{ t('common.actions.del') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>

  <AppDialog v-model="mapDialogVisible" :width="isMobile ? '94vw' : '760px'" height="68vh">
    <template #header>{{ mapDialogMode === 'add' ? t('aiKnowledge.addTitle') : t('aiKnowledge.editTitle') }}</template>
    <el-form ref="mapFormRef" :model="mapForm" :rules="mapRules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.name')" prop="name" required><el-input v-model="mapForm.name" /></el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.code')" prop="code" required><el-input v-model="mapForm.code" /></el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.provider')" prop="provider_id" required>
            <el-select-v2 v-model="mapForm.provider_id" :options="dict.provider_options" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.visibility')" prop="visibility" required>
            <el-select-v2 v-model="mapForm.visibility" :options="dict.visibility_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiKnowledge.form.dataset')"><el-input v-model="mapForm.engine_dataset_id" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiKnowledge.form.metaJson')"><el-input v-model="mapForm.meta_json_text" type="textarea" :rows="7" /></el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="mapDialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="submitMap">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>

  <AppDialog v-model="documentDialogVisible" :width="isMobile ? '94vw' : '720px'">
    <template #header>{{ t('aiKnowledge.document.add') }}</template>
    <el-form ref="documentFormRef" :model="documentForm" :rules="documentRules" label-width="auto" :validate-on-rule-change="false">
      <el-form-item :label="t('aiKnowledge.document.title')" prop="name" required><el-input v-model="documentForm.name" /></el-form-item>
      <el-form-item :label="t('aiKnowledge.document.sourceType')" prop="source_type" required>
        <el-select-v2 v-model="documentForm.source_type" :options="dict.source_type_arr" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('aiKnowledge.document.sourceRef')"><el-input v-model="documentForm.source_ref" /></el-form-item>
      <el-form-item :label="t('aiKnowledge.document.content')"><el-input v-model="documentForm.content" type="textarea" :rows="6" /></el-form-item>
      <el-form-item :label="t('aiKnowledge.form.metaJson')"><el-input v-model="documentForm.meta_json_text" type="textarea" :rows="4" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="documentDialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="submitDocument">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.knowledge-map-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.knowledge-map-page__left,
.knowledge-map-page__right {
  min-height: 0;
  overflow: auto;
  background: var(--el-bg-color);
}

.knowledge-map-page__left {
  display: flex;
  flex-direction: column;
}

.document-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.document-header h3,
.document-header p {
  margin: 0;
}

.document-header p {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .knowledge-map-page {
    grid-template-columns: 1fr;
    height: auto;
  }

  .knowledge-map-page__right {
    min-height: 420px;
  }
}
</style>
