<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  AiModelApi,
  type AiModelInitResponse,
  type AiModelItem,
  type AiModelMutationParams,
} from '@/api/ai/models'
import {ElNotification} from 'element-plus'
import type {FormInstance, FormRules} from 'element-plus'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import { AppDialog } from '@/components/AppDialog'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'

const {t} = useI18n()
const isMobile = useIsMobile()
const dict = ref<AiModelInitResponse['dict']>({
  ai_driver_arr: [],
  common_status_arr: [],
})

const searchForm = ref({
  name: '',
  driver: '' as string | '',
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
  onSelectionChange,
  selectedIds,
  confirmDel,
  batchDel,
  toggleStatus
} = useCrudTable({
  api: AiModelApi,
  searchForm
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
interface ModelForm extends AiModelMutationParams {
  id?: number
  api_key: string
}

function createDefaultModelForm(): ModelForm {
  return {
    name: '',
    driver: '',
    model_code: '',
    endpoint: '',
    api_key: '',
    status: 1,
  }
}

const form = ref({
  name: '',
  driver: '',
  model_code: '',
  endpoint: '',
  api_key: '',
  status: 1,
} as ModelForm)
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  name: [{required: true, message: t('aiModels.form.name') + t('common.required'), trigger: 'blur'}],
  driver: [{required: true, message: t('aiModels.form.driver') + t('common.required'), trigger: 'blur'}],
  model_code: [{required: true, message: t('aiModels.form.model_code') + t('common.required'), trigger: 'blur'}]
}))

const init = () => {
  AiModelApi.init().then((data) => {
    dict.value = data.dict
  })
}

const searchFields = computed<SearchField[]>(() => [
  {key: 'name', type: 'input', label: t('aiModels.filter.name'), placeholder: t('aiModels.filter.name'), width: 180},
  {
    key: 'driver',
    type: 'select-v2',
    label: t('aiModels.filter.driver'),
    placeholder: t('aiModels.filter.driver'),
    width: 160,
    options: dict.value.ai_driver_arr
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiModels.filter.status'),
    placeholder: t('aiModels.filter.status'),
    width: 140,
    options: dict.value.common_status_arr
  }
])

const columns = computed(() => [
  {key: 'name', label: t('aiModels.table.name'), width: 140},
  {key: 'driver', label: t('aiModels.table.driver'), width: 100},
  {key: 'model_code', label: t('aiModels.table.model_code'), width: 180},
  {key: 'endpoint', label: t('aiModels.table.endpoint'), overflowTooltip: true},
  {key: 'api_key_hint', label: t('aiModels.table.api_key_hint'), width: 120},
  {key: 'status', label: t('aiModels.table.status'), width: 100},
  {key: 'created_at', label: t('aiModels.table.created_at'), width: 160},
  {key: 'actions', label: t('common.actions.action'), width: 250}
])

const add = () => {
  dialogMode.value = 'add'
  form.value = createDefaultModelForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const edit = (row: AiModelItem) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    driver: row.driver,
    model_code: row.model_code || '',
    endpoint: row.endpoint || '',
    api_key: '',
    status: row.status,
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
  const api = dialogMode.value === 'add' ? AiModelApi.add : AiModelApi.edit
  const v = form.value
  const payload: AiModelMutationParams = {
    name: v.name,
    driver: v.driver,
    model_code: v.model_code,
    endpoint: v.endpoint || null,
    status: v.status,
  }
  if (v.api_key) payload.api_key = v.api_key
  if (dialogMode.value === 'edit') payload.id = v.id

  api(payload).then(() => {
    ElNotification.success({message: t('common.success.operation')})
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
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
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
          @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
          <el-button type="danger" :disabled="selectedIds.length === 0" @click="batchDel">
            {{ t('common.actions.batchDelete') }}
          </el-button>
        </template>
        <template #cell-driver="{row}">
          <el-tag>{{ row.driver_name }}</el-tag>
        </template>
        <template #cell-status="{row}">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-actions="{row}">
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

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '700px'">
    <template #header>{{ dialogMode === 'add' ? t('aiModels.addTitle') : t('aiModels.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiModels.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiModels.form.driver')" prop="driver" required>
            <el-select-v2 v-model="form.driver" :options="dict.ai_driver_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiModels.form.model_code')" prop="model_code" required>
            <el-input v-model="form.model_code" :placeholder="t('aiModels.form.modelCodePlaceholder')" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiModels.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiModels.form.endpoint')" prop="endpoint">
            <el-input v-model="form.endpoint" :placeholder="t('aiModels.form.endpointPlaceholder')" clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiModels.form.api_key')" prop="api_key">
            <el-input v-model="form.api_key" type="password" show-password
                      :placeholder="dialogMode === 'edit' ? t('aiModels.form.apiKeyEditPlaceholder') : t('aiModels.form.apiKeyPlaceholder')" clearable/>
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
  </AppDialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}

</style>
