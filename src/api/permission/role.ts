import request from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { PermissionTreeNode } from './permission'

export interface RoleInitResponse {
  dict: {
    permission_tree: PermissionTreeNode[]
    permission_platform_arr: DictOption<string>[]
  }
}

export interface RoleListParams extends RequestPayload {
  current_page: number
  page_size: number
  name?: string
}

export interface RoleListItem {
  id: number
  name: string
  permission_id: number[]
  is_default: number
  created_at: string
  updated_at: string
}

export interface RoleAddPayload extends RequestPayload {
  name: string
  permission_id: number[]
}

export interface RoleEditPayload extends RoleAddPayload {
  id: number
}

export const RoleApi = {
  init: () => request.post<RoleInitResponse>('/api/admin/Role/init'),
  list: (params: RoleListParams) => request.post<PaginatedResponse<RoleListItem>>('/api/admin/Role/list', params),
  add: (params: RoleAddPayload) => request.post<void>('/api/admin/Role/add', params),
  edit: (params: RoleEditPayload) => request.post<void>('/api/admin/Role/edit', params),
  del: (params: { id: Id | Id[] }) => request.post<void>('/api/admin/Role/del', params),
  default: (params: { id: number }) => request.post<void>('/api/admin/Role/default', params),
}
