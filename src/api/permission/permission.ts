import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
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

const pageInit = () => request.get<PermissionInitResponse>(`${ADMIN_API_PREFIX}/permissions/page-init`)
const create = (params: PermissionMutationPayload) => request.post<PermissionCreateResponse, PermissionMutationPayload>(`${ADMIN_API_PREFIX}/permissions`, params)
const update = (params: PermissionEditPayload) => {
  const { id, ...body } = params
  return request.put<void, PermissionMutationPayload>(`${ADMIN_API_PREFIX}/permissions/${id}`, body)
}
const deleteOne = (params: PermissionDeleteOnePayload) => request.delete<void>(`${ADMIN_API_PREFIX}/permissions/${params.id}`)
const deleteBatch = (params: PermissionBatchDeletePayload) => request.delete<void, PermissionBatchDeletePayload>(`${ADMIN_API_PREFIX}/permissions`, { data: params })
const changeStatus = (params: PermissionStatusPayload) => {
  const body: PermissionStatusBody = { status: params.status }
  return request.patch<void, PermissionStatusBody>(`${ADMIN_API_PREFIX}/permissions/${params.id}/status`, body)
}

export const PermissionApi = {
  pageInit,
  list: (params: PermissionListParams) => request.get<PermissionListItem[]>(`${ADMIN_API_PREFIX}/permissions`, { params }),
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
  init: pageInit,
  add: create,
  edit: update,
  delOne: deleteOne,
  delBatch: deleteBatch,
  del: deleteOne,
  status: changeStatus,
}
