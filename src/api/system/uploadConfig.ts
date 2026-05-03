import { legacyRequest } from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface UploadDriverInitResponse {
  dict: {
    upload_driver_arr: DictOption<string>[]
  }
}

export interface UploadDriverListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  driver?: string
}

export interface UploadDriverItem {
  id: number
  driver: string
  driver_show: string
  secret_id_hint?: string
  secret_key_hint?: string
  bucket: string
  region: string
  role_arn?: string | null
  appid?: string | null
  endpoint?: string | null
  bucket_domain?: string | null
  created_at: string
  updated_at: string
}

export interface UploadDriverForm {
  id?: number | string
  driver: string
  secret_id?: string
  secret_key?: string
  bucket: string
  region: string
  role_arn?: string | null
  appid?: string | null
  endpoint?: string | null
  bucket_domain?: string | null
}

export interface UploadRuleInitResponse {
  dict: {
    upload_image_ext_arr: DictOption<string>[]
    upload_file_ext_arr: DictOption<string>[]
  }
}

export interface UploadRuleListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
}

export interface UploadRuleItem {
  id: number
  title: string
  max_size_mb: number
  image_exts: string[]
  file_exts: string[]
  created_at: string
  updated_at: string
}

export interface UploadRuleForm {
  id?: number | string
  title: string
  max_size_mb: number
  image_exts: string[]
  file_exts: string[]
}

export interface UploadSettingInitResponse {
  dict: {
    upload_driver_list: DictOption<number>[]
    upload_rule_list: DictOption<number>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface UploadSettingListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  remark?: string
  status?: number | ''
  driver_id?: number | ''
  rule_id?: number | ''
}

export interface UploadSettingItem {
  id: number
  driver_id: number
  rule_id: number
  driver_name: string
  rule_name: string
  status: number
  status_name: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface UploadSettingForm {
  id?: number | string
  driver_id: number | string
  rule_id: number | string
  status: number
  remark?: string
}

export const UploadDriverApi = {
  init: (params?: RequestPayload) => legacyRequest.post<UploadDriverInitResponse>('/api/admin/UploadDriver/init', params),
  list: (params: UploadDriverListParams) => legacyRequest.post<PaginatedResponse<UploadDriverItem>>('/api/admin/UploadDriver/list', params),
  add: (params: UploadDriverForm) => legacyRequest.post<{ id: number }>('/api/admin/UploadDriver/add', params),
  edit: (params: UploadDriverForm) => legacyRequest.post<void>('/api/admin/UploadDriver/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<void>('/api/admin/UploadDriver/del', params)
}

export const UploadRuleApi = {
  init: (params?: RequestPayload) => legacyRequest.post<UploadRuleInitResponse>('/api/admin/UploadRule/init', params),
  list: (params: UploadRuleListParams) => legacyRequest.post<PaginatedResponse<UploadRuleItem>>('/api/admin/UploadRule/list', params),
  add: (params: UploadRuleForm) => legacyRequest.post<void>('/api/admin/UploadRule/add', params),
  edit: (params: UploadRuleForm) => legacyRequest.post<void>('/api/admin/UploadRule/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<void>('/api/admin/UploadRule/del', params)
}

export const UploadSettingApi = {
  init: (params?: RequestPayload) => legacyRequest.post<UploadSettingInitResponse>('/api/admin/UploadSetting/init', params),
  list: (params: UploadSettingListParams) => legacyRequest.post<PaginatedResponse<UploadSettingItem>>('/api/admin/UploadSetting/list', params),
  add: (params: UploadSettingForm) => legacyRequest.post<void>('/api/admin/UploadSetting/add', params),
  edit: (params: UploadSettingForm) => legacyRequest.post<void>('/api/admin/UploadSetting/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<void>('/api/admin/UploadSetting/del', params),
  status: (params: { id: Id; status: number }) => legacyRequest.post<void>('/api/admin/UploadSetting/status', params)
}
