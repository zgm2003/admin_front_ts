import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export type JsonValue = components['schemas']['JSONValue']
export type AiRunStatus = components['schemas']['AIRunListItem']['status']
export type AiRunPlatform = components['schemas']['AIRunListItem']['platform']
export type AiRunToolCallStatus = components['schemas']['AIRunToolCall']['status']
export type AiRunInitResponse = components['schemas']['AIRunPageInit']
export type AiRunItem = components['schemas']['AIRunListItem']
export type AiRunListResponse = components['schemas']['AIRunListResult']
export type AiRunMessageSummary = components['schemas']['AIRunMessageSummary']
export type AiRunMessageMeta = components['schemas']['AIRunMessageSummary']['meta_json']
export type AiRunToolCallItem = components['schemas']['AIRunToolCall']
export type AiRunKnowledgeHitItem = components['schemas']['AIRunKnowledgeHit']
export type AiRunKnowledgeRetrievalItem = components['schemas']['AIRunKnowledgeRetrieval']
export type AiRunDetailResponse = components['schemas']['AIRunDetail']
export type AiRunEventItem = components['schemas']['AIRunEvent']
export type AiRunStatsSummaryResponse = components['schemas']['AIRunStatsResult']
export type AiRunStatsMetricItem = components['schemas']['AIRunStatsMetric']
export type AiRunStatsByDateItem = components['schemas']['AIRunStatsByDateItem']
export type AiRunStatsByAgentItem = components['schemas']['AIRunStatsByAgentItem']
export type AiRunStatsByUserItem = components['schemas']['AIRunStatsByUserItem']
export type AiRunStatsByDateResponse = components['schemas']['AIRunStatsByDateResult']
export type AiRunStatsByAgentResponse = components['schemas']['AIRunStatsByAgentResult']
export type AiRunStatsByUserResponse = components['schemas']['AIRunStatsByUserResult']

export interface AiRunListParams {
  current_page?: number
  page_size?: number
  platform?: AiRunPlatform | ''
  status?: AiRunStatus | ''
  user_id?: number | ''
  request_id?: string
  agent_id?: number | ''
  provider_id?: number | ''
  date_start?: string
  date_end?: string
}

export interface AiRunStatsParams {
  date_start?: string
  date_end?: string
  platform?: AiRunPlatform | ''
  agent_id?: number | ''
  provider_id?: number | ''
  user_id?: number | ''
}

export interface AiRunStatsListParams extends AiRunStatsParams {
  current_page: number
  page_size: number
}

type AiRunListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs'>['query']>
type AiRunStatsQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs_stats'>['query']>
type AiRunStatsListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs_stats_by_date'>['query']>

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('AI run id must be a positive integer')
  return id
}

function normalizeListParams(params: AiRunListParams): AiRunListQuery {
  const query: AiRunListQuery = {}
  if (params.current_page !== undefined) query.current_page = params.current_page
  if (params.page_size !== undefined) query.page_size = params.page_size
  if (params.platform !== '' && params.platform !== undefined) query.platform = params.platform
  if (params.status !== '' && params.status !== undefined) query.status = params.status
  if (params.user_id !== '' && params.user_id !== undefined) query.user_id = params.user_id
  if (params.request_id) query.request_id = params.request_id
  if (params.agent_id !== '' && params.agent_id !== undefined) query.agent_id = params.agent_id
  if (params.provider_id !== '' && params.provider_id !== undefined) query.provider_id = params.provider_id
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

function normalizeStatsParams(params: AiRunStatsParams = {}): AiRunStatsQuery {
  const query: AiRunStatsQuery = {}
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  if (params.platform !== '' && params.platform !== undefined) query.platform = params.platform
  if (params.agent_id !== '' && params.agent_id !== undefined) query.agent_id = params.agent_id
  if (params.provider_id !== '' && params.provider_id !== undefined) query.provider_id = params.provider_id
  if (params.user_id !== '' && params.user_id !== undefined) query.user_id = params.user_id
  return query
}

function normalizeStatsListParams(params: AiRunStatsListParams): AiRunStatsListQuery {
  return {
    ...normalizeStatsParams(params),
    current_page: params.current_page,
    page_size: params.page_size,
  }
}

export const AiRunApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<AiRunInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_runs_page_init, {}, options),

  list: (params: AiRunListParams, options: ExecuteOptions = {}): Promise<AiRunListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_runs, {
      query: normalizeListParams(params),
    }, options),

  detail: (
    params: { id: Id },
    options: ExecuteOptions = {},
  ): Promise<AiRunDetailResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_id,
    { path: { id: positiveID(params.id) } },
    options,
  ),

  stats: (
    params: AiRunStatsParams = {},
    options: ExecuteOptions = {},
  ): Promise<AiRunStatsSummaryResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_stats,
    { query: normalizeStatsParams(params) },
    options,
  ),

  statsByDate: (
    params: AiRunStatsListParams,
    options: ExecuteOptions = {},
  ): Promise<AiRunStatsByDateResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_stats_by_date,
    { query: normalizeStatsListParams(params) },
    options,
  ),

  statsByAgent: (
    params: AiRunStatsListParams,
    options: ExecuteOptions = {},
  ): Promise<AiRunStatsByAgentResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_stats_by_agent,
    { query: normalizeStatsListParams(params) },
    options,
  ),

  statsByUser: (
    params: AiRunStatsListParams,
    options: ExecuteOptions = {},
  ): Promise<AiRunStatsByUserResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_stats_by_user,
    { query: normalizeStatsListParams(params) },
    options,
  ),
}
