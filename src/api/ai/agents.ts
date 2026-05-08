import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type JsonObject = { [key: string]: unknown }

export interface AiAgentCapabilities {
  chat?: boolean
  tools?: boolean
  rag?: boolean
  workflow?: boolean
}

export interface AiAgentListParams {
  current_page?: number
  page_size?: number
  name?: string
  model_id?: number | ''
  mode?: string | ''
  status?: number | ''
}

export interface AiAgentItem {
  id: number
  name: string
  model_id: number
  model_name: string
  model_deleted: boolean
  driver: string
  driver_name: string
  model_code: string
  avatar?: string | null
  system_prompt?: string | null
  mode: string
  mode_name: string
  scene?: string | null
  scene_name?: string | null
  scene_codes: string[]
  scene_names: string[]
  capabilities: AiAgentCapabilities
  runtime_config?: JsonObject | null
  policy?: JsonObject | null
  knowledge_base_ids: number[]
  knowledge_base_names: string[]
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiAgentInitResponse {
  dict: {
    ai_mode_arr: DictOption<string>[]
    ai_capability_arr: DictOption<string>[]
    ai_scene_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
    model_list: DictOption<number>[]
    knowledge_base_list: DictOption<number>[]
  }
}

export interface AiAgentMutationParams {
  id?: number
  name: string
  model_id: number
  avatar?: string | null
  system_prompt?: string | null
  mode?: string
  scene?: string | null
  capabilities?: AiAgentCapabilities
  scene_codes?: string[]
  runtime_config?: JsonObject | null
  policy?: JsonObject | null
  status?: number
  tool_ids?: number[]
  knowledge_base_ids?: number[]
}


interface AiAgentListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  model_id?: number
  mode?: string
  status?: number
}

type AiAgentMutationBody = Omit<AiAgentMutationParams, 'id'>

function normalizeListParams(params: AiAgentListParams): AiAgentListQueryParams {
  const query: AiAgentListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (params.name) query.name = params.name
  if (typeof params.model_id === 'number') query.model_id = params.model_id
  if (params.mode) query.mode = params.mode
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('AI agent id must be a positive integer')
  return id
}

function mutationBody(params: AiAgentMutationParams): AiAgentMutationBody {
  return {
    name: params.name,
    model_id: params.model_id,
    avatar: params.avatar ?? null,
    system_prompt: params.system_prompt ?? null,
    mode: params.mode,
    scene: params.scene ?? null,
    capabilities: params.capabilities,
    scene_codes: params.scene_codes,
    runtime_config: params.runtime_config ?? null,
    policy: params.policy ?? null,
    status: params.status,
    tool_ids: params.tool_ids,
    knowledge_base_ids: params.knowledge_base_ids,
  }
}

function deleteAgent(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-agents/${id}`)
}

export const AiAgentApi = {
  init: () => request.get<AiAgentInitResponse>(`${ADMIN_API_PREFIX}/ai-agents/page-init`),
  add: (params: AiAgentMutationParams) => request.post<{ id: number }, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents`, mutationBody(params)),
  edit: (params: AiAgentMutationParams) => {
    const id = positiveID(params.id ?? 0)
    return request.put<void, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents/${id}`, mutationBody(params))
  },
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteAgent(positiveID(item))))
  },
  list: (params: AiAgentListParams) => request.get<PaginatedResponse<AiAgentItem>>(`${ADMIN_API_PREFIX}/ai-agents`, { params: normalizeListParams(params) }),
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id)}/status`, { status: params.status }),
}
