import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiEngineConnectionTestResult, AiEngineType } from './engineConnections'

export type JsonObject = Record<string, unknown>
export type AiAppType = 'chat' | 'workflow' | 'completion' | 'agent'
export type AiResponseMode = 'streaming' | 'blocking'
export type AiBindingType = 'menu' | 'scene' | 'permission' | 'role' | 'user'

export interface AiAppInitResponse {
  dict: {
    app_type_arr: DictOption<AiAppType>[]
    response_mode_arr: DictOption<AiResponseMode>[]
    binding_type_arr: DictOption<AiBindingType>[]
    common_status_arr: DictOption<number>[]
    engine_connection_options: Array<DictOption<number> & { engine_type: AiEngineType }>
  }
}

export interface AiAppListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  app_type?: AiAppType | ''
  engine_connection_id?: number | ''
  status?: number | ''
}

export interface AiAppItem {
  id: number
  engine_connection_id: number
  engine_connection_name: string
  engine_type: AiEngineType | string
  name: string
  code: string
  avatar?: string | null
  description?: string | null
  app_type: AiAppType
  app_type_name?: string
  engine_app_id: string
  engine_app_api_key_masked?: string | null
  default_response_mode: AiResponseMode
  default_response_mode_name?: string
  runtime_config?: JsonObject | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiAppOption {
  id: number
  name: string
  avatar?: string | null
  description?: string | null
  engine_connection_id: number
  engine_type: string
  code?: string
  label?: string
  value?: number
}

interface RemoteAiAppOption {
  id?: number
  name?: string
  avatar?: string | null
  description?: string | null
  engine_connection_id?: number
  engine_type?: string
  code?: string
  label?: string
  value?: number
}

export interface AiAppOptionsResponse {
  list: AiAppOption[]
}

export interface AiAppMutationParams {
  id?: Id
  name: string
  code?: string
  engine_connection_id: number
  engine_app_id: string
  app_type: 'chat' | 'workflow' | 'agent'
  engine_app_api_key?: string
  default_response_mode?: AiResponseMode
  runtime_config?: JsonObject | null
  status?: number
}

export interface AiAppMutationBody {
  name: string
  code: string
  engine_connection_id: number
  engine_app_id: string
  app_type: AiAppMutationParams['app_type']
  engine_app_api_key?: string
  default_response_mode: AiResponseMode
  runtime_config?: JsonObject | null
  status: number
}

export interface AiAppCreateResponse {
  id: number
}

export type AiAppTestResult = AiEngineConnectionTestResult

export interface AiAppBindingItem {
  id: number
  app_id: number
  bind_type: AiBindingType
  bind_type_name?: string
  bind_key: string
  sort: number
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiAppBindingsResponse {
  list: AiAppBindingItem[]
}

export interface AiAppBindingMutationParams {
  app_id: Id
  bind_type: AiBindingType
  bind_key: string
  sort?: number
  status?: number
}

export interface AiAppBindingMutationBody {
  bind_type: AiBindingType
  bind_key: string
  sort: number
  status: number
}

interface AiAppListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  app_type?: AiAppType
  engine_connection_id?: number
  status?: number
}

export function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiAppListParams): AiAppListQueryParams {
  const query: AiAppListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (typeof params.code === 'string' && params.code.trim()) query.code = params.code.trim()
  if (params.app_type) query.app_type = params.app_type
  if (typeof params.engine_connection_id === 'number') query.engine_connection_id = params.engine_connection_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiAppMutationParams): AiAppMutationBody {
  return {
    name: params.name,
    code: params.code ?? params.name,
    engine_connection_id: params.engine_connection_id,
    engine_app_id: params.engine_app_id,
    app_type: params.app_type,
    engine_app_api_key: params.engine_app_api_key,
    default_response_mode: params.default_response_mode ?? 'streaming',
    runtime_config: params.runtime_config ?? null,
    status: params.status ?? 1,
  }
}

function bindingBody(params: AiAppBindingMutationParams): AiAppBindingMutationBody {
  return {
    bind_type: params.bind_type,
    bind_key: params.bind_key,
    sort: params.sort ?? 0,
    status: params.status ?? 1,
  }
}

function normalizeOption(item: RemoteAiAppOption): AiAppOption {
  return {
    id: item.id ?? item.value ?? 0,
    name: item.name ?? item.label ?? '',
    avatar: item.avatar ?? null,
    description: item.description ?? null,
    engine_connection_id: item.engine_connection_id ?? 0,
    engine_type: item.engine_type ?? '',
    code: item.code,
    label: item.label,
    value: item.value,
  }
}

async function listOptions(): Promise<AiAppOptionsResponse> {
  const response = await request.get<AiAppOptionsResponse>(`${ADMIN_API_PREFIX}/ai-apps/options`)
  return { list: response.list.map(normalizeOption).filter((item) => item.id > 0 && item.name !== '') }
}

function deleteApp(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-apps/${id}`)
}

export const AiAppApi = {
  init: () => request.get<AiAppInitResponse>(`${ADMIN_API_PREFIX}/ai-apps/page-init`),
  list: (params: AiAppListParams) => request.get<PaginatedResponse<AiAppItem>>(`${ADMIN_API_PREFIX}/ai-apps`, { params: normalizeListParams(params) }),
  options: () => listOptions(),
  detail: (params: { id: Id }) => request.get<AiAppItem>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.id, 'AI app id')}`),
  add: (params: AiAppMutationParams) => request.post<AiAppCreateResponse, AiAppMutationBody>(`${ADMIN_API_PREFIX}/ai-apps`, mutationBody(params)),
  edit: (params: AiAppMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI app id')
    return request.put<void, AiAppMutationBody>(`${ADMIN_API_PREFIX}/ai-apps/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.id, 'AI app id')}/status`, { status: params.status }),
  test: (params: { id: Id }) => request.post<AiAppTestResult>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.id, 'AI app id')}/test`),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteApp(positiveID(item, 'AI app id'))))
  },
  bindings: (params: { app_id: Id }) => request.get<AiAppBindingsResponse>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.app_id, 'AI app id')}/bindings`),
  addBinding: (params: AiAppBindingMutationParams) => request.post<{ id: number }, AiAppBindingMutationBody>(`${ADMIN_API_PREFIX}/ai-apps/${positiveID(params.app_id, 'AI app id')}/bindings`, bindingBody(params)),
  deleteBinding: (id: Id) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-app-bindings/${positiveID(id, 'AI app binding id')}`),
}
