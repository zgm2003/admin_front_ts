import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type AiProviderDriver = 'openai'
export type AiProviderHealthStatus = 'unknown' | 'ok' | 'failed'
export type AiModelSyncStatus = 'unknown' | 'ok' | 'failed'

export interface AiProviderInitResponse {
  dict: {
    engine_type_arr: DictOption<AiProviderDriver>[]
    common_status_arr: DictOption<number>[]
    health_status_arr: DictOption<AiProviderHealthStatus>[]
    model_sync_arr?: DictOption<AiModelSyncStatus>[]
  }
}

export interface AiProviderListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  engine_type?: AiProviderDriver | ''
  status?: number | ''
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

export interface AiProviderItem {
  id: number
  name: string
  engine_type: AiProviderDriver
  engine_type_name?: string
  driver?: AiProviderDriver
  driver_name?: string
  base_url: string
  base_url_effective?: string
  api_key_masked?: string | null
  health_status: AiProviderHealthStatus
  last_checked_at?: string | null
  last_check_error?: string | null
  last_model_sync_at?: string | null
  last_model_sync_status?: AiModelSyncStatus
  last_model_sync_error?: string | null
  enabled_model_count?: number
  models?: AiProviderModelItem[]
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiProviderMutationParams {
  id?: Id
  name: string
  engine_type?: AiProviderDriver
  driver?: AiProviderDriver
  base_url?: string
  api_key?: string
  model_ids: string[]
  model_display_names?: Record<string, string>
  status: number
}

export interface AiProviderMutationBody {
  name: string
  engine_type: AiProviderDriver
  driver: AiProviderDriver
  base_url: string
  api_key?: string
  model_ids: string[]
  model_display_names?: Record<string, string>
  status: number
}

export interface AiModelOptionsParams {
  driver?: AiProviderDriver
  engine_type?: AiProviderDriver
  base_url?: string
  api_key: string
}

export interface AiModelOptionsBody {
  driver: AiProviderDriver
  engine_type: AiProviderDriver
  base_url: string
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

export interface AiProviderTestResult {
  ok: boolean
  status?: string
  latency_ms?: number
  message?: string
  model_count?: number
}

interface AiProviderListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  engine_type?: AiProviderDriver
  status?: number
}

export function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
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
  const driver = params.driver ?? params.engine_type ?? 'openai'
  return {
    name: params.name,
    engine_type: driver,
    driver,
    base_url: params.base_url ?? '',
    api_key: params.api_key,
    model_ids: params.model_ids,
    model_display_names: params.model_display_names,
    status: params.status,
  }
}

function modelOptionsBody(params: AiModelOptionsParams): AiModelOptionsBody {
  const driver = params.driver ?? params.engine_type ?? 'openai'
  return {
    driver,
    engine_type: driver,
    base_url: params.base_url ?? '',
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

function deleteProvider(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-providers/${id}`)
}

const pageInit = () => request.get<AiProviderInitResponse>(`${ADMIN_API_PREFIX}/ai-providers/page-init`)
const create = (params: AiProviderMutationParams) => request.post<AiProviderCreateResponse, AiProviderMutationBody>(`${ADMIN_API_PREFIX}/ai-providers`, mutationBody(params))
const update = (params: AiProviderMutationParams) => {
  const id = positiveID(params.id ?? 0, 'AI provider id')
  return request.put<void, AiProviderMutationBody>(`${ADMIN_API_PREFIX}/ai-providers/${id}`, mutationBody(params))
}
const changeStatus = (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, 'AI provider id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => deleteProvider(positiveID(params.id, 'AI provider id'))
const deleteBatch = async (params: { ids: Id[] }): Promise<void> => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}
const del = async (params: { id: Id | Id[] }): Promise<void> => {
  const ids = Array.isArray(params.id) ? params.id : [params.id]
  await deleteBatch({ ids })
}

export const AiProviderApi = {
  pageInit,
  list: (params: AiProviderListParams) => request.get<PaginatedResponse<AiProviderItem>>(`${ADMIN_API_PREFIX}/ai-providers`, { params: normalizeListParams(params) }),
  previewModels: (params: AiModelOptionsParams) => request.post<AiModelOptionsResponse, AiModelOptionsBody>(`${ADMIN_API_PREFIX}/ai-providers/model-options`, modelOptionsBody(params)),
  previewStoredModels: (params: { id: Id }) => request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, 'AI provider id')}/model-options`),
  create,
  update,
  changeStatus,
  test: (params: { id: Id }) => request.post<AiProviderTestResult>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, 'AI provider id')}/test`),
  syncModels: (params: { id: Id }) => request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, 'AI provider id')}/sync-models`),
  models: (params: { id: Id }) => request.get<AiProviderModelsResponse>(`${ADMIN_API_PREFIX}/ai-providers/${positiveID(params.id, 'AI provider id')}/models`),
  updateModels: (params: AiProviderModelsUpdateParams) => {
    const id = positiveID(params.id, 'AI provider id')
    return request.put<void, AiProviderModelsUpdateBody>(`${ADMIN_API_PREFIX}/ai-providers/${id}/models`, updateModelsBody(params))
  },
  deleteOne,
  deleteBatch,
  init: pageInit,
  add: create,
  edit: update,
  status: changeStatus,
  del,
}

