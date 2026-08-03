import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

type AiRunPageInitQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs_page_init'>['query']>
type AiRunListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs'>['query']>
type AiRunDashboardQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_runs_dashboard'>['query']>

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
export type AiRunDetailResponse = components['schemas']['AIRunDetail']
export type AiRunContextPlan = NonNullable<AiRunDetailResponse['context_plan']>
export type AiRunLatencyBreakdown = components['schemas']['AIRunLatencyBreakdown']
export type AiRunClaimSource = AiRunLatencyBreakdown['claim_source']
export type AiRunRequestSummary = components['schemas']['AIRunRequestSummary']
export type AiRunBillingStatus = AiRunItem['billing_status']
export type AiRunBillingReason = AiRunItem['billing_reason']
export type AiRunUserFeedback = NonNullable<AiRunListQuery['user_feedback']>
export type AiRunPricing = components['schemas']['AIRunPricing']
export type AiRunPricingRate = components['schemas']['AIRunPricingRate']
export type AiRunUsageItem = components['schemas']['AIRunUsageItem']
export type AiRunUsageCategory = AiRunUsageItem['category']
export type AiRunProviderAttempt = components['schemas']['AIRunProviderAttempt']
export type AiRunEventItem = components['schemas']['AIRunEvent']
export type AiRunDashboardResponse = components['schemas']['AIRunDashboardResult']
export type AiRunDashboardPercentile = components['schemas']['AIRunDashboardPercentile']
export type AiRunUserFeedbackResponse = components['schemas']['AIRunUserFeedbackResult']

export interface AiRunDashboardParams {
  date_start?: string
  date_end?: string
  platform?: AiRunPlatform | ''
  model_id?: string
  agent_id?: number | ''
  provider_id?: number | ''
  user_id?: number | ''
}

export type AiRunPageInitParams = Pick<AiRunDashboardParams, 'date_start' | 'date_end'>

export interface AiRunListParams {
  current_page?: number
  page_size?: number
  platform?: AiRunPlatform | ''
  status?: AiRunStatus | ''
  user_id?: number | ''
  request_id?: string
  agent_id?: number | ''
  provider_id?: number | ''
  model_id?: string
  billing_status?: AiRunBillingStatus | ''
  billing_reason?: AiRunBillingReason | ''
  error_code?: string
  tool_code?: string
  run_anomaly?: NonNullable<AiRunListQuery['run_anomaly']> | ''
  billing_anomaly?: NonNullable<AiRunListQuery['billing_anomaly']> | ''
  user_feedback?: AiRunUserFeedback | ''
  anomaly_as_of?: string
  date_start?: string
  date_end?: string
}

function positiveID(value: Id | number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('AI run id must be a positive integer')
  }
  return value
}

function normalizePageInitParams(params: AiRunPageInitParams): AiRunPageInitQuery {
  const query: AiRunPageInitQuery = {}
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

function normalizeDashboardParams(params: AiRunDashboardParams): AiRunDashboardQuery {
  const query: AiRunDashboardQuery = normalizePageInitParams(params)
  if (params.platform !== '' && params.platform !== undefined) query.platform = params.platform
  if (params.model_id) query.model_id = params.model_id
  if (params.agent_id !== '' && params.agent_id !== undefined) query.agent_id = params.agent_id
  if (params.provider_id !== '' && params.provider_id !== undefined) query.provider_id = params.provider_id
  if (params.user_id !== '' && params.user_id !== undefined) query.user_id = params.user_id
  return query
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
  if (params.model_id) query.model_id = params.model_id
  if (params.billing_status !== '' && params.billing_status !== undefined) query.billing_status = params.billing_status
  if (params.billing_reason !== '' && params.billing_reason !== undefined) query.billing_reason = params.billing_reason
  if (params.error_code) query.error_code = params.error_code
  if (params.tool_code) query.tool_code = params.tool_code
  if (params.run_anomaly !== '' && params.run_anomaly !== undefined) query.run_anomaly = params.run_anomaly
  if (params.billing_anomaly !== '' && params.billing_anomaly !== undefined) query.billing_anomaly = params.billing_anomaly
  if (params.user_feedback !== '' && params.user_feedback !== undefined) query.user_feedback = params.user_feedback
  if (params.anomaly_as_of) query.anomaly_as_of = params.anomaly_as_of
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

export const AiRunApi = {
  pageInit: (
    params: AiRunPageInitParams = {},
    options: ExecuteOptions = {},
  ): Promise<AiRunInitResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_page_init,
    { query: normalizePageInitParams(params) },
    options,
  ),

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

  dashboard: (
    params: AiRunDashboardParams,
    options: ExecuteOptions = {},
  ): Promise<AiRunDashboardResponse> => executeAdminOperation(
    adminOperations.get_api_admin_v1_ai_runs_dashboard,
    { query: normalizeDashboardParams(params) },
    options,
  ),

  setUserFeedback: (
    params: { id: Id; liked: boolean },
    options: ExecuteOptions = {},
  ): Promise<AiRunUserFeedbackResponse> => {
    if (typeof params.liked !== 'boolean') {
      throw new Error('AI run feedback liked must be a boolean')
    }
    return executeAdminOperation(
      adminOperations.put_api_admin_v1_ai_runs_id_user_feedback,
      {
        path: { id: positiveID(params.id) },
        body: { liked: params.liked },
      },
      options,
    )
  },
}
