<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AiToolApi,
  type AiToolInitResponse,
  type AiToolItem,
  type AiToolMutationParams,
} from '@/api/ai/tools'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { JsonEditor } from '@/components/JsonEditor'
import { useIsMobile } from '@/hooks/useResponsive'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = ref<AiToolInitResponse['dict']>({
  ai_executor_type_arr: [],
  common_status_arr: [],
})

const searchForm = ref({
  name: '',
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
  toggleStatus
} = useCrudTable({
  api: AiToolApi,
  searchForm
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

interface ToolExecutorConfig {
  url?: string
  sql?: string
  [key: string]: unknown
}

interface ToolForm {
  id?: number
  name: string
  code: string
  description: string
  schema_json: string
  executor_type: number
  executor_config: ToolExecutorConfig
  status: number
}

const defaultForm = (): ToolForm => ({
  name: '',
  code: '',
  description: '',
  schema_json: '',
  executor_type: 1,
  executor_config: {},
  status: 1,
})

const form = ref<ToolForm>(defaultForm())
const formRef = ref<FormInstance | null>(null)
const jsonEditorRef = ref<InstanceType<typeof JsonEditor> | null>(null)

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiTools.form.name') + t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('aiTools.form.code') + t('common.required'), trigger: 'blur' }],
  executor_type: [{ required: true, message: t('aiTools.form.executorType') + t('common.required'), trigger: 'change' }],
  'executor_config.url': [{
    validator: (_rule, value, callback) => {
      if (form.value.executor_type !== 2) return callback()
      if (!value || typeof value !== 'string' || !value.trim()) {
        return callback(new Error(t('aiTools.form.httpUrl') + t('common.required')))
      }
      callback()
    },
    trigger: 'blur'
  }],
  'executor_config.sql': [{
    validator: (_rule, value, callback) => {
      if (form.value.executor_type !== 3) return callback()
      if (!value || typeof value !== 'string' || !value.trim()) {
        return callback(new Error(t('aiTools.form.sqlQuery') + t('common.required')))
      }
      callback()
    },
    trigger: 'blur'
  }]
}))

const onExecutorTypeChange = () => {
  if (!form.value.executor_config || typeof form.value.executor_config !== 'object') {
    form.value.executor_config = {}
  }
  nextTick(() => formRef.value?.clearValidate(['executor_config.url', 'executor_config.sql']))
}

const init = () => {
  AiToolApi.init().then((data) => {
    dict.value = data.dict
  })
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiTools.filter.name'), placeholder: t('aiTools.filter.name'), width: 160 },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiTools.filter.status'),
    placeholder: t('aiTools.filter.status'),
    width: 120,
    options: dict.value.common_status_arr
  }
])

const columns = computed(() => [
  { key: 'name', label: t('aiTools.table.name'), width: 140 },
  { key: 'code', label: t('aiTools.table.code'), width: 160 },
  { key: 'executor_type', label: t('aiTools.table.executorType'), width: 120 },
  { key: 'description', label: t('aiTools.table.description'), overflowTooltip: true },
  { key: 'status', label: t('aiTools.table.status'), width: 90 },
  { key: 'created_at', label: t('aiTools.table.createdAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 250 }
])

const add = () => {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const edit = (row: AiToolItem) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    schema_json: row.schema_json ? JSON.stringify(row.schema_json, null, 2) : '',
    executor_type: row.executor_type,
    executor_config: (row.executor_config ?? {}) as ToolExecutorConfig,
    status: row.status
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const v = form.value
  let schemaJson = null
  if (v.schema_json) {
    if (!jsonEditorRef.value?.validate()) return
    try {
      schemaJson = JSON.parse(v.schema_json)
    } catch {
      ElNotification.warning({ message: t('aiTools.form.invalidJson') })
      return
    }
  }

  const payload: AiToolMutationParams = {
    name: v.name,
    code: v.code,
    description: v.description || null,
    schema_json: schemaJson,
    executor_type: v.executor_type,
    executor_config: v.executor_config || null,
    status: v.status
  }
  if (dialogMode.value === 'edit') payload.id = v.id

  const api = dialogMode.value === 'add' ? AiToolApi.add : AiToolApi.edit
  api(payload).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  })
}

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #toolbar-left>
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-executor_type="{ row }">
          <el-tag size="small">{{ row.executor_name }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.NO" @click="toggleStatus(row, CommonEnum.YES)">
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.YES" @click="toggleStatus(row, CommonEnum.NO)">
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '720px'">
    <template #header>{{ dialogMode === 'add' ? t('aiTools.addTitle') : t('aiTools.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.code')" prop="code" required>
            <el-input v-model="form.code" clearable :disabled="dialogMode === 'edit'" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.executorType')" prop="executor_type" required>
            <el-select-v2 v-model="form.executor_type" :options="dict.ai_executor_type_arr" style="width:100%" @change="onExecutorTypeChange" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiTools.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiTools.form.description')">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiTools.form.schemaJson')">
            <JsonEditor v-model="form.schema_json" ref="jsonEditorRef" :rows="6" />
          </el-form-item>
        </el-col>
        <!-- executor_type=2 HTTP: URL -->
        <el-col :span="24" v-if="form.executor_type === 2">
          <el-form-item :label="t('aiTools.form.httpUrl')" prop="executor_config.url" required>
            <el-input v-model="form.executor_config.url" placeholder="https://" clearable />
          </el-form-item>
        </el-col>
        <!-- executor_type=3 SQL -->
        <el-col :span="24" v-if="form.executor_type === 3">
          <el-form-item :label="t('aiTools.form.sqlQuery')" prop="executor_config.sql" required>
            <el-input v-model="form.executor_config.sql" type="textarea" :rows="4" placeholder="SELECT * FROM table WHERE id = :id" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
</style>
