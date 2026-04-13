<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AiAgentApi,
  type AiAgentInitResponse,
  type AiAgentItem,
  type AiAgentListParams,
} from '@/api/ai/agents'
import { AiToolApi, type AgentToolOption } from '@/api/ai/tools'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useCrudTable } from '@/hooks/useCrudTable'
import { UpMedia } from '@/components/UpMedia'
import { CommonEnum } from '@/enums'
import {
  createDefaultAgentForm,
  getAgentSceneTagType,
  toAgentMutationPayload,
  type AgentFormState,
} from './composables/helpers'

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = ref<AiAgentInitResponse['dict']>({
  ai_mode_arr: [],
  ai_scene_arr: [],
  common_status_arr: [],
  model_list: [],
})
const toolOptions = ref<AgentToolOption[]>([])

const searchForm = ref<AiAgentListParams>({
  name: '',
  model_id: '',
  mode: '',
  status: '',
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
} = useCrudTable<AiAgentItem>({
  api: AiAgentApi,
  searchForm,
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref<AgentFormState>(createDefaultAgentForm())
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiAgents.form.name') + t('common.required'), trigger: 'blur' }],
  model_id: [{ required: true, message: t('aiAgents.form.model_id') + t('common.required'), trigger: 'change' }],
}))

async function init() {
  const data = await AiAgentApi.init()
  dict.value = data.dict
}

async function loadToolOptions(agentId?: number) {
  const data = await AiToolApi.getAgentTools(agentId ? { agent_id: agentId } : {})
  toolOptions.value = data.all_tools
  return data.bound_tool_ids
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiAgents.filter.name'), placeholder: t('aiAgents.filter.name'), width: 160 },
  {
    key: 'model_id',
    type: 'select-v2',
    label: t('aiAgents.filter.model_id'),
    placeholder: t('aiAgents.filter.model_id'),
    width: 200,
    options: dict.value.model_list,
    fitInputWidth: false,
  },
  {
    key: 'mode',
    type: 'select-v2',
    label: t('aiAgents.filter.mode'),
    placeholder: t('aiAgents.filter.mode'),
    width: 120,
    options: dict.value.ai_mode_arr,
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiAgents.filter.status'),
    placeholder: t('aiAgents.filter.status'),
    width: 120,
    options: dict.value.common_status_arr,
  },
])

const columns = computed(() => [
  { key: 'name', label: t('aiAgents.table.name'), width: 140 },
  { key: 'model_name', label: t('aiAgents.table.model_name') },
  { key: 'mode', label: t('aiAgents.table.mode') },
  { key: 'scene', label: t('aiAgents.table.scene'), width: 150 },
  { key: 'system_prompt', label: t('aiAgents.table.system_prompt'), width: 500, overflowTooltip: true },
  { key: 'status', label: t('aiAgents.table.status') },
  { key: 'created_at', label: t('aiAgents.table.created_at'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 250 },
])

function add() {
  dialogMode.value = 'add'
  form.value = createDefaultAgentForm()
  toolOptions.value = []
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function edit(row: AiAgentItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    model_id: row.model_id,
    avatar: row.avatar ?? '',
    system_prompt: row.system_prompt ?? '',
    mode: row.mode,
    scene: row.scene ?? '',
    status: row.status,
    tool_ids: [],
  }

  if (row.mode === 'tool') {
    form.value.tool_ids = await loadToolOptions(row.id)
  } else {
    toolOptions.value = []
  }

  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function handleModeChange(mode: string) {
  if (mode !== 'tool') {
    toolOptions.value = []
    form.value.tool_ids = []
    return
  }

  form.value.tool_ids = await loadToolOptions(typeof form.value.id === 'number' ? form.value.id : undefined)
}

async function confirmSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const api = dialogMode.value === 'add' ? AiAgentApi.add : AiAgentApi.edit
  await api(toAgentMutationPayload(form.value))
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
            <el-tag v-if="row.model_deleted" type="danger" size="small" style="margin-left:4px">{{ t('aiAgents.table.deleted') }}</el-tag>
          </p>

        </template>
        <template #cell-mode="{row}">
          <el-tag size="small">{{ row.mode_name }}</el-tag>
        </template>
        <template #cell-scene="{row}">
          <el-tag v-if="row.scene" size="small" :type="getAgentSceneTagType(row.scene)">{{ row.scene_name }}</el-tag>
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

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '800px'">
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
            <el-select-v2 v-model="form.mode" :options="dict.ai_mode_arr" style="width:100%" @change="handleModeChange"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.scene')" prop="scene">
            <el-select-v2 v-model="form.scene" :options="dict.ai_scene_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="form.mode === 'tool'">
          <el-form-item :label="t('aiAgents.tools')">
            <el-select-v2 v-model="form.tool_ids" :options="toolOptions" multiple filterable :placeholder="t('aiAgents.selectTools')" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.status')" prop="status">
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.system_prompt')" prop="system_prompt">
            <el-input v-model="form.system_prompt" type="textarea" :rows="4" :placeholder="t('aiAgents.form.systemPromptPlaceholder')"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.avatar')" prop="avatar">
            <UpMedia v-model="form.avatar" folder-name="avatars" width="80px" show-input/>
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
