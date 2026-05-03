import { legacyRequest } from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface AuthPlatformInitResponse {
  dict: {
    common_status_arr: DictOption<number>[]
    auth_platform_login_type_arr: DictOption<string>[]
  }
}

export interface AuthPlatformListParams extends RequestPayload {
  current_page: number
  page_size: number
  name?: string
  status?: number | ''
}

export interface AuthPlatformItem {
  id: number
  code: string
  name: string
  login_types: string[]
  access_ttl: number
  refresh_ttl: number
  bind_platform: number
  bind_device: number
  bind_ip: number
  single_session: number
  max_sessions: number
  allow_register: number
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AuthPlatformAddPayload extends RequestPayload {
  code: string
  name: string
  login_types: string[]
  access_ttl: number
  refresh_ttl: number
  bind_platform: number
  bind_device: number
  bind_ip: number
  single_session: number
  max_sessions: number
  allow_register: number
}

export interface AuthPlatformEditPayload extends RequestPayload {
  id: number
  name: string
  login_types: string[]
  access_ttl: number
  refresh_ttl: number
  bind_platform: number
  bind_device: number
  bind_ip: number
  single_session: number
  max_sessions: number
  allow_register: number
}

export const AuthPlatformApi = {
  init: () => legacyRequest.post<AuthPlatformInitResponse>('/api/admin/AuthPlatform/init'),
  list: (params: AuthPlatformListParams) => legacyRequest.post<PaginatedResponse<AuthPlatformItem>>('/api/admin/AuthPlatform/list', params),
  add: (params: AuthPlatformAddPayload) => legacyRequest.post<void>('/api/admin/AuthPlatform/add', params),
  edit: (params: AuthPlatformEditPayload) => legacyRequest.post<void>('/api/admin/AuthPlatform/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<void>('/api/admin/AuthPlatform/del', params),
  status: (params: { id: number; status: number }) => legacyRequest.post<void>('/api/admin/AuthPlatform/status', params),
}
