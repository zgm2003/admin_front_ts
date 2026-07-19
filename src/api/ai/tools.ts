import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
  type AdminOperationOutput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id, RequestPayload } from '@/types/common'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject { [key: string]: JsonValue }

export type AiToolRiskLevel = 'low' | 'medium' | 'high'
export type AiToolStatus = 1 | 2

export interface AiToolInitResponse {
  dict: {
    risk_level_arr: DictOption<AiToolRiskLevel>[]
    common_status_arr: DictOption<AiToolStatus>[]
  }
}

export interface AiToolListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  code?: string
  risk_level?: AiToolRiskLevel | ''
  status?: AiToolStatus | ''
}

export interface AiToolItem {
  id: number
  name: string
  code: string
  description: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  risk_level_name: string
  timeout_ms: number
  status: AiToolStatus
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiToolMutationParams {
  id?: Id
  name: string
  code: string
  description: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: AiToolStatus
}

export interface AiToolMutationBody {
  name: string
  code: string
  description: string
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: AiToolStatus
}

export type AiToolGeneratedDraft = Omit<AiToolMutationParams, 'id'>

export interface AiToolGenerateAgentOption {
  label: string
  value: number
}

export interface AiToolGenerateInitResponse {
  agent_options: AiToolGenerateAgentOption[]
}

export interface AiToolGenerateDraftParams extends RequestPayload {
  agent_id: Id
  requirement: string
  code_hint?: string
}

export type AiToolGenerateDraftBody = NonNullable<AdminOperationInput<'post_api_admin_v1_ai_tools_generate_draft'>['body']>

export interface AiToolGenerateUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface AiToolGenerateDraftResponse {
  ok: boolean
  draft: AiToolGeneratedDraft | null
  warnings: string[]
  clarifying_questions: string[]
  usage?: AiToolGenerateUsage | null
}

export interface AiToolCreateResponse {
  id: number
}

type AiToolListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_tools'>['query']>

function positiveID(value: Id | number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function requiredPositiveID(value: Id | undefined, label: string): number {
  if (value === undefined) throw new Error(`${label} is required`)
  return positiveID(value, label)
}

function isRiskLevel(value: string): value is AiToolRiskLevel {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isToolStatus(value: number): value is AiToolStatus {
  return value === 1 || value === 2
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (typeof value !== 'object') return false
  return Object.values(value).every(isJsonValue)
}

function toJsonObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !isJsonValue(value)) {
    throw new Error(`${label} must be a JSON object`)
  }
  const output: JsonObject = {}
  for (const [key, item] of Object.entries(value)) output[key] = item
  return output
}

function toToolItem(item: AiToolContractItem): AiToolItem {
  if (!isRiskLevel(item.risk_level) || !isToolStatus(item.status)) {
    throw new Error('AI tool item violates the editable contract')
  }
  return {
    ...item,
    parameters_json: toJsonObject(item.parameters_json, 'AI tool parameters_json'),
    result_schema_json: toJsonObject(item.result_schema_json, 'AI tool result_schema_json'),
    risk_level: item.risk_level,
    status: item.status,
  }
}

function toToolInit(response: components['schemas']['Go_internal_module_ai_tool_InitResponse_Output']): AiToolInitResponse {
  const risks = response.dict.risk_level_arr.map((option) => {
    if (!isRiskLevel(option.value)) throw new Error('AI tool risk dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const statuses = response.dict.common_status_arr.map((option) => {
    if (!isToolStatus(option.value)) throw new Error('AI tool status dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  return { dict: { risk_level_arr: risks, common_status_arr: statuses } }
}

function toGenerateDraft(
  response: AdminOperationOutput<'post_api_admin_v1_ai_tools_generate_draft'>,
): AiToolGenerateDraftResponse {
  if (response.draft === null) {
    return {
      ok: response.ok,
      draft: null,
      warnings: response.warnings,
      clarifying_questions: response.clarifying_questions,
      usage: response.usage,
    }
  }
  const draft = response.draft
  if (!isRiskLevel(draft.risk_level) || !isToolStatus(draft.status)) {
    throw new Error('AI generated tool draft violates the editable contract')
  }
  return {
    ...response,
    draft: {
      ...draft,
      parameters_json: toJsonObject(draft.parameters_json, 'AI tool draft parameters_json'),
      result_schema_json: toJsonObject(draft.result_schema_json, 'AI tool draft result_schema_json'),
      risk_level: draft.risk_level,
      status: draft.status,
    },
  }
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
    parameters_json: params.parameters_json,
    result_schema_json: params.result_schema_json,
    risk_level: params.risk_level,
    timeout_ms: params.timeout_ms,
    status: params.status,
  }
}

function generateDraftBody(params: AiToolGenerateDraftParams): AiToolGenerateDraftBody {
  const body: AiToolGenerateDraftBody = {
    agent_id: positiveID(params.agent_id, 'AI generate agent id'),
    requirement: params.requirement,
  }
  if (params.code_hint !== undefined) body.code_hint = params.code_hint
  return body
}
type AiToolContractItem = components['schemas']['Go_internal_module_ai_tool_ToolDTO_Output']
export interface AiToolListResponse extends Omit<components['schemas']['Go_internal_module_ai_tool_ListResponse_Output'], 'list'> {
  list: AiToolItem[]
}

async function deleteTool(id: number, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_ai_tools_id, {
    path: { id },
  }, options)
}

const pageInit = async (options: ExecuteOptions = {}): Promise<AiToolInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_tools_page_init, {}, options)
  return toToolInit(response)
}
const generatePageInit = (options: ExecuteOptions = {}): Promise<AiToolGenerateInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_ai_tools_generate_page_init, {}, options)
const create = (params: AiToolMutationParams, options: ExecuteOptions = {}): Promise<AiToolCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_ai_tools, { body: mutationBody(params) }, options)
const update = async (params: AiToolMutationParams, options: ExecuteOptions = {}): Promise<void> => {
  const id = requiredPositiveID(params.id, 'AI tool id')
  await executeAdminOperation(adminOperations.put_api_admin_v1_ai_tools_id, {
    path: { id },
    body: mutationBody(params),
  }, options)
}
const changeStatus = async (params: { id: Id; status: 1 | 2 }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_ai_tools_id_status, {
    path: { id: positiveID(params.id, 'AI tool id') },
    body: { status: params.status },
  }, options)
}
const deleteOne = (params: { id: Id }, options: ExecuteOptions = {}) =>
  deleteTool(positiveID(params.id, 'AI tool id'), options)
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}) => {
  if (params.ids.length === 0) throw new Error('AI tool ids must not be empty')
  await Promise.all(params.ids.map((item) => deleteOne({ id: item }, options)))
}

export const AiToolApi = {
  pageInit,
  generatePageInit,
  generateDraft: async (params: AiToolGenerateDraftParams, options: ExecuteOptions = {}): Promise<AiToolGenerateDraftResponse> => {
    const response = await executeAdminOperation(adminOperations.post_api_admin_v1_ai_tools_generate_draft, {
      body: generateDraftBody(params),
    }, options)
    return toGenerateDraft(response)
  },
  list: async (params: AiToolListParams, options: ExecuteOptions = {}): Promise<AiToolListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_ai_tools, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toToolItem), page: response.page }
  },
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
  generateInit: generatePageInit,
}
