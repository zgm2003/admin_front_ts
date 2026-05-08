import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type JsonObject = { [key: string]: unknown }

export interface AiToolInitResponse {
  dict: {
    ai_executor_type_arr: DictOption<number>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiToolListParams {
  current_page?: number
  page_size?: number
  name?: string
  status?: number | ''
  executor_type?: number | ''
}

interface AiToolListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  status?: number
  executor_type?: number
}

export interface AiToolItem {
  id: number
  name: string
  code: string
  description?: string | null
  schema_json?: JsonObject | null
  executor_type: number
  executor_name: string
  executor_config?: JsonObject | null
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiToolMutationBody {
  name: string
  code: string
  description?: string | null
  schema_json?: JsonObject | null
  executor_type: number
  executor_config?: JsonObject | null
  status?: number
}

export interface AiToolMutationParams extends AiToolMutationBody {
  id?: number
}

export interface AiToolCreateResponse {
  id: number
}

export interface AiToolStatusBody {
  status: number
}

export interface AgentToolOption {
  value: number
  label: string
  code: string
}

export interface AiAgentToolsResponse {
  bound_tool_ids: number[]
  all_tools: AgentToolOption[]
}

export interface AiAgentToolBindingBody {
  tool_ids: number[]
}

function normalizeListParams(params: AiToolListParams): AiToolListQueryParams {
  const query: AiToolListQueryParams = {}

  if (typeof params.current_page === 'number') {
    query.current_page = params.current_page
  }
  if (typeof params.page_size === 'number') {
    query.page_size = params.page_size
  }
  if (params.name) {
    query.name = params.name
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (typeof params.executor_type === 'number') {
    query.executor_type = params.executor_type
  }

  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('AI tool id must be a positive integer')
  }
  return id
}

function mutationBody(params: AiToolMutationParams): AiToolMutationBody {
  return {
    name: params.name,
    code: params.code,
    description: params.description ?? null,
    schema_json: params.schema_json ?? null,
    executor_type: params.executor_type,
    executor_config: params.executor_config ?? null,
    ...(typeof params.status === 'number' ? { status: params.status } : {}),
  }
}

function deleteTool(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-tools/${id}`)
}

function agentOptionsParams(params: { agent_id?: number }): { agent_id?: number } {
  if (typeof params.agent_id !== 'number') {
    return {}
  }
  return { agent_id: positiveID(params.agent_id) }
}

export const AiToolApi = {
  init: () => request.get<AiToolInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/page-init`),
  list: (params: AiToolListParams) => request.get<PaginatedResponse<AiToolItem>>(`${ADMIN_API_PREFIX}/ai-tools`, { params: normalizeListParams(params) }),
  add: (params: AiToolMutationParams) => request.post<AiToolCreateResponse, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools`, mutationBody(params)),
  edit: (params: AiToolMutationParams) => {
    const id = positiveID(params.id ?? 0)
    return request.put<void, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}`, mutationBody(params))
  },
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteTool(positiveID(item))))
  },
  status: (params: { id: Id; status: number }) => {
    const id = positiveID(params.id)
    const body: AiToolStatusBody = { status: params.status }
    return request.patch<void, AiToolStatusBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}/status`, body)
  },
  getAgentTools: (params: { agent_id?: number } = {}) => request.get<AiAgentToolsResponse>(`${ADMIN_API_PREFIX}/ai-tools/agent-options`, { params: agentOptionsParams(params) }),
  bindTools: (params: { agent_id: number; tool_ids: number[] }) => {
    const agentID = positiveID(params.agent_id)
    const body: AiAgentToolBindingBody = { tool_ids: params.tool_ids }
    return request.put<void, AiAgentToolBindingBody>(`${ADMIN_API_PREFIX}/ai-tools/agent-bindings/${agentID}`, body)
  },
}
