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
  AiAppApi,
  type AiAppBindingItem,
  type AiAppBindingMutationParams,
  type AiAppInitResponse,
  type AiAppItem,
  type AiAppMutationParams,
  type AiAppType,
  type AiBindingType,
  type AiResponseMode,
  type JsonObject,
} from '@/api/ai/apps'

interface AppForm {
  id?: number
  name: string
  code: string
  provider_id: number | null
  engine_app_id: string
  app_type: 'chat' | 'workflow' | 'agent'
  engine_app_api_key: string
  default_response_mode: AiResponseMode
  runtime_config_text: string
  status: number
}

interface BindingForm {
  app_id: number
  bind_type: AiBindingType
  bind_key: string
  sort: number
  status: number
}

const { t } = useI18n()
const isMobile = useIsMobile()

const dict = shallowRef<AiAppInitResponse['dict']>({
  app_type_arr: [],
  response_mode_arr: [],
  binding_type_arr: [],
  common_status_arr: [],
  provider_options: [],
})

const searchForm = ref({
  name: '',
  code: '',
  app_type: '' as AiAppType | '',
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
} = useCrudTable<AiAppItem>({
  api: AiAppApi,
  searchForm,
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const form = ref<AppForm>(defaultForm())

const bindingVisible = ref(false)
const bindingLoading = ref(false)
const selectedApp = ref<AiAppItem | null>(null)
const bindings = ref<AiAppBindingItem[]>([])
const bindingFormRef = ref<FormInstance | null>(null)
const bindingForm = ref<BindingForm>(defaultBindingForm(0))

function defaultForm(): AppForm {
  return {
    name: '',
    code: '',
    provider_id: null,
    engine_app_id: '',
    app_type: 'chat',
    engine_app_api_key: '',
    default_response_mode: 'streaming',
    runtime_config_text: '{}',
    status: CommonEnum.YES,
  }
}

function defaultBindingForm(appId: number): BindingForm {
  return {
    app_id: appId,
    bind_type: 'scene',
    bind_key: '',
    sort: 0,
    status: CommonEnum.YES,
  }
}

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiApps.form.name') + t('common.required'), trigger: 'blur' }],
  provider_id: [{ required: true, message: t('aiApps.form.provider') + t('common.required'), trigger: 'change' }],
  engine_app_id: [{ required: true, message: t('aiApps.form.engineAppId') + t('common.required'), trigger: 'blur' }],
  app_type: [{ required: true, message: t('aiApps.form.appType') + t('common.required'), trigger: 'change' }],
}))

const bindingRules = computed<FormRules>(() => ({
  bind_type: [{ required: true, message: t('aiApps.binding.type') + t('common.required'), trigger: 'change' }],
  bind_key: [{ required: true, message: t('aiApps.binding.key') + t('common.required'), trigger: 'blur' }],
}))

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiApps.filter.name'), placeholder: t('aiApps.filter.name'), width: 160 },
  { key: 'code', type: 'input', label: t('aiApps.filter.code'), placeholder: t('aiApps.filter.code'), width: 150 },
  { key: 'app_type', type: 'select-v2', label: t('aiApps.filter.appType'), placeholder: t('aiApps.filter.appType'), width: 140, options: dict.value.app_type_arr },
  { key: 'provider_id', type: 'select-v2', label: t('aiApps.filter.provider'), placeholder: t('aiApps.filter.provider'), width: 180, options: dict.value.provider_options },
  { key: 'status', type: 'select-v2', label: t('aiApps.filter.status'), placeholder: t('aiApps.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiApps.table.name'), minWidth: 160 },
  { key: 'code', label: t('aiApps.table.code'), width: 140 },
  { key: 'provider_name', label: t('aiApps.table.provider'), width: 160 },
  { key: 'app_type', label: t('aiApps.table.appType'), width: 120 },
  { key: 'engine_app_id', label: t('aiApps.table.engineAppId'), minWidth: 180, overflowTooltip: true },
  { key: 'engine_app_api_key_masked', label: t('aiApps.table.appKeyMasked'), width: 160 },
  { key: 'default_response_mode', label: t('aiApps.table.responseMode'), width: 120 },
  { key: 'status', label: t('aiApps.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiApps.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 300 },
])

function runtimeTextFromConfig(config: JsonObject | null | undefined): string {
  if (!config) return '{}'
  return JSON.stringify(config, null, 2)
}

function parseRuntimeConfig(): JsonObject | null {
  const text = form.value.runtime_config_text.trim()
  if (!text) return null
  const parsed: unknown = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(t('aiApps.form.invalidRuntimeConfig'))
  }
  return parsed as JsonObject
}

async function init() {
  const data = await AiAppApi.init()
  dict.value = data.dict
}

function add() {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

function edit(row: AiAppItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    provider_id: row.provider_id,
    engine_app_id: row.engine_app_id,
    app_type: row.app_type === 'completion' ? 'chat' : row.app_type,
    engine_app_api_key: '',
    default_response_mode: row.default_response_mode,
    runtime_config_text: runtimeTextFromConfig(row.runtime_config),
    status: row.status,
  }
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  let runtimeConfig: JsonObject | null
  try {
    runtimeConfig = parseRuntimeConfig()
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiApps.form.invalidRuntimeConfig') })
    return
  }

  if (!form.value.provider_id) {
    ElNotification.warning({ message: t('aiApps.form.provider') + t('common.required') })
    return
  }

  const payload: AiAppMutationParams = {
    id: form.value.id,
    name: form.value.name,
    code: form.value.code || form.value.name,
    provider_id: form.value.provider_id,
    engine_app_id: form.value.engine_app_id,
    app_type: form.value.app_type,
    default_response_mode: form.value.default_response_mode,
    runtime_config: runtimeConfig,
    status: form.value.status,
  }
  if (form.value.engine_app_api_key) payload.engine_app_api_key = form.value.engine_app_api_key

  const api = dialogMode.value === 'add' ? AiAppApi.add : AiAppApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  await getList()
}

async function testApp(row: AiAppItem) {
  const result = await AiAppApi.test({ id: row.id })
  ElNotification.success({ message: result.message || t('aiApps.testDone') })
}

async function openBindings(row: AiAppItem) {
  selectedApp.value = row
  bindingVisible.value = true
  bindingForm.value = defaultBindingForm(row.id)
  await loadBindings(row.id)
  void nextTick(() => bindingFormRef.value?.clearValidate())
}

async function loadBindings(appId: number) {
  bindingLoading.value = true
  try {
    const data = await AiAppApi.bindings({ app_id: appId })
    bindings.value = data.list
  } finally {
    bindingLoading.value = false
  }
}

async function addBinding() {
  if (!bindingFormRef.value || !selectedApp.value) return
  try {
    await bindingFormRef.value.validate()
  } catch {
    return
  }
  const payload: AiAppBindingMutationParams = { ...bindingForm.value, app_id: selectedApp.value.id }
  await AiAppApi.addBinding(payload)
  ElNotification.success({ message: t('common.success.operation') })
  bindingForm.value = defaultBindingForm(selectedApp.value.id)
  await loadBindings(selectedApp.value.id)
}

async function deleteBinding(row: AiAppBindingItem) {
  if (!selectedApp.value) return
  await AiAppApi.deleteBinding(row.id)
  ElNotification.success({ message: t('common.success.operation') })
  await loadBindings(selectedApp.value.id)
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="ai-app-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="ai-app-page__table">
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
        <template #cell-app_type="{ row }">
          <el-tag>{{ row.app_type_name || row.app_type }}</el-tag>
        </template>
        <template #cell-default_response_mode="{ row }">
          <el-tag type="info">{{ row.default_response_mode_name || row.default_response_mode }}</el-tag>
        </template>
        <template #cell-engine_app_api_key_masked="{ row }">
          <el-text>{{ row.engine_app_api_key_masked || '-' }}</el-text>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="success" text @click="testApp(row)">{{ t('aiApps.actions.test') }}</el-button>
          <el-button type="info" text @click="openBindings(row)">{{ t('aiApps.actions.bindings') }}</el-button>
          <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '760px'" height="70vh">
    <template #header>{{ dialogMode === 'add' ? t('aiApps.addTitle') : t('aiApps.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.code')" prop="code">
            <el-input v-model="form.code" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.provider')" prop="provider_id" required>
            <el-select-v2 v-model="form.provider_id" :options="dict.provider_options" style="width: 100%" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.appType')" prop="app_type" required>
            <el-select-v2 v-model="form.app_type" :options="dict.app_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiApps.form.engineAppId')" prop="engine_app_id" required>
            <el-input v-model="form.engine_app_id" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.responseMode')" prop="default_response_mode">
            <el-select-v2 v-model="form.default_response_mode" :options="dict.response_mode_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiApps.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiApps.form.engineAppApiKey')" prop="engine_app_api_key">
            <el-input v-model="form.engine_app_api_key" type="password" show-password clearable :placeholder="dialogMode === 'edit' ? t('aiApps.form.apiKeyEditPlaceholder') : t('aiApps.form.apiKeyPlaceholder')" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiApps.form.runtimeConfig')" prop="runtime_config_text">
            <el-input v-model="form.runtime_config_text" type="textarea" :rows="8" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>

  <AppDialog v-model="bindingVisible" :width="isMobile ? '94vw' : '720px'">
    <template #header>{{ t('aiApps.binding.title') }} - {{ selectedApp?.name }}</template>
    <el-form ref="bindingFormRef" :model="bindingForm" :rules="bindingRules" label-width="auto" class="binding-form">
      <el-row :gutter="12">
        <el-col :md="8" :span="24">
          <el-form-item :label="t('aiApps.binding.type')" prop="bind_type" required>
            <el-select-v2 v-model="bindingForm.bind_type" :options="dict.binding_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="10" :span="24">
          <el-form-item :label="t('aiApps.binding.key')" prop="bind_key" required>
            <el-input v-model="bindingForm.bind_key" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="6" :span="24">
          <el-form-item :label="t('aiApps.binding.sort')" prop="sort">
            <el-input-number v-model="bindingForm.sort" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" @click="addBinding">{{ t('aiApps.binding.add') }}</el-button>
    </el-form>
    <el-table v-loading="bindingLoading" :data="bindings" size="small" class="binding-table">
      <el-table-column prop="bind_type_name" :label="t('aiApps.binding.type')" width="140">
        <template #default="{ row }">{{ row.bind_type_name || row.bind_type }}</template>
      </el-table-column>
      <el-table-column prop="bind_key" :label="t('aiApps.binding.key')" />
      <el-table-column prop="sort" :label="t('aiApps.binding.sort')" width="90" />
      <el-table-column prop="status_name" :label="t('aiApps.binding.status')" width="100" />
      <el-table-column :label="t('common.actions.action')" width="100">
        <template #default="{ row }">
          <el-button type="danger" text @click="deleteBinding(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </AppDialog>
</template>

<style scoped>
.ai-app-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-app-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.binding-form {
  margin-bottom: 16px;
}

.binding-table {
  width: 100%;
}
</style>
