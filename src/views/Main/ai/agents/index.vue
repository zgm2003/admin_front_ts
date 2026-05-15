<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { CascaderOption, FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UpMedia } from '@/components/UpMedia'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import {
  AiAgentApi,
  type AiAgentInitResponse,
  type AiAgentItem,
  type AiAgentMutationParams,
  type AiAgentScene,
} from '@/api/ai/agents'
import AgentToolDialog from './components/AgentToolDialog/index.vue'
import AgentKnowledgeDialog from './components/AgentKnowledgeDialog/index.vue'

type ModelPath = [number, string]

interface AgentForm {
  id?: number
  name: string
  model_path: ModelPath | []
  scenes: AiAgentScene[]
  status: number
  system_prompt: string
  avatar: string
}

const { t } = useI18n()
const isMobile = useIsMobile()

const dict = shallowRef<AiAgentInitResponse['dict']>({
  scene_arr: [],
  common_status_arr: [],
  provider_options: [],
  provider_model_options: [],
})

const searchForm = ref({
  name: '',
  scene: '' as AiAgentScene | '',
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
} = useCrudTable<AiAgentItem>({
  api: AiAgentApi,
  searchForm,
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const form = ref<AgentForm>(defaultForm())
const modelLoading = ref(false)
const modelOptions = ref<CascaderOption[]>([])
const toolDialogVisible = ref(false)
const toolAgent = shallowRef<AiAgentItem | null>(null)
const knowledgeDialogVisible = ref(false)
const knowledgeAgent = shallowRef<AiAgentItem | null>(null)

function defaultForm(): AgentForm {
  return {
    name: '',
    model_path: [],
    scenes: ['chat'],
    status: CommonEnum.YES,
    system_prompt: '',
    avatar: '',
  }
}

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiAgents.form.name') + t('common.required'), trigger: 'blur' }],
  model_path: [{ required: true, type: 'array', min: 2, message: t('aiAgents.form.model') + t('common.required'), trigger: 'change' }],
  scenes: [{ required: true, type: 'array', min: 1, message: t('aiAgents.form.scenes') + t('common.required'), trigger: 'change' }],
  status: [{ required: true, message: t('aiAgents.form.status') + t('common.required'), trigger: 'change' }],
}))

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('aiAgents.filter.name'), placeholder: t('aiAgents.filter.name'), width: 160 },
  { key: 'scene', type: 'select-v2', label: t('aiAgents.filter.scene'), placeholder: t('aiAgents.filter.scene'), width: 140, options: dict.value.scene_arr },
  { key: 'provider_id', type: 'select-v2', label: t('aiAgents.filter.provider'), placeholder: t('aiAgents.filter.provider'), width: 180, options: dict.value.provider_options },
  { key: 'status', type: 'select-v2', label: t('aiAgents.filter.status'), placeholder: t('aiAgents.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'avatar', label: t('aiAgents.table.avatar'), width: 80 },
  { key: 'name', label: t('aiAgents.table.name'), minWidth: 160 },
  { key: 'provider_name', label: t('aiAgents.table.provider'), width: 160 },
  { key: 'model_id', label: t('aiAgents.table.model'), minWidth: 180, overflowTooltip: true },
  { key: 'scenes', label: t('aiAgents.table.scenes'), width: 150 },
  { key: 'status', label: t('aiAgents.table.status'), width: 90 },
  { key: 'updated_at', label: t('aiAgents.table.updatedAt'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 410 },
])

watch(
  () => dialogVisible.value,
  (visible) => {
    if (!visible) return
    void loadModelOptions()
  }
)

async function init() {
  const data = await AiAgentApi.init()
  dict.value = {
    ...data.dict,
    scene_arr: data.dict.scene_arr.length > 0 ? data.dict.scene_arr : [
      { label: t('aiAgents.scene.chat'), value: 'chat' },
      { label: t('aiAgents.scene.agentGenerate'), value: 'agent_generate' },
      { label: t('aiAgents.scene.imageGenerate'), value: 'image_generate' },
    ],
  }
  modelOptions.value = buildModelOptions()
}

async function loadModelOptions() {
  const providerID = form.value.model_path[0]
  if (!providerID) {
    modelOptions.value = buildModelOptions()
    return
  }
  modelLoading.value = true
  try {
    const result = await AiAgentApi.models({ provider_id: providerID })
    const providerModels = result.list.map((model) => ({
      label: model.display_name || model.model_id,
      value: model.model_id,
    }))
    modelOptions.value = withProviderChildren(providerID, providerModels)
  } finally {
    modelLoading.value = false
  }
}

function buildModelOptions(): CascaderOption[] {
  const grouped = new Map<number, CascaderOption[]>()
  for (const model of dict.value.provider_model_options) {
    const list = grouped.get(model.provider_id) ?? []
    list.push({ label: model.display_name || model.model_id, value: model.model_id })
    grouped.set(model.provider_id, list)
  }
  return dict.value.provider_options.map((provider) => ({
    label: provider.label,
    value: provider.value,
    children: grouped.get(provider.value) ?? [],
  }))
}

function withProviderChildren(providerID: number, children: CascaderOption[]): CascaderOption[] {
  const fallback = buildModelOptions()
  return fallback.map((provider) => provider.value === providerID ? { ...provider, children } : provider)
}

function add() {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

function edit(row: AiAgentItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    name: row.name,
    model_path: row.provider_id && row.model_id ? [row.provider_id, row.model_id] : [],
    scenes: row.scenes.length > 0 ? row.scenes : ['chat'],
    status: row.status,
    system_prompt: row.system_prompt ?? '',
    avatar: row.avatar ?? '',
  }
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

function openTools(row: AiAgentItem) {
  toolAgent.value = row
  toolDialogVisible.value = true
}

function openKnowledge(row: AiAgentItem) {
  knowledgeAgent.value = row
  knowledgeDialogVisible.value = true
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const modelPath = form.value.model_path
  const providerID = modelPath[0]
  const modelID = modelPath[1]
  if (!providerID || !modelID) {
    ElNotification.warning({ message: t('aiAgents.form.model') + t('common.required') })
    return
  }
  const payload: AiAgentMutationParams = {
    id: form.value.id,
    name: form.value.name,
    provider_id: providerID,
    model_id: modelID,
    scenes: form.value.scenes,
    status: form.value.status,
    system_prompt: form.value.system_prompt,
    avatar: form.value.avatar,
  }
  const api = dialogMode.value === 'add' ? AiAgentApi.add : AiAgentApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  await getList()
}

function sceneText(row: AiAgentItem): string {
  if (row.scene_names?.length) return row.scene_names.join(' / ')
  return row.scenes.join(' / ')
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="ai-agent-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="ai-agent-page__table">
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
        <template #cell-avatar="{ row }">
          <el-avatar :src="row.avatar || undefined" :size="36">{{ row.name?.charAt(0) || '?' }}</el-avatar>
        </template>
        <template #cell-model_id="{ row }">
          <el-text>{{ row.model_display_name || row.model_id }}</el-text>
        </template>
        <template #cell-scenes="{ row }">
          <el-tag type="info">{{ sceneText(row) }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="primary" text @click="openTools(row)">{{ t('aiAgents.actions.tools') }}</el-button>
          <el-button type="success" text @click="openKnowledge(row)">{{ t('aiAgents.actions.knowledge') }}</el-button>
          <el-button v-if="row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '760px'" height="70vh">
    <template #header>{{ dialogMode === 'add' ? t('aiAgents.addTitle') : t('aiAgents.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAgents.form.status')" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.model')" prop="model_path" required>
            <el-cascader
              v-model="form.model_path"
              :options="modelOptions"
              :props="{ emitPath: true }"
              :loading="modelLoading"
              filterable
              clearable
              style="width: 100%"
              @change="loadModelOptions"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.scenes')" prop="scenes" required>
            <el-select-v2 v-model="form.scenes" :options="dict.scene_arr" multiple clearable style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.avatar')" prop="avatar">
            <UpMedia v-model="form.avatar" type="image" folder-name="ai-agents" width="72px" show-input />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAgents.form.systemPrompt')" prop="system_prompt">
            <el-input v-model="form.system_prompt" type="textarea" :rows="8" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>

  <AgentToolDialog
    v-model="toolDialogVisible"
    :agent="toolAgent"
    @saved="getList"
  />

  <AgentKnowledgeDialog
    v-model="knowledgeDialogVisible"
    :agent="knowledgeAgent"
    @saved="getList"
  />
</template>

<style scoped>
.ai-agent-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-agent-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
