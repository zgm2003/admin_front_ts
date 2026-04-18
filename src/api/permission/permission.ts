import request from '@/lib/http'
import type { DictOption, Id, RequestPayload } from '@/types/common'

export interface PermissionTreeNode extends Record<string, unknown> {
  id: number
  label: string
  value: number
  parent_id: number
  platform: string
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

export interface PermissionListParams extends RequestPayload {
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

export interface PermissionMutationPayload extends RequestPayload {
  id?: number
  name: string
  parent_id?: number | ''
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

export interface PermissionBatchEditPayload extends RequestPayload {
  ids: number[]
  field: string
  description?: string
}

export interface PermissionDeletePayload extends RequestPayload {
  id: Id | Id[]
}

export interface PermissionStatusPayload extends RequestPayload {
  id: number
  status: number
}

export interface AppButtonListParams extends RequestPayload {
  platform: string
  name?: string
  code?: string
}

export interface AppButtonItem {
  id: number
  name: string
  status: number
  code: string
  sort: number
  platform: string
  platform_name: string
}

export interface AppButtonMutationPayload extends RequestPayload {
  id?: number
  name: string
  code: string
  sort: number
  platform: string
  type: number
}

export const PermissionApi = {
  init: () => request.post<PermissionInitResponse>('/api/admin/Permission/init'),
  list: (params: PermissionListParams) => request.post<PermissionListItem[]>('/api/admin/Permission/list', params),
  add: (params: PermissionMutationPayload) => request.post<void>('/api/admin/Permission/add', params),
  edit: (params: PermissionMutationPayload) => request.post<void>('/api/admin/Permission/edit', params),
  del: (params: PermissionDeletePayload) => request.post<void>('/api/admin/Permission/del', params),
  batchEdit: (params: PermissionBatchEditPayload) => request.post<void>('/api/admin/Permission/batchEdit', params),
  status: (params: PermissionStatusPayload) => request.post<void>('/api/admin/Permission/status', params),
  // APP/H5/小程序 按钮权限
  appButtonList: (params: AppButtonListParams) => request.post<AppButtonItem[]>('/api/admin/Permission/appButtonList', params),
  appButtonAdd: (params: AppButtonMutationPayload) => request.post<void>('/api/admin/Permission/appButtonAdd', params),
  appButtonEdit: (params: AppButtonMutationPayload) => request.post<void>('/api/admin/Permission/appButtonEdit', params),
  appButtonStatus: (params: PermissionStatusPayload) => request.post<void>('/api/admin/Permission/appButtonStatus', params),
  appButtonDel: (params: PermissionDeletePayload) => request.post<void>('/api/admin/Permission/appButtonDel', params),
}
