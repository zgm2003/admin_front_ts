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
  type AiAgentProviderModelOption,
  type AiAgentScene,
  type AiAgentStatus,
} from '@/api/ai/agents'
import { multiplyDecimalStrings } from '@/utils/fixed-decimal'

type ModelPath = [number, string]

interface AgentForm {
  id?: number
  name: string
  model_path: ModelPath | []
  scenes: AiAgentScene[]
  status: AiAgentStatus
  system_prompt: string
  avatar: string
  billing_multiplier: string
}

export function selectableProviderModels(models: readonly AiAgentProviderModelOption[]): AiAgentProviderModelOption[] {
  return models.filter((model) => model.official_model?.lifecycle_status === 'active')
}

export function modelRequiresChange(model: Pick<AiAgentProviderModelOption, 'official_model'> | null | undefined): boolean {
  if (!model) return false
  return !model.official_model || model.official_model.lifecycle_status === 'retired'
}

export function modelCanUseTools(model: Pick<AiAgentProviderModelOption, 'capabilities'> | Pick<AiAgentItem, 'capabilities'> | null | undefined): boolean {
  return model?.capabilities?.supports_tools === true
}

export function useAgentAdminPage(formRef: Ref<FormInstance | null>) {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  const dict = shallowRef<AiAgentInitResponse['dict']>({
    billing_multiplier_default: '', scene_arr: [], common_status_arr: [], provider_options: [], provider_model_options: [],
  })
  const searchForm = ref({
    name: '', scene: '' as AiAgentScene | '', provider_id: '' as number | '', status: '' as AiAgentStatus | '',
  })
  const {
    loading: listLoading, data: listData, page, onSearch, onPageChange, refresh, getList, confirmDel, toggleStatus,
  } = useCrudTable<AiAgentItem>({ api: AiAgentApi, searchForm })

  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const form = ref<AgentForm>(defaultForm())
  const modelOptions = ref<CascaderOption[]>([])
  const editingModel = shallowRef<AiAgentProviderModelOption | null>(null)
  const toolDialogVisible = ref(false)
  const toolAgent = shallowRef<AiAgentItem | null>(null)
  const knowledgeDialogVisible = ref(false)
  const knowledgeAgent = shallowRef<AiAgentItem | null>(null)

  function defaultForm(): AgentForm {
    return {
      name: '', model_path: [], scenes: ['chat'], status: CommonEnum.YES,
      system_prompt: '', avatar: '', billing_multiplier: dict.value.billing_multiplier_default,
    }
  }

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('aiAgents.form.name') + t('common.required'), trigger: 'blur' }],
    model_path: [{ required: true, type: 'array', min: 2, message: t('aiAgents.form.model') + t('common.required'), trigger: 'change' }],
    scenes: [{ required: true, type: 'array', min: 1, message: t('aiAgents.form.scenes') + t('common.required'), trigger: 'change' }],
    status: [{ required: true, message: t('aiAgents.form.status') + t('common.required'), trigger: 'change' }],
    billing_multiplier: [{ required: true, message: t('aiAgents.form.billingMultiplier') + t('common.required'), trigger: 'blur' }],
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
    { key: 'model_id', label: t('aiAgents.table.model'), minWidth: 190 },
    { key: 'billing_multiplier', label: t('aiAgents.table.billingMultiplier'), width: 140 },
    { key: 'scenes', label: t('aiAgents.table.scenes'), width: 150 },
    { key: 'status', label: t('aiAgents.table.status'), width: 90 },
    { key: 'updated_at', label: t('aiAgents.table.updatedAt'), width: 160 },
    { key: 'actions', label: t('common.actions.action'), width: 520 },
  ])

  watch(() => dialogVisible.value, (visible) => {
    if (visible) modelOptions.value = buildModelOptions()
  })

  const selectedModel = computed<AiAgentProviderModelOption | null>(() => {
    const [providerID, modelID] = form.value.model_path
    if (!providerID || !modelID) return null
    return dict.value.provider_model_options.find((model) => model.provider_id === providerID && model.model_id === modelID)
      ?? (editingModel.value?.provider_id === providerID && editingModel.value.model_id === modelID ? editingModel.value : null)
  })

  const displayedCatalogRates = computed(() => selectedModel.value?.catalog_rates?.map((rate) => ({
    ...rate,
    reference_price: multipliedPrice(rate.price, form.value.billing_multiplier),
  })) ?? [])

  const selectedModelRequiresChange = computed(() => modelRequiresChange(selectedModel.value))
  const selectedModelSupportsTools = computed(() => modelCanUseTools(selectedModel.value))

  function multipliedPrice(price: string, multiplier: string): string {
    try { return multiplyDecimalStrings(price, multiplier) } catch { return '' }
  }

  async function init() {
    const data = await AiAgentApi.pageInit()
    dict.value = {
      ...data.dict,
      scene_arr: data.dict.scene_arr.length > 0 ? data.dict.scene_arr : [
        { label: t('aiAgents.scene.chat'), value: 'chat' },
        { label: t('aiAgents.scene.agentGenerate'), value: 'agent_generate' },
        { label: t('aiAgents.scene.textGenerate'), value: 'text_generate' },
        { label: t('aiAgents.scene.imageGenerate'), value: 'image_generate' },
      ],
      provider_model_options: selectableProviderModels(data.dict.provider_model_options),
    }
    modelOptions.value = buildModelOptions()
  }

  function buildModelOptions(): CascaderOption[] {
    const grouped = new Map<number, CascaderOption[]>()
    for (const model of selectableProviderModels(dict.value.provider_model_options)) {
      const children = grouped.get(model.provider_id) ?? []
      children.push({ label: model.display_name || model.model_id, value: model.model_id })
      grouped.set(model.provider_id, children)
    }
    const current = editingModel.value
    const currentLifecycle = current?.official_model?.lifecycle_status
    if (current && currentLifecycle && currentLifecycle !== 'active') {
      const children = grouped.get(current.provider_id) ?? []
      if (!children.some((child) => child.value === current.model_id)) {
        children.unshift({
          label: `${current.display_name || current.model_id} · ${t(`aiAgents.official.lifecycle.${currentLifecycle}`)}`,
          value: current.model_id,
          disabled: true,
        })
      }
      grouped.set(current.provider_id, children)
    }
    return dict.value.provider_options.map((provider) => ({
      label: provider.label, value: provider.value, children: grouped.get(provider.value) ?? [],
    }))
  }

  function onModelChange() {
    const model = selectedModel.value
    if (model) form.value.billing_multiplier = model.billing_multiplier
    if (editingModel.value && model && model.model_id !== editingModel.value.model_id) editingModel.value = null
    modelOptions.value = buildModelOptions()
  }

  function add() {
    dialogMode.value = 'add'
    editingModel.value = null
    form.value = defaultForm()
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  function edit(row: AiAgentItem) {
    dialogMode.value = 'edit'
    editingModel.value = optionFromAgent(row)
    form.value = {
      id: row.id, name: row.name,
      model_path: row.provider_id && row.model_id ? [row.provider_id, row.model_id] : [],
      scenes: row.scenes.length > 0 ? row.scenes : ['chat'], status: row.status,
      system_prompt: row.system_prompt ?? '', avatar: row.avatar ?? '', billing_multiplier: row.billing_multiplier,
    }
    modelOptions.value = buildModelOptions()
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  function openTools(row: AiAgentItem) {
    if (!modelCanUseTools(row)) {
      ElNotification.warning({ message: t('aiAgents.tools.unsupported') })
      return
    }
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
    try { await formRef.value.validate() } catch { return }
    const [providerID, modelID] = form.value.model_path
    if (!providerID || !modelID) {
      ElNotification.warning({ message: t('aiAgents.form.model') + t('common.required') })
      return
    }
    if (!selectedModel.value || selectedModelRequiresChange.value) {
      ElNotification.warning({ message: t('aiAgents.official.retiredWarning') })
      return
    }
    const payload: AiAgentMutationParams = {
      id: form.value.id, name: form.value.name, provider_id: providerID, model_id: modelID,
      scenes: form.value.scenes, status: form.value.status, system_prompt: form.value.system_prompt,
      avatar: form.value.avatar, billing_multiplier: form.value.billing_multiplier,
    }
    await (dialogMode.value === 'add' ? AiAgentApi.create : AiAgentApi.update)(payload)
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await getList()
  }

  function sceneText(row: AiAgentItem): string {
    return row.scene_names?.length ? row.scene_names.join(' / ') : row.scenes.join(' / ')
  }

  onMounted(() => { void init(); void getList() })

  return {
    t, isMobile, dict, searchForm, searchFields, columns,
    listLoading, listData, page, onSearch, onPageChange, refresh, getList, confirmDel, toggleStatus,
    dialogVisible, dialogMode, form, rules, modelOptions, toolDialogVisible, toolAgent,
    knowledgeDialogVisible, knowledgeAgent, selectedModel, displayedCatalogRates,
    selectedModelRequiresChange, selectedModelSupportsTools, onModelChange,
    add, edit, openTools, openKnowledge, testConnection, confirmSubmit, sceneText, modelCanUseTools,
  }
}

function optionFromAgent(row: AiAgentItem): AiAgentProviderModelOption {
  return {
    label: row.model_display_name || row.model_id,
    value: row.model_id,
    provider_id: row.provider_id,
    model_id: row.model_id,
    display_name: row.model_display_name,
    billing_multiplier: row.billing_multiplier,
    official_model: row.official_model,
    capabilities: row.capabilities,
    pricing_version: row.pricing_version,
    catalog_version: row.catalog_version,
    catalog_vendor: row.catalog_vendor,
    catalog_model_id: row.catalog_model_id,
    price_source: row.price_source,
    override_version: row.override_version,
    price_source_url: row.price_source_url,
    price_verified_at: row.price_verified_at,
    context_tier_threshold_tokens: row.context_tier_threshold_tokens,
    catalog_rates: row.catalog_rates,
  }
}
