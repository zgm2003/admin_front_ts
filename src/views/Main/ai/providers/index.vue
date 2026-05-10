<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import {
  AiProviderApi,
  type AiProviderInitResponse,
  type AiProviderItem,
  type AiProviderHealthStatus,
  type AiProviderDriver,
  type AiProviderModelItem,
} from '@/api/ai/providers'
import ProviderFormDialog from './components/ProviderFormDialog.vue'
import ProviderModelList from './components/ProviderModelList.vue'
import { createDefaultProviderForm, type ProviderFormState } from './composables/useProviderForm'

const { t } = useI18n()
const dict = shallowRef<AiProviderInitResponse['dict']>({
  engine_type_arr: [],
  common_status_arr: [],
  health_status_arr: [],
  model_sync_arr: [],
})

const searchForm = shallowRef({
  name: '',
  engine_type: '' as AiProviderDriver | '',
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
} = useCrudTable<AiProviderItem>({
  api: AiProviderApi,
  searchForm,
})

const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<'add' | 'edit'>('add')
const currentInitial = shallowRef<Partial<ProviderFormState>>(createDefaultProviderForm())

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiProviders.filter.name'), placeholder: t('aiProviders.filter.name'), width: 180 },
  { key: 'engine_type', type: 'select-v2', label: t('aiProviders.filter.driver'), placeholder: t('aiProviders.filter.driver'), width: 160, options: dict.value.engine_type_arr },
  { key: 'status', type: 'select-v2', label: t('aiProviders.filter.status'), placeholder: t('aiProviders.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiProviders.table.name'), minWidth: 160 },
  { key: 'engine_type', label: t('aiProviders.table.driver'), width: 120 },
  { key: 'base_url', label: t('aiProviders.table.baseUrl'), minWidth: 240, overflowTooltip: true },
  { key: 'api_key_masked', label: t('aiProviders.table.apiKeyMasked'), width: 140 },
  { key: 'models', label: t('aiProviders.table.models'), minWidth: 260 },
  { key: 'health_status', label: t('aiProviders.table.health'), width: 110 },
  { key: 'last_model_sync_status', label: t('aiProviders.table.modelSync'), width: 120 },
  { key: 'status', label: t('aiProviders.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiProviders.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 460 , fixed: 'right' },
])

function stateTagType(status?: AiProviderHealthStatus) {
  if (status === 'ok') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

async function init() {
  const data = await AiProviderApi.init()
  dict.value = data.dict
}

function rowModels(row: AiProviderItem): AiProviderModelItem[] {
  return row.models ?? []
}

function add() {
  dialogMode.value = 'add'
  currentInitial.value = createDefaultProviderForm()
  dialogVisible.value = true
}

async function edit(row: AiProviderItem) {
  const modelResponse = await AiProviderApi.models({ id: row.id })
  const models = modelResponse.list
  currentInitial.value = {
    id: row.id,
    name: row.name,
    driver: row.driver ?? row.engine_type,
    base_url: row.base_url,
    api_key: '',
    model_ids: models.map((model) => model.model_id),
    model_display_names: Object.fromEntries(models.map((model) => [model.model_id, model.display_name || model.model_id])),
    status: row.status,
  }
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

async function testConnection(row: AiProviderItem) {
  const result = await AiProviderApi.test({ id: row.id })
  ElNotification.success({ message: result.message || t('aiProviders.testDone') })
  await getList()
}

async function syncModels(row: AiProviderItem) {
  const result = await AiProviderApi.syncModels({ id: row.id })
  ElNotification.success({ message: t('aiProviders.syncModelsDone', { count: result.list.length }) })
  await getList()
}

async function submitted() {
  await getList()
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="ai-provider-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="ai-provider-page__table">
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
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-engine_type="{ row }">
          <el-tag>{{ row.driver_name || row.engine_type_name || row.engine_type }}</el-tag>
        </template>
        <template #cell-base_url="{ row }">
          <el-text>{{ row.base_url || row.base_url_effective || 'https://api.openai.com/v1' }}</el-text>
        </template>
        <template #cell-api_key_masked="{ row }">
          <el-text>{{ row.api_key_masked || '-' }}</el-text>
        </template>
        <template #cell-models="{ row }">
          <ProviderModelList :models="rowModels(row)" />
        </template>
        <template #cell-health_status="{ row }">
          <el-tooltip v-if="row.last_check_error" :content="row.last_check_error" placement="top">
            <el-tag :type="stateTagType(row.health_status)">{{ row.health_status || 'unknown' }}</el-tag>
          </el-tooltip>
          <el-tag v-else :type="stateTagType(row.health_status)">{{ row.health_status || 'unknown' }}</el-tag>
        </template>
        <template #cell-last_model_sync_status="{ row }">
          <el-tooltip v-if="row.last_model_sync_error" :content="row.last_model_sync_error" placement="top">
            <el-tag :type="stateTagType(row.last_model_sync_status)">{{ row.last_model_sync_status || 'unknown' }}</el-tag>
          </el-tooltip>
          <el-tag v-else :type="stateTagType(row.last_model_sync_status)">{{ row.last_model_sync_status || 'unknown' }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <div class="ai-provider-page__actions">
            <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
            <el-button type="success" text @click="testConnection(row)">{{ t('aiProviders.actions.test') }}</el-button>
            <el-button type="info" text @click="syncModels(row)">{{ t('aiProviders.actions.syncModels') }}</el-button>
            <el-button v-if="row.status === 2" type="warning" text @click="toggleStatus(row, 1)">{{ t('common.actions.enable') }}</el-button>
            <el-button v-if="row.status === 1" type="warning" text @click="toggleStatus(row, 2)">{{ t('common.actions.disable') }}</el-button>
            <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
          </div>
        </template>
      </AppTable>
    </div>
  </div>

  <ProviderFormDialog
    v-model="dialogVisible"
    :mode="dialogMode"
    :dict="dict"
    :initial="currentInitial"
    @submitted="submitted"
  />
</template>

<style scoped>
.ai-provider-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-provider-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.ai-provider-page__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;
}

.ai-provider-page__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
