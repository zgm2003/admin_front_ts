<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {AiAgentApi} from '@/api/ai/agents'
import {ElNotification, ElMessageBox} from 'element-plus'
import type {FormInstance, FormRules} from 'element-plus'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import {useTable} from '@/hooks/useTable'
import UpImg from '@/components/UpImg'

const {t} = useI18n()
const isMobile = useIsMobile()
const dict = ref({ai_mode_arr: [], common_status_arr: [], model_list: []} as any)

const searchForm = ref({name: '', model_id: '', mode: '', status: ''} as any)

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
  confirmDel
} = useTable({
  api: AiAgentApi.list,
  searchForm,
  delApi: AiAgentApi.del
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref({
  name: '',
  model_id: '',
  avatar: '',
  system_prompt: '',
  mode: 'chat',
  temperature: 1,
  max_tokens: '',
  extra_params: '',
  status: 1
} as any)
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  name: [{required: true, message: t('aiAgents.form.name') + t('common.required'), trigger: 'blur'}],
  model_id: [{required: true, message: t('aiAgents.form.model_id') + t('common.required'), trigger: 'blur'}]
}))

const init = () => {
  AiAgentApi.init().then((data: any) => {
    dict.value = data.dict || {}
  })
}

const searchFields = computed<SearchField[]>(() => [
  {key: 'name', type: 'input', label: t('aiAgents.filter.name'), placeholder: t('aiAgents.filter.name'), width: 160},
  {
    key: 'model_id',
    type: 'select-v2',
    label: t('aiAgents.filter.model_id'),
    placeholder: t('aiAgents.filter.model_id'),
    width: 200,
    options: dict.value.model_list,
    fitInputWidth:false,
  },
  {
    key: 'mode',
    type: 'select-v2',
    label: t('aiAgents.filter.mode'),
    placeholder: t('aiAgents.filter.mode'),
    width: 120,
    options: dict.value.ai_mode_arr
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiAgents.filter.status'),
    placeholder: t('aiAgents.filter.status'),
    width: 120,
    options: dict.value.common_status_arr
  }
])

const columns = computed(() => [
  {key: 'name', label: t('aiAgents.table.name'), width: 140},
  {key: 'model_name', label: t('aiAgents.table.model_name'), width: 160},
  {key: 'mode', label: t('aiAgents.table.mode'), width: 90},
  {key: 'temperature', label: t('aiAgents.table.temperature'), width: 80},
  {key: 'system_prompt', label: t('aiAgents.table.system_prompt'), overflowTooltip: true},
  {key: 'status', label: t('aiAgents.table.status'), width: 90},
  {key: 'created_at', label: t('aiAgents.table.created_at'), width: 160},
  {key: 'actions', label: t('common.actions.action'), width: 250}
])

const add = () => {
  dialogMode.value = 'add'
  form.value = {
    name: '',
    model_id: '',
    avatar: '',
    system_prompt: '',
    mode: 'chat',
    temperature: 1,
    max_tokens: '',
    extra_params: '',
    status: 1
  }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    model_id: row.model_id,
    avatar: row.avatar || '',
    system_prompt: row.system_prompt || '',
    mode: row.mode,
    temperature: row.temperature,
    max_tokens: row.max_tokens || '',
    extra_params: row.extra_params ? JSON.stringify(row.extra_params) : '',
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
  const api = dialogMode.value === 'add' ? AiAgentApi.add : AiAgentApi.edit
  const v = form.value
  const payload: any = {
    name: v.name,
    model_id: v.model_id,
    avatar: v.avatar || null,
    system_prompt: v.system_prompt || null,
    mode: v.mode,
    temperature: v.temperature,
    max_tokens: v.max_tokens || null,
    status: v.status
  }
  if (v.extra_params) {
    try {
      payload.extra_params = JSON.parse(v.extra_params)
    } catch {
      ElNotification.error({message: '额外参数必须为合法JSON'})
      return
    }
  }
  if (dialogMode.value === 'edit') payload.id = v.id

  api(payload).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    getList()
  })
}

const toggleStatus = async (row: any, newStatus: number) => {
  try {
    await ElMessageBox.confirm(t('common.confirmStatusChange'), t('common.confirmTitle'), {
      type: 'warning',
      confirmButtonText: t('common.actions.confirm'),
      cancelButtonText: t('common.actions.cancel')
    })
  } catch {
    return
  }
  AiAgentApi.status({id: row.id, status: newStatus}).then(() => {
    ElNotification.success({message: t('common.success.operation')})
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
      >
        <template #toolbar-left>
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-model_name="{row}">
          <p>
            <el-text>{{ row.model_name }}</el-text>
          </p>
          <p>
            <el-tag v-if="row.model_deleted" type="danger" size="small" style="margin-left:4px">已删除</el-tag>
          </p>

        </template>
        <template #cell-mode="{row}">
          <el-tag size="small">{{ row.mode_name }}</el-tag>
        </template>
        <template #cell-status="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-actions="{row}">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="warning" text v-if="row.status === 2" @click="toggleStatus(row, 1)">
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === 1" @click="toggleStatus(row, 2)">
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '800px'">
    <template #header>{{ dialogMode === 'add' ? t('aiAgents.addTitle') : t('aiAgents.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.model_id')" prop="model_id" required>
            <el-select-v2 v-model="form.model_id" :options="dict.model_list" style="width:100%" filterable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.mode')" prop="mode">
            <el-select-v2 v-model="form.mode" :options="dict.ai_mode_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="12">
          <el-form-item :label="t('aiAgents.form.temperature')" prop="temperature">
            <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" :precision="2" :controls="false"
                             style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="12">
          <el-form-item :label="t('aiAgents.form.max_tokens')" prop="max_tokens">
            <el-input-number v-model="form.max_tokens" :min="1" :controls="false" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.system_prompt')" prop="system_prompt">
            <el-input v-model="form.system_prompt" type="textarea" :rows="4" placeholder="设定智能体的角色和行为"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.extra_params')" prop="extra_params">
            <el-input v-model="form.extra_params" type="textarea" :rows="2"
                      placeholder='{"top_p": 0.9, "presence_penalty": 0}'/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.avatar')" prop="avatar">
            <UpImg v-model="form.avatar" folder-name="avatar" width="80px" show-input/>
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
