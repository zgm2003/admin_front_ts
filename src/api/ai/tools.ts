import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject { [key: string]: JsonValue }

export type AiToolRiskLevel = 'low' | 'medium' | 'high'

export interface AiToolInitResponse {
  dict: {
    risk_level_arr: DictOption<AiToolRiskLevel>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiToolListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  risk_level?: AiToolRiskLevel | ''
  status?: number | ''
}

export interface AiToolItem {
  id: number
  name: string
  code: string
  description: string
  executor: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  risk_level_name: string
  timeout_ms: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiToolMutationParams {
  id?: Id
  name: string
  code: string
  description: string
  executor: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: number
}

export interface AiToolMutationBody {
  name: string
  code: string
  description: string
  executor: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: number
}

export interface AiToolCreateResponse {
  id: number
}

interface AiToolListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  risk_level?: AiToolRiskLevel
  status?: number
}

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiToolListParams): AiToolListQueryParams {
  const query: AiToolListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (params.name) query.name = params.name
  if (params.code) query.code = params.code
  if (params.risk_level) query.risk_level = params.risk_level
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiToolMutationParams): AiToolMutationBody {
  return {
    name: params.name,
    code: params.code,
    description: params.description,
    executor: params.executor,
    parameters_json: params.parameters_json,
    result_schema_json: params.result_schema_json,
    risk_level: params.risk_level,
    timeout_ms: params.timeout_ms,
    status: params.status,
  }
}

function deleteTool(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-tools/${id}`)
}

export const AiToolApi = {
  init: () => request.get<AiToolInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/page-init`),
  list: (params: AiToolListParams) => request.get<PaginatedResponse<AiToolItem>>(`${ADMIN_API_PREFIX}/ai-tools`, { params: normalizeListParams(params) }),
  add: (params: AiToolMutationParams) => request.post<AiToolCreateResponse, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools`, mutationBody(params)),
  edit: (params: AiToolMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI tool id')
    return request.put<void, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-tools/${positiveID(params.id, 'AI tool id')}/status`, { status: params.status }),
  del: async (params: { id: Id | Id[] }) => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteTool(positiveID(item, 'AI tool id'))))
  },
}
