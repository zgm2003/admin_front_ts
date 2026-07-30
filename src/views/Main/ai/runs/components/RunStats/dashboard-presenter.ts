import type {
  AiRunBillingReason,
  AiRunBillingStatus,
  AiRunDashboardParams,
  AiRunDashboardPercentile,
  AiRunListParams,
  AiRunPlatform,
  AiRunStatus,
} from '@/api/ai/runs'

export type DashboardRunAnomalyCode =
  | 'failed'
  | 'timeout'
  | 'outcome_unknown'
  | 'stale_running'

export type DashboardBillingAnomalyCode =
  | 'state_inconsistent'
  | 'open_overdue'
  | 'pricing_snapshot_missing'
  | 'legacy_unpriced'
  | 'unbilled_usage_incomplete'
  | 'unbilled_over_hold'

export type DashboardDrilldownTarget =
  | { kind: 'status'; status: AiRunStatus }
  | { kind: 'run_anomaly'; code: DashboardRunAnomalyCode }
  | { kind: 'billing_anomaly'; code: DashboardBillingAnomalyCode }
  | { kind: 'model'; model_id: string }
  | { kind: 'provider'; provider_id: number }
  | { kind: 'agent'; agent_id: number }
  | { kind: 'user'; user_id: number }
  | { kind: 'error'; error_code: string }
  | { kind: 'tool'; tool_code: string }

export type DashboardDurationPresentation =
  | { kind: 'value'; text: string; sampleCount: number }
  | { kind: 'insufficient'; sampleCount: number }

const countFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 })
const rateFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const decimalAmountPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/
const positiveIntegerPattern = /^[1-9]\d*$/

const statuses = new Set<AiRunStatus>([
  'running',
  'success',
  'failed',
  'canceled',
  'timeout',
  'outcome_unknown',
])
const billingStatuses = new Set<AiRunBillingStatus>([
  'pending',
  'held',
  'settled',
  'released',
  'unbilled',
])
const billingReasons = new Set<AiRunBillingReason>([
  'pending',
  'held',
  'settled_complete_usage',
  'released_before_dispatch',
  'released_insufficient_balance',
  'released_provider_failed',
  'released_outcome_unknown',
  'unbilled_usage_incomplete',
  'unbilled_over_hold',
  'legacy_unpriced',
])
const runAnomalies = new Set<DashboardRunAnomalyCode>([
  'failed',
  'timeout',
  'outcome_unknown',
  'stale_running',
])
const billingAnomalies = new Set<DashboardBillingAnomalyCode>([
  'state_inconsistent',
  'open_overdue',
  'pricing_snapshot_missing',
  'legacy_unpriced',
  'unbilled_usage_incomplete',
  'unbilled_over_hold',
])
const userFeedbackValues = new Set<NonNullable<AiRunListParams['user_feedback']>>([
  'liked',
  'unliked',
])

export function formatDashboardCount(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Dashboard count must be a non-negative safe integer')
  }
  return countFormatter.format(value)
}

export function formatDashboardMoney(value: string): string {
  if (!decimalAmountPattern.test(value)) {
    throw new Error('Dashboard money must be a non-negative decimal string')
  }
  return `¥${value}`
}

export function formatDashboardRate(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Dashboard rate must be between 0 and 100')
  }
  return `${rateFormatter.format(value)}%`
}

export function formatDashboardDuration(
  value: AiRunDashboardPercentile,
): DashboardDurationPresentation {
  if (!Number.isSafeInteger(value.sample_count) || value.sample_count < 0) {
    throw new Error('Dashboard duration sample count must be a non-negative safe integer')
  }
  if (value.sample_count === 0 || value.insufficient_sample) {
    return { kind: 'insufficient', sampleCount: value.sample_count }
  }
  if (!Number.isSafeInteger(value.p95_ms) || value.p95_ms < 0) {
    throw new Error('Dashboard duration p95 must be a non-negative safe integer')
  }
  return {
    kind: 'value',
    text: `${countFormatter.format(value.p95_ms)} ms`,
    sampleCount: value.sample_count,
  }
}

export function defaultDashboardDates(now: Date): [string, string] {
  if (Number.isNaN(now.getTime())) throw new Error('Dashboard current time must be valid')
  const today = shanghaiDateParts(now)
  const end = new Date(Date.UTC(today.year, today.month - 1, today.day))
  const start = new Date(end.getTime() - (6 * 24 * 60 * 60 * 1000))
  return [formatUTCDate(start), formatUTCDate(end)]
}

export function buildRunListDrilldown(
  base: AiRunDashboardParams,
  generatedAt: string,
  target: DashboardDrilldownTarget,
): AiRunListParams {
  const params: AiRunListParams = { ...base }
  switch (target.kind) {
    case 'status':
      return { ...params, status: target.status }
    case 'run_anomaly':
      return { ...params, run_anomaly: target.code, anomaly_as_of: generatedAt }
    case 'billing_anomaly':
      return { ...params, billing_anomaly: target.code, anomaly_as_of: generatedAt }
    case 'model':
      return { ...params, model_id: target.model_id }
    case 'provider':
      return { ...params, provider_id: target.provider_id }
    case 'agent':
      return { ...params, agent_id: target.agent_id }
    case 'user':
      return { ...params, user_id: target.user_id }
    case 'error':
      return { ...params, error_code: target.error_code }
    case 'tool':
      return { ...params, tool_code: target.tool_code }
  }
}

export function serializeRunListQuery(params: AiRunListParams): Record<string, string> {
  const query: Record<string, string> = {}
  putNumber(query, 'current_page', params.current_page)
  putNumber(query, 'page_size', params.page_size)
  putString(query, 'date_start', params.date_start)
  putString(query, 'date_end', params.date_end)
  putString(query, 'platform', params.platform)
  putString(query, 'status', params.status)
  putString(query, 'model_id', params.model_id)
  putNumber(query, 'agent_id', params.agent_id)
  putNumber(query, 'provider_id', params.provider_id)
  putNumber(query, 'user_id', params.user_id)
  putString(query, 'request_id', params.request_id)
  putString(query, 'billing_status', params.billing_status)
  putString(query, 'billing_reason', params.billing_reason)
  putString(query, 'error_code', params.error_code)
  putString(query, 'tool_code', params.tool_code)
  putString(query, 'run_anomaly', params.run_anomaly)
  putString(query, 'billing_anomaly', params.billing_anomaly)
  putString(query, 'user_feedback', params.user_feedback)
  putString(query, 'anomaly_as_of', params.anomaly_as_of)
  return query
}

export function parseRunListQuery(query: Readonly<Record<string, unknown>>): AiRunListParams {
  const params: AiRunListParams = {}
  const dateStart = queryString(query.date_start)
  const dateEnd = queryString(query.date_end)
  if (dateStart && calendarDatePattern.test(dateStart)) params.date_start = dateStart
  if (dateEnd && calendarDatePattern.test(dateEnd)) params.date_end = dateEnd

  const platform = queryString(query.platform)
  if (platform === 'admin') params.platform = platform satisfies AiRunPlatform
  const status = queryString(query.status)
  if (status && statuses.has(status as AiRunStatus)) params.status = status as AiRunStatus
  putParsedString(params, 'model_id', query.model_id)
  putParsedPositiveInteger(params, 'agent_id', query.agent_id)
  putParsedPositiveInteger(params, 'provider_id', query.provider_id)
  putParsedPositiveInteger(params, 'user_id', query.user_id)
  putParsedString(params, 'request_id', query.request_id)

  const billingStatus = queryString(query.billing_status)
  if (billingStatus && billingStatuses.has(billingStatus as AiRunBillingStatus)) {
    params.billing_status = billingStatus as AiRunBillingStatus
  }
  const billingReason = queryString(query.billing_reason)
  if (billingReason && billingReasons.has(billingReason as AiRunBillingReason)) {
    params.billing_reason = billingReason as AiRunBillingReason
  }
  putParsedString(params, 'error_code', query.error_code)
  putParsedString(params, 'tool_code', query.tool_code)

  const runAnomaly = queryString(query.run_anomaly)
  if (runAnomaly && runAnomalies.has(runAnomaly as DashboardRunAnomalyCode)) {
    params.run_anomaly = runAnomaly as DashboardRunAnomalyCode
  }
  const billingAnomaly = queryString(query.billing_anomaly)
  if (billingAnomaly && billingAnomalies.has(billingAnomaly as DashboardBillingAnomalyCode)) {
    params.billing_anomaly = billingAnomaly as DashboardBillingAnomalyCode
  }
  const userFeedback = queryString(query.user_feedback)
  if (userFeedback && userFeedbackValues.has(userFeedback as NonNullable<AiRunListParams['user_feedback']>)) {
    params.user_feedback = userFeedback as NonNullable<AiRunListParams['user_feedback']>
  }
  if (params.run_anomaly || params.billing_anomaly) {
    putParsedString(params, 'anomaly_as_of', query.anomaly_as_of)
  }
  putParsedPositiveInteger(params, 'current_page', query.current_page)
  putParsedPositiveInteger(params, 'page_size', query.page_size)
  return params
}

function shanghaiDateParts(value: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const values = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]))
  return { year: values.year!, month: values.month!, day: values.day! }
}

function formatUTCDate(value: Date): string {
  return [
    value.getUTCFullYear().toString().padStart(4, '0'),
    (value.getUTCMonth() + 1).toString().padStart(2, '0'),
    value.getUTCDate().toString().padStart(2, '0'),
  ].join('-')
}

function putString(
  target: Record<string, string>,
  key: string,
  value: string | undefined,
): void {
  if (value) target[key] = value
}

function putNumber(
  target: Record<string, string>,
  key: string,
  value: number | '' | undefined,
): void {
  if (typeof value === 'number') target[key] = String(value)
}

function queryString(value: unknown): string | undefined {
  if (typeof value === 'string') return value || undefined
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string' && item !== '')
  return undefined
}

function putParsedString<K extends keyof AiRunListParams>(
  target: AiRunListParams,
  key: K,
  raw: unknown,
): void {
  const value = queryString(raw)
  if (value) target[key] = value as AiRunListParams[K]
}

function putParsedPositiveInteger<K extends keyof AiRunListParams>(
  target: AiRunListParams,
  key: K,
  raw: unknown,
): void {
  const value = queryString(raw)
  if (!value || !positiveIntegerPattern.test(value)) return
  const parsed = Number(value)
  if (Number.isSafeInteger(parsed)) target[key] = parsed as AiRunListParams[K]
}
