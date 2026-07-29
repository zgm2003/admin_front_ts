import type {
  AiRunBillingReason,
  AiRunBillingStatus,
  AiRunListParams,
  AiRunPlatform,
  AiRunStatus,
} from '@/api/ai/runs'
import {
  parseRunListQuery,
  serializeRunListQuery,
} from '../RunStats/dashboard-presenter'

type RunAnomaly = NonNullable<AiRunListParams['run_anomaly']>
type BillingAnomaly = NonNullable<AiRunListParams['billing_anomaly']>

export interface RunListSearchForm {
  platform: AiRunPlatform | ''
  status: AiRunStatus | ''
  model_id: string
  agent_id: number | ''
  provider_id: number | ''
  user_id: number | ''
  request_id: string
  billing_status: AiRunBillingStatus | ''
  billing_reason: AiRunBillingReason | ''
  error_code: string
  tool_code: string
  run_anomaly: RunAnomaly | ''
  billing_anomaly: BillingAnomaly | ''
  anomaly_as_of: string
  dateRange: string[]
}

export const createEmptyRunListSearchForm = (): RunListSearchForm => ({
  platform: '',
  status: '',
  model_id: '',
  agent_id: '',
  provider_id: '',
  user_id: '',
  request_id: '',
  billing_status: '',
  billing_reason: '',
  error_code: '',
  tool_code: '',
  run_anomaly: '',
  billing_anomaly: '',
  anomaly_as_of: '',
  dateRange: [],
})

export function runListSearchFormFromQuery(
  query: Readonly<Record<string, unknown>>,
): RunListSearchForm {
  const params = parseRunListQuery(query)
  return {
    ...createEmptyRunListSearchForm(),
    platform: params.platform ?? '',
    status: params.status ?? '',
    model_id: params.model_id ?? '',
    agent_id: params.agent_id ?? '',
    provider_id: params.provider_id ?? '',
    user_id: params.user_id ?? '',
    request_id: params.request_id ?? '',
    billing_status: params.billing_status ?? '',
    billing_reason: params.billing_reason ?? '',
    error_code: params.error_code ?? '',
    tool_code: params.tool_code ?? '',
    run_anomaly: params.run_anomaly ?? '',
    billing_anomaly: params.billing_anomaly ?? '',
    anomaly_as_of: params.anomaly_as_of ?? '',
    dateRange: params.date_start && params.date_end
      ? [params.date_start, params.date_end]
      : [],
  }
}

export function runListParamsFromSearchForm(form: RunListSearchForm): AiRunListParams {
  const { dateRange, ...filters } = form
  const [date_start, date_end] = dateRange
  return parseRunListQuery(serializeRunListQuery({
    ...filters,
    date_start,
    date_end,
  }))
}

export function runListRouteFilterKey(query: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(serializeRunListQuery(parseRunListQuery(query)))
}
