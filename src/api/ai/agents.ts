import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id, RequestPayload } from '@/types/common'
import type { AiProviderDriver, AiProviderModelItem } from './providers'

export type AiAgentScene = 'chat' | 'agent_generate' | 'text_generate' | 'image_generate' | 'video_generate' | 'audio_generate'
export type AiAgentStatus = 1 | 2

export interface AiAgentProviderModelOption extends DictOption<string> {
  provider_id: number
  model_id: string
  display_name: string
}

export interface AiAgentInitResponse {
  dict: {
    scene_arr: DictOption<AiAgentScene>[]
    common_status_arr: DictOption<AiAgentStatus>[]
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
  status?: AiAgentStatus | ''
}

type AiAgentContractItem = components['schemas']['Go_internal_module_ai_agent_AgentDTO_Output']
export interface AiAgentItem extends Omit<AiAgentContractItem, 'engine_type' | 'scenes' | 'status'> {
  engine_type: AiProviderDriver
  scenes: AiAgentScene[]
  status: AiAgentStatus
}
export interface AiAgentListResponse extends Omit<components['schemas']['Go_internal_module_ai_agent_ListResponse_Output'], 'list'> {
  list: AiAgentItem[]
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
  status?: AiAgentStatus
}

export interface AiAgentMutationBody {
  name: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  status: AiAgentStatus
}

export interface AiAgentCreateResponse {
  id: number
}

export type AiAgentTestResult = components['schemas']['Go_internal_infra_ai_TestConnectionResult_Output']

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
  status: AiAgentStatus
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
  status: AiAgentStatus
}

export interface AiAgentUpdateKnowledgeBasesBody {
  bindings: AiAgentKnowledgeBindingBodyItem[]
}

type AiAgentListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_agents'>['query']>

export function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function requiredPositiveID(value: Id | undefined, label: string): number {
  if (value === undefined) throw new Error(`${label} is required`)
  return positiveID(value, label)
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
  if (params.status !== 1 && params.status !== 2) {
    throw new Error('AI agent status must be provided as 1 or 2')
  }
  return {
    name: params.name,
    provider_id: params.provider_id,
    model_id: params.model_id,
    scenes: params.scenes,
    system_prompt: params.system_prompt,
    avatar: params.avatar,
    status: params.status,
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

async function listOptions(options: ExecuteOptions = {}): Promise<AiAgentOptionsResponse> {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_options, {}, options)
  const list = response.list.map(normalizeOption)
  if (list.some((item) => item.id <= 0 || item.name === '')) {
    throw new Error('AI agent options response violates the contract')
  }
  return { list }
}

function isAgentScene(value: string): value is AiAgentScene {
  return value === 'chat'
    || value === 'agent_generate'
    || value === 'text_generate'
    || value === 'image_generate'
    || value === 'video_generate'
    || value === 'audio_generate'
}

function isAgentStatus(value: number): value is AiAgentStatus {
  return value === 1 || value === 2
}

function toAgentItem(item: AiAgentContractItem): AiAgentItem {
  if (
    item.engine_type !== 'openai'
    || !item.scenes.every(isAgentScene)
    || !isAgentStatus(item.status)
  ) {
    throw new Error('AI agent item violates the editable contract')
  }
  return {
    ...item,
    engine_type: item.engine_type,
    scenes: item.scenes,
    status: item.status,
  }
}

function toAgentInit(response: components['schemas']['Go_internal_module_ai_agent_InitResponse_Output']): AiAgentInitResponse {
  const scenes = response.dict.scene_arr.map((option) => {
    if (!isAgentScene(option.value)) throw new Error('AI agent scene dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const statuses = response.dict.common_status_arr.map((option) => {
    if (!isAgentStatus(option.value)) throw new Error('AI agent status dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const providers = response.dict.provider_options.map((option) => {
    if (option.engine_type !== 'openai') throw new Error('AI agent provider dictionary violates the contract')
    return { ...option, engine_type: 'openai' as const }
  })
  return {
    dict: {
      scene_arr: scenes,
      common_status_arr: statuses,
      provider_options: providers,
      provider_model_options: response.dict.provider_model_options,
    },
  }
}

function toKnowledgeBindings(
  response: components['schemas']['Go_internal_module_ai_knowledge_AgentKnowledgeBindingsResponse_Output'],
): AiAgentKnowledgeBindingResponse {
  const bindings = response.bindings.map((item) => {
    if (!isAgentStatus(item.status)) throw new Error('AI agent knowledge binding status violates the contract')
    return { ...item, status: item.status }
  })
  return { ...response, bindings }
}

async function deleteAgent(id: number, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_agents_id, {
    path: { id },
  }, options)
}

const pageInit = async (options: ExecuteOptions = {}): Promise<AiAgentInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_page_init, {}, options)
  return toAgentInit(response)
}
const create = (params: AiAgentMutationParams, options: ExecuteOptions = {}): Promise<AiAgentCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_agents, { body: mutationBody(params) }, options)
const update = async (params: AiAgentMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  const id = requiredPositiveID(params.id, 'AI agent id')
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_agents_id, {
    path: { id },
    body: mutationBody(params),
  }, options)
}
const changeStatus = async (params: { id: Id; status: 1 | 2 }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_agents_id_status, {
    path: { id: positiveID(params.id, 'AI agent id') },
    body: { status: params.status },
  }, options)
}
const deleteOne = (params: { id: Id }, options: ExecuteOptions = {}) =>
  deleteAgent(positiveID(params.id, 'AI agent id'), options)
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  if (params.ids.length === 0) throw new Error('AI agent ids must not be empty')
  await Promise.all(params.ids.map((item) => deleteOne({ id: item }, options)))
}

export const AiAgentApi = {
  pageInit,
  list: async (params: AiAgentListParams, options: ExecuteOptions = {}): Promise<AiAgentListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toAgentItem), page: response.page }
  },
  options: (options: ExecuteOptions = {}) => listOptions(options),
  models: (params: { provider_id: Id }, options: ExecuteOptions = {}): Promise<{ list: AiProviderModelItem[] }> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_provider_models_id, {
      path: { id: positiveID(params.provider_id, 'AI provider id') },
    }, options),
  detail: async (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiAgentItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_id, {
      path: { id: positiveID(params.id, 'AI agent id') },
    }, options)
    return toAgentItem(response)
  },
  tools: (params: { agent_id: Id }, options: ExecuteOptions = {}): Promise<AiAgentToolBindingResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_id_tools, {
      path: { id: positiveID(params.agent_id, 'AI agent id') },
    }, options),
  async updateTools(params: AiAgentUpdateToolsParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_ai_agents_id_tools, {
      path: { id: positiveID(params.agent_id, 'AI agent id') },
      body: updateToolsBody(params),
    }, options)
  },
  knowledgeBases: async (params: { agent_id: Id }, options: ExecuteOptions = {}): Promise<AiAgentKnowledgeBindingResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_id_knowledge_bases, {
      path: { id: positiveID(params.agent_id, 'AI agent id') },
    }, options)
    return toKnowledgeBindings(response)
  },
  async updateKnowledgeBases(params: AiAgentUpdateKnowledgeBasesParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_ai_agents_id_knowledge_bases, {
      path: { id: positiveID(params.agent_id, 'AI agent id') },
      body: updateKnowledgeBasesBody(params),
    }, options)
  },
  create,
  update,
  changeStatus,
  test: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiAgentTestResult> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_ai_agents_id_test, {
      path: { id: positiveID(params.id, 'AI agent id') },
    }, options),
  deleteOne,
  deleteBatch,
}
