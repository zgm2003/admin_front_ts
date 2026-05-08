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
  AiEngineConnectionApi,
  type AiEngineConnectionInitResponse,
  type AiEngineConnectionItem,
  type AiEngineConnectionMutationParams,
  type AiEngineHealthStatus,
  type AiEngineType,
} from '@/api/ai/engineConnections'

interface ProviderForm {
  id?: number
  name: string
  engine_type: AiEngineType
  base_url: string
  api_key: string
  workspace_id: string
  status: number
}

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = shallowRef<AiEngineConnectionInitResponse['dict']>({
  engine_type_arr: [],
  common_status_arr: [],
  health_status_arr: [],
})

const searchForm = ref({
  name: '',
  engine_type: '' as AiEngineType | '',
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
} = useCrudTable<AiEngineConnectionItem>({
  api: AiEngineConnectionApi,
  searchForm,
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const form = ref<ProviderForm>(defaultForm())

function defaultForm(): ProviderForm {
  return {
    name: '',
    engine_type: 'dify',
    base_url: '',
    api_key: '',
    workspace_id: '',
    status: CommonEnum.YES,
  }
}

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiProviders.form.name') + t('common.required'), trigger: 'blur' }],
  engine_type: [{ required: true, message: t('aiProviders.form.engineType') + t('common.required'), trigger: 'change' }],
  base_url: [{ required: true, message: t('aiProviders.form.baseUrl') + t('common.required'), trigger: 'blur' }],
}))

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiProviders.filter.name'), placeholder: t('aiProviders.filter.name'), width: 180 },
  { key: 'engine_type', type: 'select-v2', label: t('aiProviders.filter.engineType'), placeholder: t('aiProviders.filter.engineType'), width: 160, options: dict.value.engine_type_arr },
  { key: 'status', type: 'select-v2', label: t('aiProviders.filter.status'), placeholder: t('aiProviders.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiProviders.table.name'), minWidth: 160 },
  { key: 'engine_type', label: t('aiProviders.table.engineType'), width: 120 },
  { key: 'base_url', label: t('aiProviders.table.baseUrl'), minWidth: 260, overflowTooltip: true },
  { key: 'api_key_masked', label: t('aiProviders.table.apiKeyMasked'), width: 160 },
  { key: 'health_status', label: t('aiProviders.table.health'), width: 120 },
  { key: 'status', label: t('aiProviders.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiProviders.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 260 },
])

function healthTagType(status: AiEngineHealthStatus) {
  if (status === 'healthy') return 'success'
  if (status === 'unhealthy') return 'danger'
  return 'info'
}

async function init() {
  const data = await AiEngineConnectionApi.init()
  dict.value = data.dict
}

function add() {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

function edit(row: AiEngineConnectionItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    engine_type: row.engine_type,
    base_url: row.base_url,
    api_key: '',
    workspace_id: row.workspace_id ?? '',
    status: row.status,
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const value = form.value
  const payload: AiEngineConnectionMutationParams = {
    id: value.id,
    name: value.name,
    engine_type: value.engine_type,
    base_url: value.base_url,
    workspace_id: value.workspace_id || null,
    status: value.status,
  }
  if (value.api_key) payload.api_key = value.api_key
  const api = dialogMode.value === 'add' ? AiEngineConnectionApi.add : AiEngineConnectionApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  await getList()
}

async function testConnection(row: AiEngineConnectionItem) {
  const result = await AiEngineConnectionApi.test({ id: row.id })
  ElNotification.success({ message: result.message || t('aiProviders.testDone') })
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
          <el-tag>{{ row.engine_type_name || row.engine_type }}</el-tag>
        </template>
        <template #cell-api_key_masked="{ row }">
          <el-text>{{ row.api_key_masked || '-' }}</el-text>
        </template>
        <template #cell-health_status="{ row }">
          <el-tag :type="healthTagType(row.health_status)">{{ row.health_status }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="success" text @click="testConnection(row)">{{ t('aiProviders.actions.test') }}</el-button>
          <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '720px'">
    <template #header>{{ dialogMode === 'add' ? t('aiProviders.addTitle') : t('aiProviders.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.engineType')" prop="engine_type" required>
            <el-select-v2 v-model="form.engine_type" :options="dict.engine_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.baseUrl')" prop="base_url" required>
            <el-input v-model="form.base_url" placeholder="https://dify.example.com/v1" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.workspaceId')" prop="workspace_id">
            <el-input v-model="form.workspace_id" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.apiKey')" prop="api_key">
            <el-input v-model="form.api_key" type="password" show-password clearable :placeholder="dialogMode === 'edit' ? t('aiProviders.form.apiKeyEditPlaceholder') : t('aiProviders.form.apiKeyPlaceholder')" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
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
</style>
