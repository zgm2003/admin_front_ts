import { computed, reactive, shallowRef } from 'vue'
import type { FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import type { AiModelOptionItem, AiProviderDriver } from '@/api/ai/engineConnections'

export interface ProviderFormState {
  id?: number
  name: string
  driver: AiProviderDriver
  base_url: string
  api_key: string
  workspace_id: string
  model_ids: string[]
  default_model_id: string
  model_display_names: Record<string, string>
  status: number
}

export type TranslateFn = (key: string) => string

export function createDefaultProviderForm(): ProviderFormState {
  return {
    name: '',
    driver: 'openai',
    base_url: '',
    api_key: '',
    workspace_id: '',
    model_ids: [],
    default_model_id: '',
    model_display_names: {},
    status: CommonEnum.YES,
  }
}

export function useProviderForm(t: TranslateFn) {
  const form = reactive<ProviderFormState>(createDefaultProviderForm())
  const modelLoading = shallowRef(false)
  const modelOptions = shallowRef<AiModelOptionItem[]>([])

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('aiProviders.form.name') + t('common.required'), trigger: 'blur' }],
    driver: [{ required: true, message: t('aiProviders.form.driver') + t('common.required'), trigger: 'change' }],
    model_ids: [{ required: true, type: 'array', min: 1, message: t('aiProviders.form.modelIds') + t('common.required'), trigger: 'change' }],
    default_model_id: [{ required: true, message: t('aiProviders.form.defaultModel') + t('common.required'), trigger: 'change' }],
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
