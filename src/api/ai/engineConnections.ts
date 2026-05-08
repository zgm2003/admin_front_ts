import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type JsonObject = Record<string, unknown>
export type AiEngineType = 'dify' | 'eino' | 'direct' | 'ragflow'
export type AiEngineHealthStatus = 'unknown' | 'healthy' | 'unhealthy'

export interface AiEngineConnectionInitResponse {
  dict: {
    engine_type_arr: DictOption<AiEngineType>[]
    common_status_arr: DictOption<number>[]
    health_status_arr: DictOption<AiEngineHealthStatus>[]
  }
}

export interface AiEngineConnectionListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  engine_type?: AiEngineType | ''
  status?: number | ''
}

export interface AiEngineConnectionItem {
  id: number
  name: string
  engine_type: AiEngineType
  engine_type_name?: string
  base_url: string
  api_key_masked?: string | null
  workspace_id?: string | null
  health_status: AiEngineHealthStatus
  last_checked_at?: string | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiEngineConnectionMutationParams {
  id?: Id
  name: string
  engine_type: AiEngineType
  base_url: string
  api_key?: string
  workspace_id?: string | null
  status: number
}

export interface AiEngineConnectionMutationBody {
  name: string
  engine_type: AiEngineType
  base_url: string
  api_key?: string
  workspace_id?: string | null
  status: number
}

export interface AiEngineConnectionCreateResponse {
  id: number
}

export interface AiEngineConnectionTestResult {
  ok: boolean
  latency_ms?: number
  message?: string
  raw?: JsonObject | null
}

interface AiEngineConnectionListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  engine_type?: AiEngineType
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
  return {
    name: params.name,
    engine_type: params.engine_type,
    base_url: params.base_url,
    api_key: params.api_key,
    workspace_id: params.workspace_id ?? null,
    status: params.status,
  }
}

function deleteConnection(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`)
}

export const AiEngineConnectionApi = {
  init: () => request.get<AiEngineConnectionInitResponse>(`${ADMIN_API_PREFIX}/ai-engine-connections/page-init`),
  list: (params: AiEngineConnectionListParams) => request.get<PaginatedResponse<AiEngineConnectionItem>>(`${ADMIN_API_PREFIX}/ai-engine-connections`, { params: normalizeListParams(params) }),
  add: (params: AiEngineConnectionMutationParams) => request.post<AiEngineConnectionCreateResponse, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections`, mutationBody(params)),
  edit: (params: AiEngineConnectionMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI engine connection id')
    return request.put<void, AiEngineConnectionMutationBody>(`${ADMIN_API_PREFIX}/ai-engine-connections/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI engine connection id')}/status`, { status: params.status }),
  test: (params: { id: Id }) => request.post<AiEngineConnectionTestResult>(`${ADMIN_API_PREFIX}/ai-engine-connections/${positiveID(params.id, 'AI engine connection id')}/test`),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteConnection(positiveID(item, 'AI engine connection id'))))
  },
}
