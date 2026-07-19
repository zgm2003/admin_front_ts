import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id, RequestPayload } from '@/types/common'

export type AiProviderDriver = 'openai'
export type AiProviderHealthStatus = 'unknown' | 'ok' | 'failed'
export type AiModelSyncStatus = 'unknown' | 'ok' | 'failed'
export type AiProviderStatus = 1 | 2

export interface AiProviderInitResponse {
  dict: {
    engine_type_arr: DictOption<AiProviderDriver>[]
    common_status_arr: DictOption<AiProviderStatus>[]
    health_status_arr: DictOption<AiProviderHealthStatus>[]
    model_sync_arr?: DictOption<AiModelSyncStatus>[]
  }
}

export interface AiProviderListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  engine_type?: AiProviderDriver | ''
  status?: AiProviderStatus | ''
}

export interface AiProviderModelItem {
  id: number
  provider_id: number
  model_id: string
  display_name: string
  status: number
  status_name?: string
  created_at?: string
  updated_at?: string
}

export interface AiModelOptionItem {
  model_id: string
  display_name: string
  owned_by?: string
}

export interface AiModelOptionsResponse {
  list: AiModelOptionItem[]
}

export interface AiProviderModelsResponse {
  list: AiProviderModelItem[]
}

type AiProviderContractItem = components['schemas']['Go_internal_module_ai_provider_ProviderDTO_Output']
export interface AiProviderItem extends Omit<AiProviderContractItem, 'engine_type' | 'health_status' | 'last_model_sync_status' | 'status'> {
  engine_type: AiProviderDriver
  health_status: AiProviderHealthStatus
  last_model_sync_status: AiModelSyncStatus
  status: AiProviderStatus
}
export interface AiProviderListResponse extends Omit<components['schemas']['Go_internal_module_ai_provider_ListResponse_Output'], 'list'> {
  list: AiProviderItem[]
}

export interface AiProviderMutationParams {
  id?: Id
  name: string
  engine_type: AiProviderDriver
  base_url?: string
  api_key?: string
  model_ids: string[]
  model_display_names?: Record<string, string>
  status: AiProviderStatus
}

export interface AiProviderMutationBody {
  name: string
  engine_type: AiProviderDriver
  base_url?: string
  api_key?: string
  model_ids: string[]
  model_display_names?: Record<string, string>
  status: AiProviderStatus
}

export interface AiModelOptionsParams {
  engine_type: AiProviderDriver
  base_url?: string
  api_key: string
}

export interface AiModelOptionsBody {
  engine_type: AiProviderDriver
  base_url?: string
  api_key: string
}

export interface AiProviderModelsUpdateParams {
  id: Id
  model_ids: string[]
  model_display_names?: Record<string, string>
  statuses?: Record<string, number>
}

export interface AiProviderModelsUpdateBody {
  model_ids: string[]
  model_display_names?: Record<string, string>
  statuses?: Record<string, number>
}

export interface AiProviderCreateResponse {
  id: number
}

export type AiProviderTestResult = components['schemas']['Go_internal_infra_ai_TestConnectionResult_Output']

type AiProviderListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_providers'>['query']>

export function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function requiredPositiveID(value: Id | undefined, label: string): number {
  if (value === undefined) throw new Error(`${label} is required`)
  return positiveID(value, label)
}

function normalizeListParams(params: AiProviderListParams): AiProviderListQueryParams {
  const query: AiProviderListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (params.engine_type) query.engine_type = params.engine_type
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiProviderMutationParams): AiProviderMutationBody {
  return {
    name: params.name,
    engine_type: params.engine_type,
    base_url: params.base_url,
    api_key: params.api_key,
    model_ids: params.model_ids,
    model_display_names: params.model_display_names,
    status: params.status,
  }
}

function modelOptionsBody(params: AiModelOptionsParams): AiModelOptionsBody {
  return {
    engine_type: params.engine_type,
    base_url: params.base_url,
    api_key: params.api_key,
  }
}

function updateModelsBody(params: AiProviderModelsUpdateParams): AiProviderModelsUpdateBody {
  return {
    model_ids: params.model_ids,
    model_display_names: params.model_display_names,
    statuses: params.statuses,
  }
}

async function deleteProvider(id: number, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_providers_id, {
    path: { id },
  }, options)
}

function isProviderStatus(value: number): value is AiProviderStatus {
  return value === 1 || value === 2
}

function isHealthStatus(value: string): value is AiProviderHealthStatus {
  return value === 'unknown' || value === 'ok' || value === 'failed'
}

function isModelSyncStatus(value: string): value is AiModelSyncStatus {
  return value === 'unknown' || value === 'ok' || value === 'failed'
}

function toProviderItem(item: AiProviderContractItem): AiProviderItem {
  if (
    item.engine_type !== 'openai'
    || !isHealthStatus(item.health_status)
    || !isModelSyncStatus(item.last_model_sync_status)
    || !isProviderStatus(item.status)
  ) {
    throw new Error('AI provider item violates the editable contract')
  }
  return {
    ...item,
    engine_type: item.engine_type,
    health_status: item.health_status,
    last_model_sync_status: item.last_model_sync_status,
    status: item.status,
  }
}

function toProviderInit(response: components['schemas']['Go_internal_module_ai_provider_InitResponse_Output']): AiProviderInitResponse {
  const engines = response.dict.engine_type_arr.map((option) => {
    if (option.value !== 'openai') throw new Error('AI provider engine dictionary violates the contract')
    return { label: option.label, value: 'openai' as const }
  })
  const statuses = response.dict.common_status_arr.map((option) => {
    if (!isProviderStatus(option.value)) throw new Error('AI provider status dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const health = response.dict.health_status_arr.map((option) => {
    if (!isHealthStatus(option.value)) throw new Error('AI provider health dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const sync = response.dict.model_sync_arr.map((option) => {
    if (!isModelSyncStatus(option.value)) throw new Error('AI provider model sync dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  return {
    dict: {
      engine_type_arr: engines,
      common_status_arr: statuses,
      health_status_arr: health,
      model_sync_arr: sync,
    },
  }
}

const pageInit = async (options: ExecuteOptions = {}): Promise<AiProviderInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_providers_page_init, {}, options)
  return toProviderInit(response)
}
const create = (params: AiProviderMutationParams, options: ExecuteOptions = {}): Promise<AiProviderCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_providers, { body: mutationBody(params) }, options)
const update = async (params: AiProviderMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  const id = requiredPositiveID(params.id, 'AI provider id')
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_providers_id, {
    path: { id },
    body: mutationBody(params),
  }, options)
}
const changeStatus = async (params: { id: Id; status: 1 | 2 }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_providers_id_status, {
    path: { id: positiveID(params.id, 'AI provider id') },
    body: { status: params.status },
  }, options)
}
const deleteOne = (params: { id: Id }, options: ExecuteOptions = {}) =>
  deleteProvider(positiveID(params.id, 'AI provider id'), options)
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  if (params.ids.length === 0) throw new Error('AI provider ids must not be empty')
  await Promise.all(params.ids.map((item) => deleteOne({ id: item }, options)))
}

export const AiProviderApi = {
  pageInit,
  list: async (params: AiProviderListParams, options: ExecuteOptions = {}): Promise<AiProviderListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_providers, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toProviderItem), page: response.page }
  },
  previewModels: (params: AiModelOptionsParams, options: ExecuteOptions = {}): Promise<AiModelOptionsResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_providers_model_options, {
      body: modelOptionsBody(params),
    }, options),
  previewStoredModels: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiModelOptionsResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_providers_id_model_options, {
      path: { id: positiveID(params.id, 'AI provider id') },
    }, options),
  create,
  update,
  changeStatus,
  test: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiProviderTestResult> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_providers_id_test, {
      path: { id: positiveID(params.id, 'AI provider id') },
    }, options),
  syncModels: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiModelOptionsResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_providers_id_sync_models, {
      path: { id: positiveID(params.id, 'AI provider id') },
    }, options),
  models: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiProviderModelsResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_providers_id_models, {
      path: { id: positiveID(params.id, 'AI provider id') },
    }, options),
  updateModels: async (params: AiProviderModelsUpdateParams, options: ExecuteOptions = {}): Promise<void> => {
    const id = positiveID(params.id, 'AI provider id')
    await executeAdminOperation(adminOperations.put_api_admin_v1_ai_providers_id_models, {
      path: { id },
      body: updateModelsBody(params),
    }, options)
  },
  deleteOne,
  deleteBatch,
}
