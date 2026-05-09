import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type JsonObject = Record<string, unknown>
export type AiProviderDriver = 'openai'
export type AiEngineType = AiProviderDriver
export type AiEngineHealthStatus = 'unknown' | 'ok' | 'failed'
export type AiModelSyncStatus = 'unknown' | 'ok' | 'failed'

export interface AiEngineConnectionInitResponse {
  dict: {
    engine_type_arr: DictOption<AiProviderDriver>[]
    common_status_arr: DictOption<number>[]
    health_status_arr: DictOption<AiEngineHealthStatus>[]
    model_sync_arr?: DictOption<AiModelSyncStatus>[]
  }
}

export interface AiEngineConnectionListParams extends RequestPayload {
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
  is_default: number
  source: string
  raw?: JsonObject | null
  status: number
  status_name?: string
  created_at?: string
  updated_at?: string
}

export interface AiModelOptionItem {
  model_id: string
  display_name: string
  owned_by?: string
  raw?: JsonObject | null
}

export interface AiModelOptionsResponse {
  list: AiModelOptionItem[]
}

export interface AiProviderModelsResponse {
  list: AiProviderModelItem[]
}

export interface AiEngineConnectionItem {
  id: number
  name: string
  engine_type: AiProviderDriver
  engine_type_name?: string
  driver?: AiProviderDriver
  driver_name?: string
  base_url: string
  base_url_effective?: string
  api_key_masked?: string | null
  health_status: AiEngineHealthStatus
  last_checked_at?: string | null
  last_check_error?: string | null
  last_model_sync_at?: string | null
  last_model_sync_status?: AiModelSyncStatus
  last_model_sync_error?: string | null
  enabled_model_count?: number
  default_model_id?: string
  models?: AiProviderModelItem[]
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiEngineConnectionMutationParams {
  id?: Id
  name: string
  engine_type?: AiProviderDriver
  driver?: AiProviderDriver
  base_url?: string
  api_key?: string
  model_ids: string[]
  default_model_id: string
  model_display_names?: Record<string, string>
  status: number
}

export interface AiEngineConnectionMutationBody {
  name: string
  engine_type: AiProviderDriver
  driver: AiProviderDriver
  base_url: string
  api_key?: string
  model_ids: string[]
  default_model_id: string
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
  default_model_id: string
  model_display_names?: Record<string, string>
  statuses?: Record<string, number>
}

export interface AiProviderModelsUpdateBody {
  model_ids: string[]
  default_model_id: string
  model_display_names?: Record<string, string>
  statuses?: Record<string, number>
}

export interface AiEngineConnectionCreateResponse {
  id: number
}

export interface AiEngineConnectionTestResult {
  ok: boolean
  status?: string
  latency_ms?: number
  message?: string
  model_count?: number
  raw?: JsonObject | null
}

interface AiEngineConnectionListQueryParams {
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

function normalizeListParams(params: AiEngineConnectionListParams): AiEngineConnectionListQueryParams {
  const query: AiEngineConnectionListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (params.engine_type) query.engine_type = params.engine_type
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiEngineConnectionMutationParams): AiEngineConnectionMutationBody {
  const driver = params.driver ?? params.engine_type ?? 'openai'
  return {
    name: params.name,
    engine_type: driver,
    driver,
    base_url: params.base_url ?? '',
    api_key: params.api_key,
    model_ids: params.model_ids,
    default_model_id: params.default_model_id,
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
    default_model_id: params.default_model_id,
    model_display_names: params.model_display_names,
    statuses: params.statuses,
  }
}

function deleteConnection(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`)
}

export const AiEngineConnectionApi = {
  init: () => request.get<AiEngineConnectionInitResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/page-init`),
  list: (params: AiEngineConnectionListParams) => request.get<PaginatedResponse<AiEngineConnectionItem>>(`${ADMIN_API_PREFIX}/ai-engine-connections`, { params: normalizeListParams(params) }),
  previewModels: (params: AiModelOptionsParams) => request.post<AiModelOptionsResponse, AiModelOptionsBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/model-options`, modelOptionsBody(params)),
  add: (params: AiEngineConnectionMutationParams) => request.post<AiEngineConnectionCreateResponse, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections`, mutationBody(params)),
  edit: (params: AiEngineConnectionMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI provider id')
    return request.put<void, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI provider id')}/status`, { status: params.status }),
  test: (params: { id: Id }) => request.post<AiEngineConnectionTestResult>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI provider id')}/test`),
  syncModels: (params: { id: Id }) => request.post<AiModelOptionsResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI provider id')}/sync-models`),
  models: (params: { id: Id }) => request.get<AiProviderModelsResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI provider id')}/models`),
  updateModels: (params: AiProviderModelsUpdateParams) => {
    const id = positiveID(params.id, 'AI provider id')
    return request.put<void, AiProviderModelsUpdateBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}/models`, updateModelsBody(params))
  },
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteConnection(positiveID(item, 'AI provider id'))))
  },
}
