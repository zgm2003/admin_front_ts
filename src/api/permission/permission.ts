import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption } from '@/types/common'

export type PermissionListParams = NonNullable<AdminOperationInput<'get_api_admin_v1_permissions'>['query']>
export type PermissionMutationPayload = NonNullable<AdminOperationInput<'post_api_admin_v1_permissions'>['body']>
export type PermissionPlatform = PermissionListParams['platform']
export type PermissionType = PermissionMutationPayload['type']
export type PermissionStatus = NonNullable<AdminOperationInput<'patch_api_admin_v1_permissions_id_status'>['body']>['status']

type PermissionTreeContract = components['schemas']['Go_internal_module_permission_PermissionTreeNode_Output']
export interface PermissionTreeNode extends Omit<PermissionTreeContract, 'platform' | 'type' | 'children'> {
  platform: PermissionPlatform
  type: PermissionType
  children?: PermissionTreeNode[]
}

export interface PermissionInitResponse {
  dict: {
    permission_tree: PermissionTreeNode[]
    permission_type_arr: DictOption<PermissionType>[]
    permission_platform_arr: DictOption<PermissionPlatform>[]
  }
}

type PermissionListContract = components['schemas']['Go_internal_module_permission_PermissionListItem_Output']
export interface PermissionListItem extends Omit<PermissionListContract, 'type' | 'show_menu' | 'status' | 'children'> {
  type: PermissionType
  show_menu: 1 | 2
  status: PermissionStatus
  children?: PermissionListItem[]
}


export interface PermissionEditPayload extends PermissionMutationPayload {
  id: number
}

export type PermissionCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export interface PermissionDeleteOnePayload {
  id: number
}

export interface PermissionBatchDeletePayload {
  ids: number[]
}

export interface PermissionStatusPayload {
  id: number
  status: PermissionStatus
}

export function isPermissionPlatform(value: string): value is PermissionPlatform {
  return value === 'admin' || value === 'app' || value === 'canvas'
}

function isPermissionType(value: number): value is PermissionType {
  return value === 1 || value === 2 || value === 3
}

function isBinaryStatus(value: number): value is 1 | 2 {
  return value === 1 || value === 2
}

function toPermissionTreeNode(node: PermissionTreeContract): PermissionTreeNode {
  if (!isPermissionPlatform(node.platform) || !isPermissionType(node.type)) {
    throw new Error('permission tree node violates the editable contract')
  }
  return {
    ...node,
    platform: node.platform,
    type: node.type,
    children: node.children?.map(toPermissionTreeNode),
  }
}

export function parsePermissionTree(nodes: readonly PermissionTreeContract[]): PermissionTreeNode[] {
  return nodes.map(toPermissionTreeNode)
}

function toPermissionListItem(item: PermissionListContract): PermissionListItem {
  if (!isPermissionType(item.type) || !isBinaryStatus(item.show_menu) || !isBinaryStatus(item.status)) {
    throw new Error('permission list item violates the editable contract')
  }
  return {
    ...item,
    type: item.type,
    show_menu: item.show_menu,
    status: item.status,
    children: item.children?.map(toPermissionListItem),
  }
}

const pageInit = async (options: ExecuteOptions = {}): Promise<PermissionInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_permissions_page_init, {}, options)
  const permissionTypeArr = response.dict.permission_type_arr.map((option) => {
    if (!isPermissionType(option.value)) throw new Error('permission type dictionary violates the editable contract')
    return { label: option.label, value: option.value }
  })
  const permissionPlatformArr = response.dict.permission_platform_arr.map((option) => {
    if (!isPermissionPlatform(option.value)) throw new Error('permission platform dictionary violates the editable contract')
    return { label: option.label, value: option.value }
  })
  return {
    dict: {
      permission_tree: parsePermissionTree(response.dict.permission_tree),
      permission_type_arr: permissionTypeArr,
      permission_platform_arr: permissionPlatformArr,
    },
  }
}
const create = (params: PermissionMutationPayload, options: ExecuteOptions = {}): Promise<PermissionCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_permissions, { body: params }, options)
const update = async (params: PermissionEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_permissions_id, {
    path: { id },
    body,
  }, options)
}
const deleteOne = async (params: PermissionDeleteOnePayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_permissions_id, {
    path: { id: params.id },
  }, options)
}
const deleteBatch = async (params: PermissionBatchDeletePayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_permissions, { body: params }, options)
}
const changeStatus = async (params: PermissionStatusPayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_permissions_id_status, {
    path: { id: params.id },
    body: { status: params.status },
  }, options)
}

export const PermissionApi = {
  pageInit,
  list: async (params: PermissionListParams, options: ExecuteOptions = {}): Promise<PermissionListItem[]> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_permissions, { query: params }, options)
    return response.map(toPermissionListItem)
  },
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
}
