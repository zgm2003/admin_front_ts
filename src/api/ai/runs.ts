import request from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiMessageMeta } from './messages'

export interface AiRunInitResponse {
  dict: {
    run_status_arr: DictOption<number>[]
    agentArr: DictOption<number>[]
  }
}

export interface AiRunListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  run_status?: number | ''
  user_id?: number | ''
  request_id?: string
  agent_id?: number | ''
  date_start?: string
  date_end?: string
}

export interface AiRunItem {
  id: number
  request_id: string
  user_id: number
  agent_id: number
  agent_name: string
  conversation_id: number
  conversation_title: string
  run_status: number
  run_status_name: string
  model_snapshot: string
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
  latency_ms?: number | null
  latency_str: string
  error_msg?: string | null
  created_at: string
}

export interface AiRunMessageSummary {
  id: number
  content: string
  meta_json?: AiMessageMeta
  created_at: string
}

export interface AiRunStepItem {
  id: number
  step_no: number
  step_type: number
  step_type_name: string
  agent_id?: number | null
  agent_name?: string | null
  model_snapshot?: string | null
  status: number
  status_name: string
  error_msg?: string | null
  latency_ms?: number | null
  latency_str: string
  payload_json?: Record<string, unknown> | null
  created_at: string
}

export interface AiRunDetailResponse {
  id: number
  request_id: string
  user_id: number
  username: string
  agent_id: number
  agent_name: string
  conversation_id: number
  conversation_title: string
  run_status: number
  run_status_name: string
  model_snapshot: string
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
  latency_ms?: number | null
  latency_str: string
  error_msg?: string | null
  meta_json?: Record<string, unknown> | null
  user_message?: AiRunMessageSummary | null
  assistant_message?: AiRunMessageSummary | null
  created_at: string
  updated_at: string
  steps: AiRunStepItem[]
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
    avg_latency_ms: number
  }
}

export interface AiRunStatsMetricItem {
  total_runs: number
  total_tokens: number
  total_prompt_tokens: number
  total_completion_tokens: number
  avg_latency_ms: number
}

export interface AiRunStatsByDateItem extends AiRunStatsMetricItem {
  date: string
}

export interface AiRunStatsByAgentItem extends AiRunStatsMetricItem {
  agent_name: string
}

export interface AiRunStatsByUserItem extends AiRunStatsMetricItem {
  username: string
}

export interface AiRunStatsListResponse<T> {
  list: T[]
  has_more: boolean
  current_page: number
}

export const AiRunApi = {
  init: (params?: RequestPayload) => request.post<AiRunInitResponse>('/api/admin/AiRuns/init', params),
  list: (params: AiRunListParams) => request.post<PaginatedResponse<AiRunItem>>('/api/admin/AiRuns/list', params),
  detail: (params: { id: number }) => request.post<AiRunDetailResponse>('/api/admin/AiRuns/detail', params),
  stats: (params?: RequestPayload) => request.post<AiRunStatsSummaryResponse>('/api/admin/AiRuns/stats', params),
  statsByDate: (params: RequestPayload) => request.post<AiRunStatsListResponse<AiRunStatsByDateItem>>('/api/admin/AiRuns/statsByDate', params),
  statsByAgent: (params: RequestPayload) => request.post<AiRunStatsListResponse<AiRunStatsByAgentItem>>('/api/admin/AiRuns/statsByAgent', params),
  statsByUser: (params: RequestPayload) => request.post<AiRunStatsListResponse<AiRunStatsByUserItem>>('/api/admin/AiRuns/statsByUser', params),
}
