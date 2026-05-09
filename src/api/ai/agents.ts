import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiProviderDriver, AiProviderModelItem } from './providers'

export type JsonObject = Record<string, unknown>
export type AiAgentType = 'chat' | 'workflow' | 'agent'
export type AiResponseMode = 'streaming' | 'blocking'
export type AiAgentScene = 'chat'

export interface AiAgentProviderModelOption extends DictOption<string> {
  provider_id: number
  model_id: string
  display_name: string
}

export interface AiAgentInitResponse {
  dict: {
    agent_type_arr: DictOption<AiAgentType>[]
    response_mode_arr: DictOption<AiResponseMode>[]
    scene_arr: DictOption<AiAgentScene>[]
    common_status_arr: DictOption<number>[]
    provider_options: Array<DictOption<number> & { engine_type: AiProviderDriver }>
    provider_model_options: AiAgentProviderModelOption[]
  }
}

export interface AiAgentListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  agent_type?: AiAgentType | ''
  provider_id?: number | ''
  status?: number | ''
}

export interface AiAgentItem {
  id: number
  provider_id: number
  provider_name: string
  engine_type: AiProviderDriver | string
  name: string
  code: string
  avatar?: string | null
  description?: string | null
  model_id: string
  model_display_name: string
  scenes: AiAgentScene[]
  scene_names?: string[]
  system_prompt?: string
  agent_type: AiAgentType
  agent_type_name?: string
  external_agent_id: string
  external_agent_api_key_masked?: string | null
  default_response_mode: AiResponseMode
  default_response_mode_name?: string
  runtime_config?: JsonObject | null
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiAgentOption {
  id: number
  name: string
  avatar?: string | null
  description?: string | null
  provider_id: number
  engine_type: string
  code?: string
  label?: string
  value?: number
}

interface RemoteAiAgentOption {
  id?: number
  name?: string
  avatar?: string | null
  description?: string | null
  provider_id?: number
  engine_type?: string
  code?: string
  label?: string
  value?: number
}

export interface AiAgentOptionsResponse {
  list: AiAgentOption[]
}

export interface AiAgentMutationParams {
  id?: Id
  name: string
  code?: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  external_agent_id?: string
  agent_type?: 'chat' | 'workflow' | 'agent'
  external_agent_api_key?: string
  default_response_mode?: AiResponseMode
  runtime_config?: JsonObject | null
  status?: number
}

export interface AiAgentMutationBody {
  name: string
  code: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  external_agent_id: string
  agent_type: NonNullable<AiAgentMutationParams['agent_type']>
  external_agent_api_key?: string
  default_response_mode: AiResponseMode
  runtime_config?: JsonObject | null
  status: number
}

export interface AiAgentCreateResponse {
  id: number
}

interface AiAgentListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  agent_type?: AiAgentType
  provider_id?: number
  status?: number
}

export function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiAgentListParams): AiAgentListQueryParams {
  const query: AiAgentListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (typeof params.code === 'string' && params.code.trim()) query.code = params.code.trim()
  if (params.agent_type) query.agent_type = params.agent_type
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiAgentMutationParams): AiAgentMutationBody {
  return {
    name: params.name,
    code: params.code ?? params.name,
    provider_id: params.provider_id,
    model_id: params.model_id,
    scenes: params.scenes.length > 0 ? params.scenes : ['chat'],
    system_prompt: params.system_prompt?.trim(),
    avatar: params.avatar?.trim(),
    external_agent_id: params.external_agent_id ?? '',
    agent_type: params.agent_type ?? 'chat',
    external_agent_api_key: params.external_agent_api_key,
    default_response_mode: params.default_response_mode ?? 'streaming',
    runtime_config: params.runtime_config ?? null,
    status: params.status ?? 1,
  }
}

function normalizeOption(item: RemoteAiAgentOption): AiAgentOption {
  return {
    id: item.id ?? item.value ?? 0,
    name: item.name ?? item.label ?? '',
    avatar: item.avatar ?? null,
    description: item.description ?? null,
    provider_id: item.provider_id ?? 0,
    engine_type: item.engine_type ?? '',
    code: item.code,
    label: item.label,
    value: item.value,
  }
}

async function listOptions(): Promise<AiAgentOptionsResponse> {
  const response = await request.get<AiAgentOptionsResponse>(`${ADMIN_API_PREFIX}/ai-agents/options`)
  return { list: response.list.map(normalizeOption).filter((item) => item.id > 0 && item.name !== '') }
}

function deleteAgent(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-agents/${id}`)
}

export const AiAgentApi = {
  init: () => request.get<AiAgentInitResponse>(`${ADMIN_API_PREFIX}/ai-agents/page-init`),
  list: (params: AiAgentListParams) => request.get<PaginatedResponse<AiAgentItem>>(`${ADMIN_API_PREFIX}/ai-agents`, { params: normalizeListParams(params) }),
  options: () => listOptions(),
  models: (params: { provider_id: Id }) => request.get<{ list: AiProviderModelItem[] }>(`${ADMIN_API_PREFIX}/ai-agents/provider-models/${positiveID(params.provider_id, 'AI provider id')}`),
  detail: (params: { id: Id }) => request.get<AiAgentItem>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id, 'AI agent id')}`),
  add: (params: AiAgentMutationParams) => request.post<AiAgentCreateResponse, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents`, mutationBody(params)),
  edit: (params: AiAgentMutationParams) => {
    const id = positiveID(params.id ?? 0, 'AI agent id')
    return request.put<void, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents/${id}`, mutationBody(params))
  },
  status: (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id, 'AI agent id')}/status`, { status: params.status }),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteAgent(positiveID(item, 'AI agent id'))))
  },
}
