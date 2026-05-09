import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiProviderDriver } from './providers'

export type JsonObject = Record<string, unknown>
export type AiToolType = 'dify_tool' | 'workflow_node' | 'admin_action_gateway' | 'http_reference'
export type AiToolRiskLevel = 'low' | 'medium' | 'high'

export interface AiToolMapInitResponse {
  dict: {
    tool_type_arr: DictOption<AiToolType>[]
    risk_level_arr: DictOption<AiToolRiskLevel>[]
    common_status_arr: DictOption<number>[]
    provider_options: Array<DictOption<number> & { engine_type: AiProviderDriver }>
  }
}

export interface AiToolMapListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  tool_type?: AiToolType | ''
  risk_level?: AiToolRiskLevel | ''
  provider_id?: number | ''
  agent_id?: number | ''
  status?: number | ''
}

export interface AiToolMapItem {
  id: number
  provider_id: number
  provider_name: string
  engine_type: AiProviderDriver | string
  agent_id?: number | null
  name: string
  code: string
  tool_type: AiToolType
  tool_type_name?: string
  engine_tool_id: string
  permission_code: string
  risk_level: AiToolRiskLevel
  risk_level_name?: string
  config_json?: JsonObject | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiToolMapMutationParams {
  id?: Id
  provider_id: number
  agent_id?: number | null
  name: string
  code: string
  tool_type: AiToolType
  engine_tool_id?: string
  permission_code?: string
  risk_level: AiToolRiskLevel
  config_json?: JsonObject | null
  status?: number
}

export interface AiToolMapMutationBody {
  provider_id: number
  agent_id?: number | null
  name: string
  code: string
  tool_type: AiToolType
  engine_tool_id?: string
  permission_code?: string
  risk_level: AiToolRiskLevel
  config_json?: JsonObject | null
  status: number
}

export interface AiToolMapCreateResponse {
  id: number
}

interface AiToolMapListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  tool_type?: AiToolType
  risk_level?: AiToolRiskLevel
  provider_id?: number
  agent_id?: number
  status?: number
}

export function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiToolMapListParams): AiToolMapListQueryParams {
  const query: AiToolMapListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (typeof params.code === 'string' && params.code.trim()) query.code = params.code.trim()
  if (params.tool_type) query.tool_type = params.tool_type
  if (params.risk_level) query.risk_level = params.risk_level
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiToolMapMutationParams): AiToolMapMutationBody {
  return {
    provider_id: params.provider_id,
    agent_id: params.agent_id ?? null,
    name: params.name,
    code: params.code,
    tool_type: params.tool_type,
    engine_tool_id: params.engine_tool_id,
    permission_code: params.permission_code,
    risk_level: params.risk_level,
    config_json: params.config_json ?? null,
    status: params.status ?? 1,
  }
}

function deleteToolMap(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-tool-maps/${id}`)
}

export const AiToolMapApi = {
  init: () => request.get<AiToolMapInitResponse>(`${ADMIN_API_PREFIX}/ai-tool-maps/page-init`),
  list: (params: AiToolMapListParams) => request.get<PaginatedResponse<AiToolMapItem>>(`${ADMIN_API_PREFIX}/ai-tool-maps`, { params: normalizeListParams(params) }),
  add: (params: AiToolMapMutationParams) => request.post<AiToolMapCreateResponse, AiToolMapMutationBody>(`${ADMIN_API_PREFIX}/ai-tool-maps`, mutationBody(params)),
  edit: (params: AiToolMapMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI tool map id')
    return request.put<void, AiToolMapMutationBody>(`${ADMIN_API_PREFIX}/ai-tool-maps/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-tool-maps/${positiveID(params.id, 'AI tool map id')}/status`, { status: params.status }),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteToolMap(positiveID(item, 'AI tool map id'))))
  },
}
