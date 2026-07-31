import { computed, reactive, shallowRef } from 'vue'
import type { FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import type {
  AiModelOptionItem,
  AiProviderApiProtocol,
  AiProviderDriver,
  AiProviderItem,
  AiProviderModelItem,
  AiProviderMutationParams,
  AiProviderStatus,
} from '@/api/ai/providers'

export interface ProviderFormState {
  id?: number
  name: string
  driver: AiProviderDriver
  base_url: string
  api_key: string
  model_ids: string[]
  model_display_names: Record<string, string>
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
    model_ids: [],
    model_display_names: {},
    status: CommonEnum.YES,
    api_protocol: 'chat_completions',
  }
}

export function buildProviderMutationParams(form: ProviderFormState): AiProviderMutationParams {
  return {
    id: form.id,
    name: form.name,
    engine_type: form.driver,
    base_url: form.base_url,
    model_ids: [...form.model_ids],
    model_display_names: { ...form.model_display_names },
    status: form.status,
    api_protocol: form.api_protocol,
    ...(form.api_key ? { api_key: form.api_key } : {}),
  }
}

export function createProviderEditForm(
  provider: Pick<AiProviderItem, 'id' | 'name' | 'engine_type' | 'base_url' | 'status' | 'api_protocol'>,
  models: readonly Pick<AiProviderModelItem, 'model_id' | 'display_name'>[],
): ProviderFormState {
  return {
    id: provider.id,
    name: provider.name,
    driver: provider.engine_type,
    base_url: provider.base_url,
    api_key: '',
    model_ids: models.map((model) => model.model_id),
    model_display_names: Object.fromEntries(
      models.map((model) => [model.model_id, model.display_name || model.model_id]),
    ),
    status: provider.status,
    api_protocol: provider.api_protocol,
  }
}

export function useProviderForm(t: TranslateFn) {
  const form = reactive<ProviderFormState>(createDefaultProviderForm())
  const modelLoading = shallowRef(false)
  const modelOptions = shallowRef<AiModelOptionItem[]>([])

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('aiProviders.form.name') + t('common.required'), trigger: 'blur' }],
    driver: [{ required: true, message: t('aiProviders.form.driver') + t('common.required'), trigger: 'change' }],
    api_protocol: [{ required: true, message: t('aiProviders.form.apiProtocol') + t('common.required'), trigger: 'change' }],
    model_ids: [{ required: true, type: 'array', min: 1, message: t('aiProviders.form.modelIds') + t('common.required'), trigger: 'change' }],
    status: [{ required: true, message: t('aiProviders.form.status') + t('common.required'), trigger: 'change' }],
  }))

  function reset(next?: Partial<ProviderFormState>) {
    Object.assign(form, createDefaultProviderForm(), next)
    form.model_ids = [...(next?.model_ids ?? [])]
    form.model_display_names = { ...(next?.model_display_names ?? {}) }
    modelOptions.value = []
  }

  return { form, rules, modelLoading, modelOptions, reset }
}
