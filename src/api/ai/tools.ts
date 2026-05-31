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
  parameters_json: JsonObject
  result_schema_json: JsonObject
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: number
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

export interface AiToolGenerateDraftBody {
  agent_id: number
  requirement: string
  code_hint: string
}

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
  usage?: AiToolGenerateUsage
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
    parameters_json: params.parameters_json,
    result_schema_json: params.result_schema_json,
    risk_level: params.risk_level,
    timeout_ms: params.timeout_ms,
    status: params.status,
  }
}

function generateDraftBody(params: AiToolGenerateDraftParams): AiToolGenerateDraftBody {
  return {
    agent_id: positiveID(params.agent_id, 'AI generate agent id'),
    requirement: params.requirement,
    code_hint: params.code_hint ?? '',
  }
}

function deleteTool(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-tools/${id}`)
}

const pageInit = () => request.get<AiToolInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/page-init`)
const generatePageInit = () => request.get<AiToolGenerateInitResponse>(`${ADMIN_API_PREFIX}/ai-tools/generate/page-init`)
const create = (params: AiToolMutationParams) => request.post<AiToolCreateResponse, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools`, mutationBody(params))
const update = (params: AiToolMutationParams) => {
  const id = positiveID(params.id ?? 0, 'AI tool id')
  return request.put<void, AiToolMutationBody>(`${ADMIN_API_PREFIX}/ai-tools/${id}`, mutationBody(params))
}
const changeStatus = (params: { id: Id; status: number }) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-tools/${positiveID(params.id, 'AI tool id')}/status`, { status: params.status })
const deleteOne = (params: { id: Id }) => deleteTool(positiveID(params.id, 'AI tool id'))
const deleteBatch = async (params: { ids: Id[] }) => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}

export const AiToolApi = {
  pageInit,
  generatePageInit,
  generateDraft: (params: AiToolGenerateDraftParams) => request.post<AiToolGenerateDraftResponse, AiToolGenerateDraftBody>(`${ADMIN_API_PREFIX}/ai-tools/generate-draft`, generateDraftBody(params)),
  list: (params: AiToolListParams) => request.get<PaginatedResponse<AiToolItem>>(`${ADMIN_API_PREFIX}/ai-tools`, { params: normalizeListParams(params) }),
  create,
  update,
  changeStatus,
  deleteOne,
  deleteBatch,
  generateInit: generatePageInit,
}
