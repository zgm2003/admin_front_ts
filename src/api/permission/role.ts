import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'
import type { PermissionTreeNode } from './permission'

export interface RoleInitResponse {
  dict: {
    permission_tree: PermissionTreeNode[]
    permission_platform_arr: DictOption<string>[]
  }
}

export interface RoleListParams {
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

function normalizeRoleIDs(id: Id | Id[]): number[] {
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

  return ids
}

export const RoleApi = {
  init: () => request.get<RoleInitResponse>(`${ADMIN_API_PREFIX}/roles/init`),
  list: (params: RoleListParams) => request.get<PaginatedResponse<RoleListItem>>(`${ADMIN_API_PREFIX}/roles`, { params }),
  add: (params: RoleAddPayload) => request.post<void, RoleAddPayload>(`${ADMIN_API_PREFIX}/roles`, params),
  edit: (params: RoleEditPayload) => {
    const { id, ...body } = params
    return request.put<void, RoleAddPayload>(`${ADMIN_API_PREFIX}/roles/${id}`, body)
  },
  del: (params: { id: Id | Id[] }) => {
    const ids = normalizeRoleIDs(params.id)
    if (ids.length === 1) {
      return request.delete<void>(`${ADMIN_API_PREFIX}/roles/${ids[0]}`)
    }
    const body: RoleBatchDeletePayload = { ids }
    return request.delete<void, RoleBatchDeletePayload>(`${ADMIN_API_PREFIX}/roles`, { data: body })
  },
  default: (params: { id: number }) =>
    request.patch<void>(`${ADMIN_API_PREFIX}/roles/${params.id}/default`),
}
