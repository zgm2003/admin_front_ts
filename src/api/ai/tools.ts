import { legacyRequest } from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface AiToolInitResponse {
  dict: {
    ai_executor_type_arr: DictOption<number>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiToolListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  status?: number | ''
}

export interface AiToolItem {
  id: number
  name: string
  code: string
  description?: string | null
  schema_json?: Record<string, unknown> | null
  executor_type: number
  executor_name: string
  executor_config?: Record<string, unknown> | null
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiToolMutationParams extends RequestPayload {
  id?: number
  name: string
  code: string
  description?: string | null
  schema_json?: Record<string, unknown> | null
  executor_type: number
  executor_config?: Record<string, unknown> | null
  status?: number
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

export const AiToolApi = {
  init: (params?: RequestPayload) => legacyRequest.post<AiToolInitResponse>('/api/admin/AiTools/init', params),
  list: (params: AiToolListParams) => legacyRequest.post<PaginatedResponse<AiToolItem>>('/api/admin/AiTools/list', params),
  add: (params: AiToolMutationParams) => legacyRequest.post<void>('/api/admin/AiTools/add', params),
  edit: (params: AiToolMutationParams) => legacyRequest.post<void>('/api/admin/AiTools/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<{ affected: number }>('/api/admin/AiTools/del', params),
  status: (params: { id: Id; status: number }) => legacyRequest.post<{ affected: number }>('/api/admin/AiTools/status', params),
  bindTools: (params: { agent_id: number; tool_ids: number[] }) => legacyRequest.post<void>('/api/admin/AiTools/bindTools', params),
  getAgentTools: (params: { agent_id?: number }) => legacyRequest.post<AiAgentToolsResponse>('/api/admin/AiTools/getAgentTools', params),
}
