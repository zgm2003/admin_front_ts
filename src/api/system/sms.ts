import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type SmsCommonStatus = 1 | 2
export type SmsLogStatus = 1 | 2 | 3
export type SmsTemplateScene = 'login' | 'forget' | 'bind_phone' | 'change_password'
export type SmsLogScene = SmsTemplateScene | 'test'
export type SmsRegion = 'ap-guangzhou'

export interface SmsPageInitResponse {
  dict: {
    common_status_arr: DictOption<SmsCommonStatus>[]
    sms_scene_arr: DictOption<SmsTemplateScene>[]
    sms_log_scene_arr: DictOption<SmsLogScene>[]
    sms_log_status_arr: DictOption<SmsLogStatus>[]
    sms_region_arr: DictOption<SmsRegion>[]
    default_region: SmsRegion
    default_endpoint: string
    default_ttl_minutes: number
  }
}

export interface SmsConfigItem {
  id: number | null
  configured: boolean
  secret_id_hint: string
  secret_key_hint: string
  sms_sdk_app_id: string
  sign_name: string
  region: SmsRegion
  endpoint: string
  status: SmsCommonStatus
  verify_code_ttl_minutes: number
  last_test_at: string | null
  last_test_error: string
  created_at: string | null
  updated_at: string | null
}

export interface SmsConfigFormState {
  secret_id: string
  secret_key: string
  sms_sdk_app_id: string
  sign_name: string
  region: SmsRegion
  endpoint: string
  status: SmsCommonStatus
  verify_code_ttl_minutes: number
}

export interface SmsTestPayload {
  to_phone: string
  template_scene: SmsTemplateScene
}

export interface SmsTemplateItem {
  id: number
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  sample_variables: Record<string, string>
  status: SmsCommonStatus
  created_at: string
  updated_at: string
}

export interface SmsTemplateListResponse {
  list: SmsTemplateItem[]
}

export interface SmsTemplateSampleVariableRow {
  key: string
  value: string
}

export interface SmsTemplateFormState {
  id: number | null
  scene: SmsTemplateScene | ''
  name: string
  tencent_template_id: string
  variables_text: string
  sample_variables: SmsTemplateSampleVariableRow[]
  status: SmsCommonStatus
}

export interface SmsTemplatePayload {
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  sample_variables: Record<string, string>
  status: SmsCommonStatus
}

export interface SmsLogListParams {
  current_page: number
  page_size: number
  scene?: SmsLogScene | ''
  status?: SmsLogStatus | ''
  to_phone?: string
  created_at_start?: string
  created_at_end?: string
}

interface SmsLogQueryParams {
  current_page: number
  page_size: number
  scene?: SmsLogScene
  status?: SmsLogStatus
  to_phone?: string
  created_at_start?: string
  created_at_end?: string
}

export interface SmsLogItem {
  id: number
  scene: SmsLogScene
  template_id: number | null
  to_phone: string
  status: SmsLogStatus
  tencent_request_id: string
  tencent_serial_no: string
  tencent_fee: number
  error_code: string
  error_message: string
  duration_ms: number
  sent_at: string | null
  created_at: string
  updated_at: string
  template?: SmsLogTemplate | null
}

export interface SmsLogTemplate {
  id: number
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  status: SmsCommonStatus
}

interface SmsStatusPayload {
  status: SmsCommonStatus
}

interface SmsDeletePayload {
  ids: number[]
}

const BASE = `${ADMIN_API_PREFIX}/sms`

function assertPositiveID(id: Id, label: string): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return id
}

function normalizeIDs(id: Id | Id[], label: string): number[] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    const numericID = assertPositiveID(value, label)
    if (seen.has(numericID)) {
      continue
    }
    seen.add(numericID)
    ids.push(numericID)
  }

  return ids
}

function normalizeLogParams(params: SmsLogListParams): SmsLogQueryParams {
  const query: SmsLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.scene) {
    query.scene = params.scene
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (params.to_phone?.trim()) {
    query.to_phone = params.to_phone.trim()
  }
  if (params.created_at_start) {
    query.created_at_start = params.created_at_start
  }
  if (params.created_at_end) {
    query.created_at_end = params.created_at_end
  }

  return query
}

function deleteLogs(id: Id | Id[]) {
  const ids = normalizeIDs(id, 'sms log id')
  if (ids.length === 1) {
    return request.delete<void>(`${BASE}/logs/${ids[0]}`)
  }
  return request.delete<void, SmsDeletePayload>(`${BASE}/logs`, { data: { ids } })
}

export const SmsApi = {
  pageInit: () => request.get<SmsPageInitResponse>(`${BASE}/page-init`),
  config: () => request.get<SmsConfigItem>(`${BASE}/config`),
  saveConfig: (payload: SmsConfigFormState) => request.put<void, SmsConfigFormState>(`${BASE}/config`, payload),
  deleteConfig: () => request.delete<void>(`${BASE}/config`),
  test: (payload: SmsTestPayload) => request.post<void, SmsTestPayload>(`${BASE}/test`, payload),
  templates: () => request.get<SmsTemplateListResponse>(`${BASE}/templates`),
  createTemplate: (payload: SmsTemplatePayload) => request.post<{ id: number }, SmsTemplatePayload>(`${BASE}/templates`, payload),
  updateTemplate: (id: Id, payload: SmsTemplatePayload) => request.put<void, SmsTemplatePayload>(`${BASE}/templates/${assertPositiveID(id, 'sms template id')}`, payload),
  updateTemplateStatus: (id: Id, status: SmsCommonStatus) => request.patch<void, SmsStatusPayload>(`${BASE}/templates/${assertPositiveID(id, 'sms template id')}/status`, { status }),
  deleteTemplate: (id: Id) => request.delete<void>(`${BASE}/templates/${assertPositiveID(id, 'sms template id')}`),
  logs: (params: SmsLogListParams) => request.get<PaginatedResponse<SmsLogItem>>(`${BASE}/logs`, { params: normalizeLogParams(params) }),
  log: (id: Id) => request.get<SmsLogItem>(`${BASE}/logs/${assertPositiveID(id, 'sms log id')}`),
  deleteLog: (id: Id) => request.delete<void>(`${BASE}/logs/${assertPositiveID(id, 'sms log id')}`),
  deleteLogs: (params: { id: Id | Id[] }) => deleteLogs(params.id),
}
