import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiProviderDriver, AiProviderModelItem } from './providers'

export type AiAgentScene = 'chat' | 'agent_generate' | 'image_generate'

export interface AiAgentProviderModelOption extends DictOption<string> {
  provider_id: number
  model_id: string
  display_name: string
}

export interface AiAgentInitResponse {
  dict: {
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
  scene?: AiAgentScene | ''
  provider_id?: number | ''
  status?: number | ''
}

export interface AiAgentItem {
  id: number
  provider_id: number
  provider_name: string
  engine_type: AiProviderDriver | string
  name: string
  avatar?: string | null
  model_id: string
  model_display_name: string
  scenes: AiAgentScene[]
  scene_names?: string[]
  system_prompt?: string
  status: number
  status_name?: string
  created_at: string
  updated_at: string
}

export interface AiAgentOption {
  id: number
  name: string
  avatar?: string | null
  description?: string
}

interface RemoteAiAgentOption {
  id: number
  name: string
  avatar?: string | null
  system_prompt?: string
}

export interface AiAgentOptionsResponse {
  list: AiAgentOption[]
}

export interface AiAgentMutationParams {
  id?: Id
  name: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  status?: number
}

export interface AiAgentMutationBody {
  name: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  status: number
}

export interface AiAgentCreateResponse {
  id: number
}

export interface AiAgentToolBindingResponse {
  agent_id: number
  tool_ids: number[]
  active_tool_ids: number[]
}

export interface AiAgentKnowledgeBaseOption {
  label: string
  value: number
  description: string
  default_top_k: number
  default_min_score: number
  default_max_context_chars: number
}

export interface AiAgentKnowledgeBindingItem {
  id?: number
  knowledge_base_id: number
  knowledge_base_name: string
  top_k: number
  min_score: number
  max_context_chars: number
  status: number
  status_name?: string
}

export interface AiAgentKnowledgeBindingResponse {
  agent_id: number
  bindings: AiAgentKnowledgeBindingItem[]
  base_options: AiAgentKnowledgeBaseOption[]
}

export interface AiAgentUpdateToolsParams {
  agent_id: Id
  tool_ids: Id[]
}

export interface AiAgentUpdateToolsBody {
  tool_ids: number[]
}

export interface AiAgentUpdateKnowledgeBasesParams {
  agent_id: Id
  bindings: AiAgentKnowledgeBindingItem[]
}

export interface AiAgentKnowledgeBindingBodyItem {
  knowledge_base_id: number
  top_k: number
  min_score: number
  max_context_chars: number
  status: number
}

export interface AiAgentUpdateKnowledgeBasesBody {
  bindings: AiAgentKnowledgeBindingBodyItem[]
}

interface AiAgentListQueryParams {
  current_page?: number
  page_size?: number
  name?: string
  scene?: AiAgentScene
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
  if (params.scene) query.scene = params.scene
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiAgentMutationParams): AiAgentMutationBody {
  return {
    name: params.name,
    provider_id: params.provider_id,
    model_id: params.model_id,
    scenes: params.scenes.length > 0 ? params.scenes : ['chat'],
    system_prompt: params.system_prompt?.trim(),
    avatar: params.avatar?.trim(),
    status: params.status ?? 1,
  }
}

function normalizeToolIDs(values: Id[]): number[] {
  const ids = new Set<number>()
  for (const value of values) {
    ids.add(positiveID(value, 'AI tool id'))
  }
  return Array.from(ids).sort((left, right) => left - right)
}

function updateToolsBody(params: AiAgentUpdateToolsParams): AiAgentUpdateToolsBody {
  return { tool_ids: normalizeToolIDs(params.tool_ids) }
}

function updateKnowledgeBasesBody(params: AiAgentUpdateKnowledgeBasesParams): AiAgentUpdateKnowledgeBasesBody {
  return {
    bindings: params.bindings.map((item) => ({
      knowledge_base_id: positiveID(item.knowledge_base_id, 'AI knowledge base id'),
      top_k: item.top_k,
      min_score: item.min_score,
      max_context_chars: item.max_context_chars,
      status: item.status,
    })),
  }
}

function normalizeOption(item: RemoteAiAgentOption): AiAgentOption {
  return {
    id: item.id,
    name: item.name,
    avatar: item.avatar,
    description: item.system_prompt,
  }
}

async function listOptions(): Promise<AiAgentOptionsResponse> {
  const response = await request.get<AiAgentOptionsResponse>(`${ADMIN_API_PREFIX}/ai-agents/options`)
  return { list: response.list.map(normalizeOption).filter((item) => item.id > 0 && item.name !== '') }
}

function deleteAgent(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-agents/${id}`)
}

const pageInit = () => request.get<AiAgentInitResponse>(`${ADMIN_API_PREFIX}/ai-agents/page-init`)
const create = (params: AiAgentMutationParams) => request.post<AiAgentCreateResponse, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents`, mutationBody(params))
const update = (params: AiAgentMutationParams) => {
  const id = positiveID(params.id ?? 0, 'AI agent id')
  return request.put<void, AiAgentMutationBody>(`${ADMIN_API_PREFIX}/ai-agents/${id}`, mutationBody(params))
}
const changeStatus = (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id, 'AI agent id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => deleteAgent(positiveID(params.id, 'AI agent id'))
const deleteBatch = async (params: { ids: Id[] }): Promise<void> => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}

export const AiAgentApi = {
  pageInit,
  list: (params: AiAgentListParams) => request.get<PaginatedResponse<AiAgentItem>>(`${ADMIN_API_PREFIX}/ai-agents`, { params: normalizeListParams(params) }),
  options: () => listOptions(),
  models: (params: { provider_id: Id }) => request.get<{ list: AiProviderModelItem[] }>(`${ADMIN_API_PREFIX}/ai-agents/provider-models/${positiveID(params.provider_id, 'AI provider id')}`),
  detail: (params: { id: Id }) => request.get<AiAgentItem>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.id, 'AI agent id')}`),
  tools: (params: { agent_id: Id }) => request.get<AiAgentToolBindingResponse>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id, 'AI agent id')}/tools`),
  updateTools: (params: AiAgentUpdateToolsParams) => request.put<void, AiAgentUpdateToolsBody>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id, 'AI agent id')}/tools`, updateToolsBody(params)),
  knowledgeBases: (params: { agent_id: Id }) => request.get<AiAgentKnowledgeBindingResponse>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id, 'AI agent id')}/knowledge-bases`),
  updateKnowledgeBases: (params: AiAgentUpdateKnowledgeBasesParams) => request.put<void, AiAgentUpdateKnowledgeBasesBody>(`${ADMIN_API_PREFIX}/ai-agents/${positiveID(params.agent_id, 'AI agent id')}/knowledge-bases`, updateKnowledgeBasesBody(params)),
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
}
