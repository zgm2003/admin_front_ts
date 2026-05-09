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
  AiToolMapApi,
  type AiToolMapInitResponse,
  type AiToolMapItem,
  type AiToolMapMutationParams,
  type AiToolRiskLevel,
  type AiToolType,
  type JsonObject,
} from '@/api/ai/toolMaps'
import { AiAppApi, type AiAppOption } from '@/api/ai/apps'

interface ToolMapForm {
  id?: number
  provider_id: number | null
  app_id: number | null
  name: string
  code: string
  tool_type: AiToolType
  engine_tool_id: string
  permission_code: string
  risk_level: AiToolRiskLevel
  config_json_text: string
  status: number
}

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = shallowRef<AiToolMapInitResponse['dict']>({
  tool_type_arr: [],
  risk_level_arr: [],
  common_status_arr: [],
  provider_options: [],
})
const appOptions = ref<AiAppOption[]>([])

const searchForm = ref({
  name: '',
  code: '',
  tool_type: '' as AiToolType | '',
  risk_level: '' as AiToolRiskLevel | '',
  provider_id: '' as number | '',
  app_id: '' as number | '',
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
} = useCrudTable<AiToolMapItem>({
  api: AiToolMapApi,
  searchForm,
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const form = ref<ToolMapForm>(defaultForm())

function defaultForm(): ToolMapForm {
  return {
    provider_id: null,
    app_id: null,
    name: '',
    code: '',
    tool_type: 'dify_tool',
    engine_tool_id: '',
    permission_code: '',
    risk_level: 'low',
    config_json_text: '{}',
    status: CommonEnum.YES,
  }
}

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiTools.form.name') + t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('aiTools.form.code') + t('common.required'), trigger: 'blur' }],
  provider_id: [{ required: true, message: t('aiTools.form.provider') + t('common.required'), trigger: 'change' }],
  tool_type: [{ required: true, message: t('aiTools.form.toolType') + t('common.required'), trigger: 'change' }],
  risk_level: [{ required: true, message: t('aiTools.form.riskLevel') + t('common.required'), trigger: 'change' }],
}))

const appSelectOptions = computed(() => appOptions.value.map((item) => ({ label: item.name, value: item.id })))

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiTools.filter.name'), placeholder: t('aiTools.filter.name'), width: 160 },
  { key: 'code', type: 'input', label: t('aiTools.filter.code'), placeholder: t('aiTools.filter.code'), width: 150 },
  { key: 'tool_type', type: 'select-v2', label: t('aiTools.filter.toolType'), placeholder: t('aiTools.filter.toolType'), width: 150, options: dict.value.tool_type_arr },
  { key: 'risk_level', type: 'select-v2', label: t('aiTools.filter.riskLevel'), placeholder: t('aiTools.filter.riskLevel'), width: 130, options: dict.value.risk_level_arr },
  { key: 'provider_id', type: 'select-v2', label: t('aiTools.filter.provider'), placeholder: t('aiTools.filter.provider'), width: 180, options: dict.value.provider_options },
  { key: 'app_id', type: 'select-v2', label: t('aiTools.filter.app'), placeholder: t('aiTools.filter.app'), width: 160, options: appSelectOptions.value },
  { key: 'status', type: 'select-v2', label: t('aiTools.filter.status'), placeholder: t('aiTools.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'name', label: t('aiTools.table.name'), minWidth: 160 },
  { key: 'code', label: t('aiTools.table.code'), width: 140 },
  { key: 'tool_type', label: t('aiTools.table.toolType'), width: 130 },
  { key: 'provider_name', label: t('aiTools.table.provider'), width: 160 },
  { key: 'engine_tool_id', label: t('aiTools.table.engineToolId'), minWidth: 170, overflowTooltip: true },
  { key: 'permission_code', label: t('aiTools.table.permissionCode'), minWidth: 170, overflowTooltip: true },
  { key: 'risk_level', label: t('aiTools.table.riskLevel'), width: 110 },
  { key: 'status', label: t('aiTools.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiTools.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 240 },
])

function jsonText(value: JsonObject | null | undefined): string {
  return value ? JSON.stringify(value, null, 2) : '{}'
}

function parseConfig(): JsonObject | null {
  const text = form.value.config_json_text.trim()
  if (!text) return null
  const parsed: unknown = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(t('aiTools.form.invalidJson'))
  return parsed as JsonObject
}

function riskTagType(level: AiToolRiskLevel) {
  if (level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'success'
}

async function init() {
  const [initData, apps] = await Promise.all([AiToolMapApi.init(), AiAppApi.options()])
  dict.value = initData.dict
  appOptions.value = apps.list
}

function add() {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

function edit(row: AiToolMapItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    provider_id: row.provider_id,
    app_id: row.app_id ?? null,
    name: row.name,
    code: row.code,
    tool_type: row.tool_type,
    engine_tool_id: row.engine_tool_id,
    permission_code: row.permission_code,
    risk_level: row.risk_level,
    config_json_text: jsonText(row.config_json),
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
  if (!form.value.provider_id) return
  let config: JsonObject | null
  try {
    config = parseConfig()
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiTools.form.invalidJson') })
    return
  }
  const payload: AiToolMapMutationParams = {
    id: form.value.id,
    provider_id: form.value.provider_id,
    app_id: form.value.app_id,
    name: form.value.name,
    code: form.value.code,
    tool_type: form.value.tool_type,
    engine_tool_id: form.value.engine_tool_id || undefined,
    permission_code: form.value.permission_code || undefined,
    risk_level: form.value.risk_level,
    config_json: config,
    status: form.value.status,
  }
  const api = dialogMode.value === 'add' ? AiToolMapApi.add : AiToolMapApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  await getList()
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="ai-tool-map-page">
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
        <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
      </template>
      <template #cell-tool_type="{ row }">
        <el-tag>{{ row.tool_type_name || row.tool_type }}</el-tag>
      </template>
      <template #cell-risk_level="{ row }">
        <el-tag :type="riskTagType(row.risk_level)">{{ row.risk_level_name || row.risk_level }}</el-tag>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
        <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
        <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
        <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '760px'" height="68vh">
    <template #header>{{ dialogMode === 'add' ? t('aiTools.addTitle') : t('aiTools.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.name')" prop="name" required><el-input v-model="form.name" /></el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.code')" prop="code" required><el-input v-model="form.code" /></el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.provider')" prop="provider_id" required>
            <el-select-v2 v-model="form.provider_id" :options="dict.provider_options" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.app')" prop="app_id">
            <el-select-v2 v-model="form.app_id" :options="appSelectOptions" style="width: 100%" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.toolType')" prop="tool_type" required>
            <el-select-v2 v-model="form.tool_type" :options="dict.tool_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.riskLevel')" prop="risk_level" required>
            <el-select-v2 v-model="form.risk_level" :options="dict.risk_level_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiTools.form.engineToolId')"><el-input v-model="form.engine_tool_id" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiTools.form.permissionCode')"><el-input v-model="form.permission_code" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiTools.form.configJson')"><el-input v-model="form.config_json_text" type="textarea" :rows="8" /></el-form-item>
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
.ai-tool-map-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style>
