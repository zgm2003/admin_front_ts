import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'

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

type SystemSettingListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_system_settings'>['query']>

type SystemSettingContractItem = components['schemas']['Go_internal_module_systemsetting_ListItem_Output']
export interface SystemSettingItem extends Omit<SystemSettingContractItem, 'value_type' | 'status'> {
  value_type: SystemSettingValueType
  status: SystemSettingStatus
}
export interface SystemSettingListResponse extends Omit<components['schemas']['Go_internal_module_systemsetting_ListResponse_Output'], 'list'> {
  list: SystemSettingItem[]
}

export type SystemSettingAddParams = NonNullable<AdminOperationInput<'post_api_admin_v1_system_settings'>['body']>

export type SystemSettingCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export type SystemSettingEditParams = NonNullable<AdminOperationInput<'put_api_admin_v1_system_settings_id'>['body']> & { id: number }

export interface SystemSettingBatchDeletePayload {
  ids: number[]
}

export interface SystemSettingStatusPayload {
  id: Id
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

function normalizeSystemSettingIDs(id: Id | Id[]): [number, ...number[]] {
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

  const first = ids[0]
  if (first === undefined) throw new Error('system setting ids must not be empty')
  return [first, ...ids.slice(1)]
}

function isValueType(value: number): value is SystemSettingValueType {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function toSystemSettingItem(item: SystemSettingContractItem): SystemSettingItem {
  if (!isValueType(item.value_type) || (item.status !== 1 && item.status !== 2)) {
    throw new Error('system setting list item violates the editable contract')
  }
  return { ...item, value_type: item.value_type, status: item.status }
}

const pageInit = async (options: ExecuteOptions = {}): Promise<SystemSettingInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_system_settings_page_init, {}, options)
  const values = response.dict.system_setting_value_type_arr.map((option) => {
    if (!isValueType(option.value)) throw new Error('system setting type dictionary violates the editable contract')
    return { label: option.label, value: option.value }
  })
  return { dict: { system_setting_value_type_arr: values } }
}
const create = (params: SystemSettingAddParams, options: ExecuteOptions = {}): Promise<SystemSettingCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_system_settings, { body: params }, options)
const update = async (params: SystemSettingEditParams, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_system_settings_id, {
    path: { id: normalizeSystemSettingIDs(id)[0] },
    body,
  }, options)
}
const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_system_settings_id, {
    path: { id: normalizeSystemSettingIDs(params.id)[0] },
  }, options)
}
const deleteBatch = async (params: SystemSettingBatchDeletePayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_system_settings, {
    body: { ids: normalizeSystemSettingIDs(params.ids) },
  }, options)
}
const changeStatus = async (params: SystemSettingStatusPayload, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_system_settings_id_status, {
    path: { id: normalizeSystemSettingIDs(params.id)[0] },
    body: { status: params.status },
  }, options)
}

export const SystemSettingApi = {
  pageInit,
  list: async (params: SystemSettingListParams, options: ExecuteOptions = {}): Promise<SystemSettingListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_system_settings, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toSystemSettingItem), page: response.page }
  },
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
}
