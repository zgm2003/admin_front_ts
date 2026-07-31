import request, { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import { adminOperations } from '@/modules/http/generated/operations'
import type { DictOption, Id, RequestPayload } from '@/types/common'
import type { AiProviderDriver } from './providers'

export type AiAgentScene = 'chat' | 'agent_generate' | 'text_generate' | 'image_generate'
export type AiAgentStatus = 1 | 2
export type AiOfficialModelLifecycle = 'active' | 'deprecated' | 'retired'

export interface AiAgentCatalogRate {
  category: string
  unit: string
  tier_key: string
  price: string
  unit_scale: number
}

export interface AiAgentOfficialModelSummary {
  model_id: string
  catalog_version: string
  catalog_vendor: string
  model_family: string
  lifecycle_status: AiOfficialModelLifecycle
  context_window_tokens: number
  max_output_tokens: number
}

export interface AiAgentEffectiveCapabilities {
  input_modalities: string[]
  output_modalities: string[]
  supports_tools: boolean
  supports_streaming: boolean
  supports_structured_output: boolean
  runtime_parameters: {
    temperature: { supported: boolean; default: number; min: number; max: number }
    max_history: { supported: boolean; default: number; min: number; max: number; transitional: boolean }
  }
  attachments: {
    max_attachments_per_message: number
    max_message_attachment_bytes: number
    image: { enabled: boolean; mime_types: string[]; max_files: number; max_file_bytes: number }
    native_file: {
      enabled: boolean
      disabled_reason: string
      max_files_per_message: number
      max_file_bytes_exclusive: number
      max_request_file_bytes: number
      accepted_extensions: string[]
    }
  }
}

export interface AiAgentProviderModelOption {
  label: string
  value: string
  provider_id: number
  model_id: string
  display_name: string
  billing_multiplier: string
  official_model?: AiAgentOfficialModelSummary
  capabilities?: AiAgentEffectiveCapabilities
  pricing_version?: string
  catalog_version?: string
  catalog_vendor?: string
  catalog_model_id?: string
  price_source?: string
  override_version: number
  price_source_url?: string
  price_verified_at?: string
  context_tier_threshold_tokens: number
  catalog_rates?: AiAgentCatalogRate[]
}

export interface AiAgentProviderModelItem {
  id: number
  provider_id: number
  model_id: string
  display_name: string
  official_model_id: string
  official_catalog_version: string
  mapping_status: 'mapped' | 'unmapped'
  mapped_at: string
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiAgentInitResponse {
  dict: {
    billing_multiplier_default: string
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

export interface AiAgentItem {
  id: number
  provider_id: number
  provider_name: string
  provider_model_id: number
  engine_type: AiProviderDriver
  name: string
  model_id: string
  model_display_name: string
  scenes: AiAgentScene[]
  scene_names: string[]
  system_prompt: string
  avatar: string
  status: AiAgentStatus
  status_name: string
  created_at: string
  updated_at: string
  billing_multiplier: string
  official_model?: AiAgentOfficialModelSummary
  capabilities?: AiAgentEffectiveCapabilities
  pricing_version?: string
  catalog_version?: string
  catalog_vendor?: string
  catalog_model_id?: string
  price_source?: string
  override_version: number
  price_source_url?: string
  price_verified_at?: string
  context_tier_threshold_tokens: number
  catalog_rates?: AiAgentCatalogRate[]
}

export interface AiAgentListResponse {
  list: AiAgentItem[]
  page: { page_size: number; current_page: number; total_page: number; total: number }
}

export interface AiAgentOption {
  id: number
  name: string
  avatar?: string | null
  description?: string
  provider_model_id: number
  official_model: AiAgentOfficialModelSummary
  capabilities: AiAgentEffectiveCapabilities
}

interface RemoteAiAgentOption extends Omit<AiAgentOption, 'description'> {
  system_prompt?: string
}

export interface AiAgentOptionsResponse { list: AiAgentOption[] }

export interface AiAgentMutationParams {
  id?: Id
  name: string
  provider_id: number
  model_id: string
  scenes: AiAgentScene[]
  system_prompt?: string
  avatar?: string
  status?: AiAgentStatus
  billing_multiplier?: string
}

export type AiAgentMutationBody = Omit<AiAgentMutationParams, 'id'>
export interface AiAgentCreateResponse { id: number }
export type AiAgentTestResult = components['schemas']['Go_internal_infra_ai_TestConnectionResult_Output']
export interface AiAgentToolBindingResponse { agent_id: number; tool_ids: number[]; active_tool_ids: number[] }

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

export interface AiAgentUpdateToolsParams { agent_id: Id; tool_ids: Id[] }
export interface AiAgentUpdateToolsBody { tool_ids: number[] }
export interface AiAgentUpdateKnowledgeBasesParams { agent_id: Id; bindings: AiAgentKnowledgeBindingItem[] }
export interface AiAgentKnowledgeBindingBodyItem {
  knowledge_base_id: number
  top_k: number
  min_score: number
  max_context_chars: number
  status: AiAgentStatus
}
export interface AiAgentUpdateKnowledgeBasesBody { bindings: AiAgentKnowledgeBindingBodyItem[] }

export function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer`)
  return value
}

function requiredPositiveID(value: Id | undefined, label: string): number {
  if (value === undefined) throw new Error(`${label} is required`)
  return positiveID(value, label)
}

function optionsFrom(options: ExecuteOptions) {
  return { signal: options.signal, idempotencyKey: options.idempotencyKey }
}

function normalizeListParams(params: AiAgentListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.name === 'string' && params.name.trim()) query.name = params.name.trim()
  if (params.scene) query.scene = params.scene
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiAgentMutationParams): AiAgentMutationBody {
  if (params.status !== 1 && params.status !== 2) throw new Error('AI agent status must be provided as 1 or 2')
  return {
    name: params.name,
    provider_id: params.provider_id,
    model_id: params.model_id,
    scenes: params.scenes,
    system_prompt: params.system_prompt,
    avatar: params.avatar,
    status: params.status,
    billing_multiplier: params.billing_multiplier,
  }
}

function normalizeToolIDs(values: Id[]): number[] {
  return Array.from(new Set(values.map((value) => positiveID(value, 'AI tool id')))).sort((left, right) => left - right)
}

function updateKnowledgeBasesBody(params: AiAgentUpdateKnowledgeBasesParams): AiAgentUpdateKnowledgeBasesBody {
  return { bindings: params.bindings.map((item) => ({
    knowledge_base_id: positiveID(item.knowledge_base_id, 'AI knowledge base id'),
    top_k: item.top_k, min_score: item.min_score, max_context_chars: item.max_context_chars, status: item.status,
  })) }
}

function isAgentScene(value: string): value is AiAgentScene {
  return value === 'chat' || value === 'agent_generate' || value === 'text_generate' || value === 'image_generate'
}

function isAgentStatus(value: number): value is AiAgentStatus { return value === 1 || value === 2 }

function toAgentItem(item: AiAgentItem): AiAgentItem {
  if (item.engine_type !== 'openai' || !item.scenes.every(isAgentScene) || !isAgentStatus(item.status)) {
    throw new Error('AI agent item violates the editable contract')
  }
  return item
}

function toAgentInit(response: AiAgentInitResponse): AiAgentInitResponse {
  if (response.dict.scene_arr.some((option) => !isAgentScene(option.value))) {
    throw new Error('AI agent scene dictionary violates the contract')
  }
  if (response.dict.common_status_arr.some((option) => !isAgentStatus(option.value))) {
    throw new Error('AI agent status dictionary violates the contract')
  }
  if (response.dict.provider_options.some((option) => option.engine_type !== 'openai')) {
    throw new Error('AI agent provider dictionary violates the contract')
  }
  return response
}

function normalizeOption(item: RemoteAiAgentOption): AiAgentOption {
  return { ...item, description: item.system_prompt }
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

const pageInit = async (options: ExecuteOptions = {}): Promise<AiAgentInitResponse> =>
  toAgentInit(await request.get('/api/admin/v1/ai-agents/page-init', optionsFrom(options)))

const create = (params: AiAgentMutationParams, options: ExecuteOptions = {}): Promise<AiAgentCreateResponse> =>
  request.post('/api/admin/v1/ai-agents', mutationBody(params), optionsFrom(options))

const update = async (params: AiAgentMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  await request.put(`/api/admin/v1/ai-agents/${requiredPositiveID(params.id, 'AI agent id')}`, mutationBody(params), optionsFrom(options))
}

const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await request.delete(`/api/admin/v1/ai-agents/${positiveID(params.id, 'AI agent id')}`, optionsFrom(options))
}

export const AiAgentApi = {
  pageInit,
  list: async (params: AiAgentListParams, options: ExecuteOptions = {}): Promise<AiAgentListResponse> => {
    const response = await request.get<AiAgentListResponse>('/api/admin/v1/ai-agents', { ...optionsFrom(options), params: normalizeListParams(params) })
    return { ...response, list: response.list.map(toAgentItem) }
  },
  options: async (options: ExecuteOptions = {}): Promise<AiAgentOptionsResponse> => {
    const response = await request.get<{ list: RemoteAiAgentOption[] }>('/api/admin/v1/ai-agents/options', optionsFrom(options))
    const list = response.list.map(normalizeOption)
    if (list.some((item) => item.id <= 0 || !item.name || !item.official_model || !item.capabilities)) {
      throw new Error('AI agent options response violates the contract')
    }
    return { list }
  },
  models: (params: { provider_id: Id }, options: ExecuteOptions = {}): Promise<{ list: AiAgentProviderModelItem[] }> =>
    request.get(`/api/admin/v1/ai-agents/provider-models/${positiveID(params.provider_id, 'AI provider id')}`, optionsFrom(options)),
  detail: async (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiAgentItem> =>
    toAgentItem(await request.get(`/api/admin/v1/ai-agents/${positiveID(params.id, 'AI agent id')}`, optionsFrom(options))),
  tools: (params: { agent_id: Id }, options: ExecuteOptions = {}): Promise<AiAgentToolBindingResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_agents_id_tools, { path: { id: positiveID(params.agent_id, 'AI agent id') } }, options),
  async updateTools(params: AiAgentUpdateToolsParams, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_ai_agents_id_tools, {
      path: { id: positiveID(params.agent_id, 'AI agent id') }, body: { tool_ids: normalizeToolIDs(params.tool_ids) },
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
      path: { id: positiveID(params.agent_id, 'AI agent id') }, body: updateKnowledgeBasesBody(params),
    }, options)
  },
  create,
  update,
  changeStatus: async (params: { id: Id; status: AiAgentStatus }, options: ExecuteOptions = {}): Promise<void> => {
    await request.patch(`/api/admin/v1/ai-agents/${positiveID(params.id, 'AI agent id')}/status`, { status: params.status }, optionsFrom(options))
  },
  test: (params: { id: Id }, options: ExecuteOptions = {}): Promise<AiAgentTestResult> =>
    request.post(`/api/admin/v1/ai-agents/${positiveID(params.id, 'AI agent id')}/test`, undefined, optionsFrom(options)),
  deleteOne,
  deleteBatch: async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
    if (params.ids.length === 0) throw new Error('AI agent ids must not be empty')
    await Promise.all(params.ids.map((id) => deleteOne({ id }, options)))
  },
}
