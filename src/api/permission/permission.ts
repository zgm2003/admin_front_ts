import request from '@/lib/http'
import type { DictOption } from '@/types/common'

export interface PermissionTreeNode {
  id: number
  label: string
  value: number
  parent_id: number
  platform: string
  type: number
  code?: string
  disabled?: boolean
  children?: PermissionTreeNode[]
}

export interface PermissionInitResponse {
  dict: {
    permission_tree: PermissionTreeNode[]
    permission_type_arr: DictOption<number>[]
    permission_platform_arr: DictOption<string>[]
  }
}

export interface PermissionListParams {
  platform: string
  name?: string
  path?: string
  type?: number
}

export interface PermissionListItem {
  id: number
  name: string
  path: string
  parent_id: number
  icon: string
  component: string
  status: number
  type: number
  type_name: string
  code: string
  i18n_key: string
  sort: number
  show_menu: number
  children?: PermissionListItem[]
}

export interface PermissionMutationPayload {
  name: string
  parent_id: number
  icon?: string
  path?: string
  component?: string
  type: number
  code?: string
  i18n_key?: string
  sort: number
  show_menu?: number
  platform: string
}

export interface PermissionEditPayload extends PermissionMutationPayload {
  id: number
}

export interface PermissionCreateResponse {
  id: number
}

export interface PermissionDeleteOnePayload {
  id: number
}

export interface PermissionBatchDeletePayload {
  ids: number[]
}

export interface PermissionStatusPayload {
  id: number
  status: number
}

export interface PermissionStatusBody {
  status: number
}

export const PermissionApi = {
  init: () => request.get<PermissionInitResponse>('/api/admin/v1/permissions/init'),
  list: (params: PermissionListParams) => request.get<PermissionListItem[]>('/api/admin/v1/permissions', { params }),
  add: (params: PermissionMutationPayload) => request.post<PermissionCreateResponse, PermissionMutationPayload>('/api/admin/v1/permissions', params),
  edit: (params: PermissionEditPayload) => {
    const { id, ...body } = params
    return request.put<void, PermissionMutationPayload>(`/api/admin/v1/permissions/${id}`, body)
  },
  delOne: (params: PermissionDeleteOnePayload) => request.delete<void>(`/api/admin/v1/permissions/${params.id}`),
  delBatch: (params: PermissionBatchDeletePayload) => request.delete<void, PermissionBatchDeletePayload>('/api/admin/v1/permissions', { data: params }),
  status: (params: PermissionStatusPayload) => {
    const body: PermissionStatusBody = { status: params.status }
    return request.patch<void, PermissionStatusBody>(`/api/admin/v1/permissions/${params.id}/status`, body)
  },
}

