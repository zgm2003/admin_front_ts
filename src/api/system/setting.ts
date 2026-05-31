import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type SystemSettingValueType = 1 | 2 | 3 | 4
export type SystemSettingStatus = 1 | 2

export interface SystemSettingInitResponse {
  dict: {
    system_setting_value_type_arr: DictOption<SystemSettingValueType>[]
  }
}

export interface SystemSettingListParams {
  current_page: number
  page_size: number
  key?: string
  status?: SystemSettingStatus | ''
}

interface SystemSettingListQueryParams {
  current_page: number
  page_size: number
  key?: string
  status?: SystemSettingStatus
}

export interface SystemSettingItem {
  id: number
  setting_key: string
  setting_value: string
  value_type: SystemSettingValueType
  value_type_name: string
  remark: string
  status: SystemSettingStatus
  status_name: string
  is_del: number
  created_at: string
  updated_at: string
}

export interface SystemSettingAddParams {
  key: string
  value: string
  type: SystemSettingValueType
  remark?: string
}

export interface SystemSettingCreateResponse {
  id: number
}

export interface SystemSettingEditParams {
  id: number
  value: string
  type: SystemSettingValueType
  remark?: string
}

export interface SystemSettingBatchDeletePayload {
  ids: number[]
}

export interface SystemSettingStatusPayload {
  id: Id
  status: SystemSettingStatus
}

interface SystemSettingStatusBody {
  status: SystemSettingStatus
}

function normalizeListParams(params: SystemSettingListParams): SystemSettingListQueryParams {
  const query: SystemSettingListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.key) {
    query.key = params.key
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }

  return query
}

function normalizeSystemSettingIDs(id: Id | Id[]): number[] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('system setting id must be a positive integer')
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  return ids
}

const BASE = `${ADMIN_API_PREFIX}/system-settings`

const pageInit = () => request.get<SystemSettingInitResponse>(`${BASE}/page-init`)
const create = (params: SystemSettingAddParams) => request.post<SystemSettingCreateResponse, SystemSettingAddParams>(BASE, params)
const update = (params: SystemSettingEditParams) => {
  const { id, ...body } = params
  return request.put<void, Omit<SystemSettingEditParams, 'id'>>(`${BASE}/${id}`, body)
}
const deleteOne = (params: { id: Id }) => request.delete<void>(`${BASE}/${normalizeSystemSettingIDs(params.id)[0]}`)
const deleteBatch = (params: SystemSettingBatchDeletePayload) => {
  const body: SystemSettingBatchDeletePayload = { ids: normalizeSystemSettingIDs(params.ids) }
  return request.delete<void, SystemSettingBatchDeletePayload>(BASE, { data: body })
}
const del = (params: { id: Id | Id[] }) => {
  const ids = normalizeSystemSettingIDs(params.id)
  if (ids.length === 1 && ids[0] !== undefined) {
    return deleteOne({ id: ids[0] })
  }
  return deleteBatch({ ids })
}
const changeStatus = (params: SystemSettingStatusPayload) => {
    if (typeof params.id !== 'number' || !Number.isInteger(params.id) || params.id <= 0) {
      throw new Error('system setting id must be a positive integer')
    }
    const body: SystemSettingStatusBody = { status: params.status }
    return request.patch<void, SystemSettingStatusBody>(`${BASE}/${params.id}/status`, body)
}

export const SystemSettingApi = {
  pageInit,
  list: (params: SystemSettingListParams) => request.get<PaginatedResponse<SystemSettingItem>>(BASE, { params: normalizeListParams(params) }),
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
  init: pageInit,
  add: create,
  edit: update,
  del,
  status: changeStatus,
}
