import { computed, reactive, shallowRef } from 'vue'
import type { FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import type {
  AiModelOptionItem,
  AiProviderApiProtocol,
  AiProviderDriver,
  AiProviderItem,
  AiProviderModelKind,
  AiProviderModelItem,
  AiProviderMutationParams,
  AiProviderStatus,
} from '@/api/ai/providers'

export interface ProviderModelDraft {
  model_id: string
  model_kind: AiProviderModelKind
  display_name: string
  status: AiProviderStatus
}

export interface ProviderFormState {
  id?: number
  name: string
  driver: AiProviderDriver
  base_url: string
  api_key: string
  models: ProviderModelDraft[]
  status: AiProviderStatus
  api_protocol: AiProviderApiProtocol
}

export type TranslateFn = (key: string) => string

export function createDefaultProviderForm(): ProviderFormState {
  return {
    name: '',
    driver: 'openai',
    base_url: '',
    api_key: '',
    models: [],
    status: CommonEnum.YES,
    api_protocol: 'chat_completions',
  }
}

export function buildProviderMutationParams(form: ProviderFormState): AiProviderMutationParams {
  const modelIDs = new Set<string>()
  const models = form.models.map((row) => {
    const modelID = row.model_id.trim()
    if (!modelID) throw new Error('Provider model ID must not be blank')
    if (modelIDs.has(modelID)) throw new Error(`Duplicate provider model ID: ${modelID}`)
    modelIDs.add(modelID)
    return { ...row, model_id: modelID }
  })

  return {
    id: form.id,
    name: form.name,
    engine_type: form.driver,
    base_url: form.base_url,
    models: models.map(({ model_id, model_kind }) => ({ model_id, model_kind })),
    model_display_names: Object.fromEntries(models.map((row) => [row.model_id, row.display_name])),
    statuses: Object.fromEntries(models.map((row) => [row.model_id, row.status])),
    status: form.status,
    api_protocol: form.api_protocol,
    ...(form.api_key ? { api_key: form.api_key } : {}),
  }
}

export function createProviderEditForm(
  provider: Pick<AiProviderItem, 'id' | 'name' | 'engine_type' | 'base_url' | 'status' | 'api_protocol'>,
  models: readonly Pick<AiProviderModelItem, 'model_id' | 'model_kind' | 'display_name' | 'status'>[],
): ProviderFormState {
  return {
    id: provider.id,
    name: provider.name,
    driver: provider.engine_type,
    base_url: provider.base_url,
    api_key: '',
    models: models.map((model) => ({ ...model })),
    status: provider.status,
    api_protocol: provider.api_protocol,
  }
}

export function mergeProviderModelCandidates(
  current: readonly ProviderModelDraft[],
  candidates: readonly AiModelOptionItem[],
): ProviderModelDraft[] {
  const modelIDs = new Set(current.map((row) => row.model_id))
  const merged = current.map((row) => ({ ...row }))
  for (const candidate of candidates) {
    if (modelIDs.has(candidate.model_id)) continue
    modelIDs.add(candidate.model_id)
    merged.push({
      model_id: candidate.model_id,
      model_kind: 'chat',
      display_name: candidate.display_name || candidate.model_id,
      status: 1,
    })
  }
  return merged
}

function validateProviderModels(models: ProviderModelDraft[], t: TranslateFn): Error | undefined {
  if (models.length === 0) return new Error(t('aiProviders.validation.modelsRequired'))
  const modelIDs = new Set<string>()
  for (const row of models) {
    const modelID = row.model_id.trim()
    if (!modelID) return new Error(t('aiProviders.validation.modelIdRequired'))
    if (modelIDs.has(modelID)) return new Error(t('aiProviders.validation.modelIdDuplicate'))
    modelIDs.add(modelID)
  }
}

export function useProviderForm(t: TranslateFn) {
  const form = reactive<ProviderFormState>(createDefaultProviderForm())
  const modelLoading = shallowRef(false)

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('aiProviders.form.name') + t('common.required'), trigger: 'blur' }],
    driver: [{ required: true, message: t('aiProviders.form.driver') + t('common.required'), trigger: 'change' }],
    api_protocol: [{ required: true, message: t('aiProviders.form.apiProtocol') + t('common.required'), trigger: 'change' }],
    models: [{
      validator: (_rule, value: ProviderModelDraft[], callback) => {
        const error = validateProviderModels(value, t)
        if (error) callback(error)
        else callback()
      },
      trigger: 'change',
    }],
    status: [{ required: true, message: t('aiProviders.form.status') + t('common.required'), trigger: 'change' }],
  }))

  function reset(next?: Partial<ProviderFormState>) {
    Object.assign(form, createDefaultProviderForm(), next)
    form.models = (next?.models ?? []).map((row) => ({ ...row }))
  }

  return { form, rules, modelLoading, reset }
}
