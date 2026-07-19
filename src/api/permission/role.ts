import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import { adminOperations } from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'
import {
  isPermissionPlatform,
  parsePermissionTree,
  type PermissionPlatform,
  type PermissionTreeNode,
} from './permission'

export interface RoleInitResponse {
  dict: {
    permission_tree: PermissionTreeNode[]
    permission_platform_arr: DictOption<PermissionPlatform>[]
  }
}

export interface RoleListParams {
  current_page: number
  page_size: number
  name?: string
}

export type RoleListItem = components['schemas']['Go_internal_module_role_ListItem_Output']
export type RoleListResponse = components['schemas']['Go_internal_module_role_ListResponse_Output']
export type RoleCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export interface RoleAddPayload {
  name: string
  permission_id: number[]
}

export interface RoleEditPayload extends RoleAddPayload {
  id: number
}

export interface RoleBatchDeletePayload {
  ids: number[]
}

export interface RoleDeleteOnePayload {
  id: Id
}

function normalizeRoleIDs(id: Id | Id[]): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('role id must be a positive integer')
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  const first = ids[0]
  if (first === undefined) throw new Error('role ids must not be empty')
  return [first, ...ids.slice(1)]
}

const pageInit = async (options: ExecuteOptions = {}): Promise<RoleInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_roles_page_init, {}, options)
  const permissionPlatformArr = response.dict.permission_platform_arr.map((option) => {
    if (!isPermissionPlatform(option.value)) throw new Error('role platform dictionary violates the editable contract')
    return { label: option.label, value: option.value }
  })
  return {
    dict: {
      permission_tree: parsePermissionTree(response.dict.permission_tree),
      permission_platform_arr: permissionPlatformArr,
    },
  }
}
const create = (params: RoleAddPayload, options: ExecuteOptions = {}): Promise<RoleCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_roles, { body: params }, options)
const update = async (params: RoleEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_roles_id, {
    path: { id },
    body,
  }, options)
}
const deleteOne = async (params: RoleDeleteOnePayload, options: ExecuteOptions = {}): Promise<void> => {
  const [id] = normalizeRoleIDs(params.id)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_roles_id, { path: { id } }, options)
}
const deleteBatch = async (params: RoleBatchDeletePayload, options: ExecuteOptions = {}): Promise<void> => {
  const ids = normalizeRoleIDs(params.ids)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_roles, { body: { ids } }, options)
}

export const RoleApi = {
  pageInit,
  list: (params: RoleListParams, options: ExecuteOptions = {}): Promise<RoleListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_roles, { query: params }, options),
  create,
  update,
  deleteOne,
  deleteBatch,
  async default(params: { id: number }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_roles_id_default, {
      path: { id: params.id },
    }, options)
  },
}
