import { computed, nextTick, onMounted, ref, shallowRef, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { CascaderOption, FormInstance, FormRules } from 'element-plus'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import {
  AiAgentApi,
  type AiAgentInitResponse,
  type AiAgentItem,
  type AiAgentMutationParams,
  type AiAgentScene,
  type AiAgentStatus,
} from '@/api/ai/agents'

type ModelPath = [number, string]

interface AgentForm {
  id?: number
  name: string
  model_path: ModelPath | []
  scenes: AiAgentScene[]
  status: AiAgentStatus
  system_prompt: string
  avatar: string
}

export function useAgentAdminPage(formRef: Ref<FormInstance | null>) {
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
    status: '' as AiAgentStatus | '',
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
    { key: 'actions', label: t('common.actions.action'), width: 520 },
  ])

  watch(
    () => dialogVisible.value,
    (visible) => {
      if (!visible) return
      void loadModelOptions()
    }
  )

  async function init() {
    const data = await AiAgentApi.pageInit()
    dict.value = {
      ...data.dict,
      scene_arr: data.dict.scene_arr.length > 0 ? data.dict.scene_arr : [
        { label: t('aiAgents.scene.chat'), value: 'chat' },
        { label: t('aiAgents.scene.agentGenerate'), value: 'agent_generate' },
        { label: t('aiAgents.scene.textGenerate'), value: 'text_generate' },
        { label: t('aiAgents.scene.imageGenerate'), value: 'image_generate' },
        { label: t('aiAgents.scene.videoGenerate'), value: 'video_generate' },
        { label: t('aiAgents.scene.audioGenerate'), value: 'audio_generate' },
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

  async function testConnection(row: AiAgentItem) {
    await AiAgentApi.test({ id: row.id })
    ElNotification.success({ message: t('aiAgents.testDone') })
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
    const api = dialogMode.value === 'add' ? AiAgentApi.create : AiAgentApi.update
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

  return {
    t, isMobile, dict, searchForm, searchFields, columns,
    listLoading, listData, page, onSearch, onPageChange, refresh, getList,
    confirmDel, toggleStatus, dialogVisible, dialogMode, form, rules,
    modelLoading, modelOptions, toolDialogVisible, toolAgent,
    knowledgeDialogVisible, knowledgeAgent, loadModelOptions,
    add, edit, openTools, openKnowledge, testConnection, confirmSubmit, sceneText,
  }
}
