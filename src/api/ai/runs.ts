import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject { [key: string]: JsonValue }

export interface AiRunMessageAttachment {
  url: string
}

export interface AiRunMessageMeta {
  attachments?: AiRunMessageAttachment[]
  run_request_id?: string
  provider_request_id?: string
  [key: string]: unknown
}

export type AiRunStatus = 'running' | 'success' | 'failed' | 'canceled' | 'timeout'
export type AiRunToolCallStatus = 'running' | 'success' | 'failed' | 'timeout'

export interface AiRunInitResponse {
  dict: {
    status_arr: DictOption<AiRunStatus>[]
    agentArr: DictOption<number>[]
    providerArr: DictOption<number>[]
  }
}

export interface AiRunListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  status?: AiRunStatus | ''
  user_id?: number | ''
  request_id?: string
  agent_id?: number | ''
  provider_id?: number | ''
  date_start?: string
  date_end?: string
}

export interface AiRunItem {
  id: number
  request_id: string
  user_id: number
  agent_id: number
  agent_name: string
  provider_id: number
  provider_name: string
  conversation_id: number
  conversation_title: string
  status: AiRunStatus
  status_name: string
  model_id: string
  model_display_name: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  duration_ms?: number | null
  duration_text: string
  error_message: string
  created_at: string
}

export interface AiRunMessageSummary {
  id: number
  content: string
  meta_json?: AiRunMessageMeta
  created_at: string
}

export interface AiRunToolCallItem {
  id: number
  tool_id: number
  tool_code: string
  tool_name: string
  call_id?: string | null
  status: AiRunToolCallStatus
  arguments_json: JsonObject
  result_json?: JsonObject | null
  error_message: string
  duration_ms?: number | null
  started_at: string
  finished_at: string
}

export interface AiRunDetailResponse {
  id: number
  request_id: string
  user_id: number
  username: string
  agent_id: number
  agent_name: string
  provider_id: number
  provider_name: string
  conversation_id: number
  conversation_title: string
  status: AiRunStatus
  status_name: string
  model_id: string
  model_display_name: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  duration_ms?: number | null
  duration_text: string
  error_message: string
  user_message?: AiRunMessageSummary | null
  assistant_message?: AiRunMessageSummary | null
  events: AiRunEventItem[]
  tool_calls: AiRunToolCallItem[]
  started_at: string
  finished_at: string
  created_at: string
  updated_at: string
}

export interface AiRunEventItem {
  id: number
  seq: number
  event_type: string
  event_type_name: string
  message: string
  elapsed_ms?: number | null
  elapsed_text: string
  created_at: string
}

export interface AiRunStatsSummaryResponse {
  date_range: {
    start: string | null
    end: string | null
  }
  summary: {
    total_runs: number
    success_rate: number
    fail_runs: number
    total_tokens: number
    total_prompt_tokens: number
    total_completion_tokens: number
    avg_duration_ms: number
  }
}

export interface AiRunStatsMetricItem {
  total_runs: number
  total_tokens: number
  total_prompt_tokens: number
  total_completion_tokens: number
  avg_duration_ms: number
}

export interface AiRunStatsByDateItem extends AiRunStatsMetricItem {
  date: string
}

export interface AiRunStatsByAgentItem extends AiRunStatsMetricItem {
  agent_id: number
  agent_name: string
}

export interface AiRunStatsByUserItem extends AiRunStatsMetricItem {
  username: string
}

export interface AiRunStatsListParams extends RequestPayload {
  current_page: number
  page_size: number
  date_start?: string
  date_end?: string
  agent_id?: number | ''
  provider_id?: number | ''
  user_id?: number | ''
}

interface AiRunListQueryParams {
  current_page?: number
  page_size?: number
  status?: AiRunStatus
  user_id?: number
  request_id?: string
  agent_id?: number
  provider_id?: number
  date_start?: string
  date_end?: string
}

interface AiRunStatsQueryParams {
  date_start?: string
  date_end?: string
  agent_id?: number
  provider_id?: number
  user_id?: number
}

interface AiRunStatsListQueryParams extends AiRunStatsQueryParams {
  current_page?: number
  page_size?: number
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('AI run id must be a positive integer')
  return id
}

function normalizeListParams(params: AiRunListParams): AiRunListQueryParams {
  const query: AiRunListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (params.status) query.status = params.status
  if (typeof params.user_id === 'number') query.user_id = params.user_id
  if (params.request_id) query.request_id = params.request_id
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

function normalizeStatsParams(params?: RequestPayload): AiRunStatsQueryParams {
  const query: AiRunStatsQueryParams = {}
  if (!params) return query
  if (typeof params.date_start === 'string' && params.date_start) query.date_start = params.date_start
  if (typeof params.date_end === 'string' && params.date_end) query.date_end = params.date_end
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  if (typeof params.provider_id === 'number') query.provider_id = params.provider_id
  if (typeof params.user_id === 'number') query.user_id = params.user_id
  return query
}

function normalizeStatsListParams(params: AiRunStatsListParams): AiRunStatsListQueryParams {
  return {
    ...normalizeStatsParams(params),
    current_page: params.current_page,
    page_size: params.page_size,
  }
}

export const AiRunApi = {
  init: () => request.get<AiRunInitResponse>(`${ADMIN_API_PREFIX}/ai-runs/page-init`),
  list: (params: AiRunListParams) => request.get<PaginatedResponse<AiRunItem>>(`${ADMIN_API_PREFIX}/ai-runs`, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiRunDetailResponse>(`${ADMIN_API_PREFIX}/ai-runs/${positiveID(params.id)}`),
  stats: (params?: RequestPayload) => request.get<AiRunStatsSummaryResponse>(`${ADMIN_API_PREFIX}/ai-runs/stats`, { params: normalizeStatsParams(params) }),
  statsByDate: (params: AiRunStatsListParams) => request.get<PaginatedResponse<AiRunStatsByDateItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-date`, { params: normalizeStatsListParams(params) }),
  statsByAgent: (params: AiRunStatsListParams) => request.get<PaginatedResponse<AiRunStatsByAgentItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-agent`, { params: normalizeStatsListParams(params) }),
  statsByUser: (params: AiRunStatsListParams) => request.get<PaginatedResponse<AiRunStatsByUserItem>>(`${ADMIN_API_PREFIX}/ai-runs/stats/by-user`, { params: normalizeStatsListParams(params) }),
}
