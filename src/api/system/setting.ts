import request from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface SystemSettingInitResponse {
  dict: {
    system_setting_value_type_arr: DictOption<number>[]
  }
}

export interface SystemSettingListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  key?: string
  status?: number | ''
}

export interface SystemSettingItem {
  id: number
  setting_key: string
  setting_value: string
  value_type: number
  value_type_name: string
  remark: string
  status: number
  status_name: string
  is_del: number
  created_at: string
  updated_at: string
}

export interface SystemSettingAddParams {
  key: string
  value: string
  type: number
  remark?: string
}

export interface SystemSettingEditParams {
  id: number
  value: string
  type: number
  remark?: string
}

export const SystemSettingApi = {
  init: (params?: RequestPayload) => request.post<SystemSettingInitResponse>('/api/admin/SystemSetting/init', params),
  add: (params: SystemSettingAddParams) => request.post<void>('/api/admin/SystemSetting/add', params),
  edit: (params: SystemSettingEditParams) => request.post<void>('/api/admin/SystemSetting/edit', params),
  del: (params: { id: Id | Id[] }) => request.post<void>('/api/admin/SystemSetting/del', params),
  list: (params: SystemSettingListParams) => request.post<PaginatedResponse<SystemSettingItem>>('/api/admin/SystemSetting/list', params),
  status: (params: { id: Id; status: number }) => request.post<void>('/api/admin/SystemSetting/status', params),
}
