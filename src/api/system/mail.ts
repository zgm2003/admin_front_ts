import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type MailCommonStatus = 1 | 2
export type MailLogStatus = 1 | 2 | 3
export type MailTemplateScene = 'login' | 'forget' | 'bind_email' | 'change_password'
export type MailLogScene = MailTemplateScene | 'test'
export type MailRegion = 'ap-guangzhou' | 'ap-hongkong'

export interface MailPageInitResponse {
  dict: {
    common_status_arr: DictOption<MailCommonStatus>[]
    mail_scene_arr: DictOption<MailTemplateScene>[]
    mail_log_scene_arr: DictOption<MailLogScene>[]
    mail_log_status_arr: DictOption<MailLogStatus>[]
    mail_region_arr: DictOption<MailRegion>[]
    default_region: string
    default_endpoint: string
  }
}

export interface MailConfigItem {
  id: number | null
  configured: boolean
  secret_id_hint: string
  secret_key_hint: string
  region: string
  endpoint: string
  from_email: string
  from_name: string
  reply_to: string
  status: MailCommonStatus
  last_test_at: string | null
  last_test_error: string
  created_at: string | null
  updated_at: string | null
}

export interface MailConfigFormState {
  secret_id: string
  secret_key: string
  region: string
  endpoint: string
  from_email: string
  from_name: string
  reply_to: string
  status: MailCommonStatus
}

export interface MailTestPayload {
  to_email: string
  template_scene: MailTemplateScene
}

export interface MailTemplateItem {
  id: number
  scene: MailTemplateScene
  name: string
  subject: string
  tencent_template_id: number
  variables: string[]
  sample_variables: Record<string, string>
  status: MailCommonStatus
  created_at: string
  updated_at: string
}

export interface MailTemplateListResponse {
  list: MailTemplateItem[]
}

export interface MailTemplateSampleVariableRow {
  key: string
  value: string
}

export interface MailTemplateFormState {
  id: number | null
  scene: MailTemplateScene | ''
  name: string
  subject: string
  tencent_template_id: number | null
  variables_text: string
  sample_variables: MailTemplateSampleVariableRow[]
  status: MailCommonStatus
}

export interface MailTemplatePayload {
  scene: MailTemplateScene
  name: string
  subject: string
  tencent_template_id: number
  variables: string[]
  sample_variables: Record<string, string>
  status: MailCommonStatus
}

export interface MailLogListParams {
  current_page: number
  page_size: number
  scene?: MailLogScene | ''
  status?: MailLogStatus | ''
  to_email?: string
  created_at_start?: string
  created_at_end?: string
}

interface MailLogQueryParams {
  current_page: number
  page_size: number
  scene?: MailLogScene
  status?: MailLogStatus
  to_email?: string
  created_at_start?: string
  created_at_end?: string
}

export interface MailLogItem {
  id: number
  scene: MailLogScene
  template_id: number | null
  to_email: string
  subject: string
  status: MailLogStatus
  tencent_request_id: string
  tencent_message_id: string
  error_code: string
  error_message: string
  duration_ms: number
  sent_at: string | null
  created_at: string
  updated_at: string
  template?: MailLogTemplate | null
}

export interface MailLogTemplate {
  id: number
  scene: MailTemplateScene
  name: string
  tencent_template_id: number
  variables: string[]
  status: MailCommonStatus
}

interface MailStatusPayload {
  status: MailCommonStatus
}

interface MailDeletePayload {
  ids: number[]
}

const BASE = `${ADMIN_API_PREFIX}/mail`

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

function normalizeLogParams(params: MailLogListParams): MailLogQueryParams {
  const query: MailLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.scene) {
    query.scene = params.scene
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (params.to_email?.trim()) {
    query.to_email = params.to_email.trim()
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
  const ids = normalizeIDs(id, 'mail log id')
  if (ids.length === 1) {
    return request.delete<void>(`${BASE}/logs/${ids[0]}`)
  }
  return request.delete<void, MailDeletePayload>(`${BASE}/logs`, { data: { ids } })
}

export const MailApi = {
  pageInit: () => request.get<MailPageInitResponse>(`${BASE}/page-init`),
  config: () => request.get<MailConfigItem>(`${BASE}/config`),
  saveConfig: (payload: MailConfigFormState) => request.put<void, MailConfigFormState>(`${BASE}/config`, payload),
  deleteConfig: () => request.delete<void>(`${BASE}/config`),
  test: (payload: MailTestPayload) => request.post<void, MailTestPayload>(`${BASE}/test`, payload),
  templates: () => request.get<MailTemplateListResponse>(`${BASE}/templates`),
  createTemplate: (payload: MailTemplatePayload) => request.post<{ id: number }, MailTemplatePayload>(`${BASE}/templates`, payload),
  addTemplate: (payload: MailTemplatePayload) => request.post<{ id: number }, MailTemplatePayload>(`${BASE}/templates`, payload),
  updateTemplate: (id: Id, payload: MailTemplatePayload) => request.put<void, MailTemplatePayload>(`${BASE}/templates/${assertPositiveID(id, 'mail template id')}`, payload),
  editTemplate: (id: Id, payload: MailTemplatePayload) => request.put<void, MailTemplatePayload>(`${BASE}/templates/${assertPositiveID(id, 'mail template id')}`, payload),
  updateTemplateStatus: (id: Id, status: MailCommonStatus) => request.patch<void, MailStatusPayload>(`${BASE}/templates/${assertPositiveID(id, 'mail template id')}/status`, { status }),
  changeTemplateStatus: (id: Id, status: MailCommonStatus) => request.patch<void, MailStatusPayload>(`${BASE}/templates/${assertPositiveID(id, 'mail template id')}/status`, { status }),
  deleteTemplate: (id: Id) => request.delete<void>(`${BASE}/templates/${assertPositiveID(id, 'mail template id')}`),
  logs: (params: MailLogListParams) => request.get<PaginatedResponse<MailLogItem>>(`${BASE}/logs`, { params: normalizeLogParams(params) }),
  log: (id: Id) => request.get<MailLogItem>(`${BASE}/logs/${assertPositiveID(id, 'mail log id')}`),
  deleteLog: (id: Id) => request.delete<void>(`${BASE}/logs/${assertPositiveID(id, 'mail log id')}`),
  deleteLogs: (params: { id: Id | Id[] }) => deleteLogs(params.id),
}
