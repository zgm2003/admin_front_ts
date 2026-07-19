import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export * from './uploadConfig.types'

import type {
  UploadCommonStatus,
  UploadDriverAddPayload,
  UploadDriverEditPayload,
  UploadDriverInitResponse,
  UploadDriverItem,
  UploadDriverListParams,
  UploadDriverListQueryParams,
  UploadFileExt,
  UploadImageExt,
  UploadRuleAddPayload,
  UploadRuleContractItem,
  UploadRuleEditPayload,
  UploadRuleInitResponse,
  UploadRuleItem,
  UploadRuleListParams,
  UploadRuleListQueryParams,
  UploadSettingAddPayload,
  UploadSettingEditPayload,
  UploadSettingInitResponse,
  UploadSettingItem,
  UploadSettingListParams,
  UploadSettingListQueryParams,
} from './uploadConfig.types'

function normalizeDriverListParams(params: UploadDriverListParams): UploadDriverListQueryParams {
  const query: UploadDriverListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.driver === undefined || params.driver === '') return query
  if (params.driver !== 'cos') throw new Error('upload driver filter violates the contract')
  query.driver = params.driver

  return query
}

function normalizeRuleListParams(params: UploadRuleListParams): UploadRuleListQueryParams {
  const query: UploadRuleListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.title) {
    query.title = params.title
  }

  return query
}

function normalizeSettingListParams(params: UploadSettingListParams): UploadSettingListQueryParams {
  const query: UploadSettingListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.remark) {
    query.remark = params.remark
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  const driverID = normalizeOptionalPositiveInteger(params.driver_id, 'driver_id')
  if (driverID !== undefined) {
    query.driver_id = driverID
  }
  const ruleID = normalizeOptionalPositiveInteger(params.rule_id, 'rule_id')
  if (ruleID !== undefined) {
    query.rule_id = ruleID
  }

  return query
}

function normalizeOptionalPositiveInteger(
  value: number | '' | undefined,
  field: 'driver_id' | 'rule_id',
): number | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`)
  }
  return value
}

function normalizeIDs(id: Id | Id[], label: string): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} id must be a positive integer`)
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  const first = ids[0]
  if (first === undefined) throw new Error(`${label} ids must not be empty`)
  return [first, ...ids.slice(1)]
}

function toUploadDriver(item: components['schemas']['Go_internal_module_uploadconfig_DriverItem_Output']): UploadDriverItem {
  if (item.driver !== 'cos') throw new Error('upload driver item violates the supported contract')
  return { ...item, driver: item.driver }
}

function toUploadSetting(item: components['schemas']['Go_internal_module_uploadconfig_SettingItem_Output']): UploadSettingItem {
  if (item.status !== 1 && item.status !== 2) throw new Error('upload setting item status violates the contract')
  return { ...item, status: item.status }
}

const allowedImageExts: readonly string[] = [
  'svg', 'doc', 'jpeg', 'jpg', 'gif', 'ico', 'webp', 'png', 'bmp', 'tif', 'tiff', 'jfif', 'pjpeg',
]
const allowedFileExts: readonly string[] = [
  'html', 'docx', 'pdf', 'txt', 'zip', 'tar', 'doc', 'css', 'csv', 'ppt', 'xlsx', 'xls', 'xml',
]

function isUploadImageExt(value: string): value is UploadImageExt {
  return allowedImageExts.includes(value)
}

function isUploadFileExt(value: string): value is UploadFileExt {
  return allowedFileExts.includes(value)
}

function toUploadRule(item: UploadRuleContractItem): UploadRuleItem {
  if (!item.image_exts.every(isUploadImageExt) || !item.file_exts.every(isUploadFileExt)) {
    throw new Error('upload rule item extensions violate the contract')
  }
  return { ...item, image_exts: item.image_exts, file_exts: item.file_exts }
}

const driverPageInit = async (options: ExecuteOptions = {}): Promise<UploadDriverInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_drivers_page_init, {}, options)
  const drivers = response.dict.upload_driver_arr.map((option) => {
    if (option.value !== 'cos') throw new Error('upload driver dictionary violates the supported contract')
    return { label: option.label, value: 'cos' as const }
  })
  return { dict: { upload_driver_arr: drivers } }
}
const createDriver = (params: UploadDriverAddPayload, options: ExecuteOptions = {}): Promise<{ id: number }> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_upload_drivers, { body: params }, options)
const updateDriver = async (params: UploadDriverEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_upload_drivers_id, {
    path: { id: normalizeIDs(id, 'upload driver')[0] },
    body,
  }, options)
}
const deleteDriverOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_drivers_id, {
    path: { id: normalizeIDs(params.id, 'upload driver')[0] },
  }, options)
}
const deleteDriverBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_drivers, {
    body: { ids: normalizeIDs(params.ids, 'upload driver') },
  }, options)
}

export const UploadDriverApi = {
  pageInit: driverPageInit,
  list: async (params: UploadDriverListParams, options: ExecuteOptions = {}) => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_drivers, {
      query: normalizeDriverListParams(params),
    }, options)
    return { list: response.list.map(toUploadDriver), page: response.page }
  },
  create: createDriver,
  update: updateDriver,
  deleteOne: deleteDriverOne,
  deleteBatch: deleteDriverBatch,
}

const rulePageInit = async (options: ExecuteOptions = {}): Promise<UploadRuleInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_rules_page_init, {}, options)
  const imageExts = response.dict.upload_image_ext_arr.map((option) => {
    if (!isUploadImageExt(option.value)) throw new Error('upload image extension dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  const fileExts = response.dict.upload_file_ext_arr.map((option) => {
    if (!isUploadFileExt(option.value)) throw new Error('upload file extension dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  return { dict: { upload_image_ext_arr: imageExts, upload_file_ext_arr: fileExts } }
}
const createRule = (params: UploadRuleAddPayload, options: ExecuteOptions = {}): Promise<{ id: number }> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_upload_rules, { body: params }, options)
const updateRule = async (params: UploadRuleEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_upload_rules_id, {
    path: { id: normalizeIDs(id, 'upload rule')[0] },
    body,
  }, options)
}
const deleteRuleOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_rules_id, {
    path: { id: normalizeIDs(params.id, 'upload rule')[0] },
  }, options)
}
const deleteRuleBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_rules, {
    body: { ids: normalizeIDs(params.ids, 'upload rule') },
  }, options)
}

export const UploadRuleApi = {
  pageInit: rulePageInit,
  list: async (params: UploadRuleListParams, options: ExecuteOptions = {}) => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_rules, {
      query: normalizeRuleListParams(params),
    }, options)
    return { list: response.list.map(toUploadRule), page: response.page }
  },
  create: createRule,
  update: updateRule,
  deleteOne: deleteRuleOne,
  deleteBatch: deleteRuleBatch,
}

const settingPageInit = async (options: ExecuteOptions = {}): Promise<UploadSettingInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_settings_page_init, {}, options)
  const statuses = response.dict.common_status_arr.map((option) => {
    if (option.value !== 1 && option.value !== 2) throw new Error('upload setting status dictionary violates the contract')
    return { label: option.label, value: option.value as UploadCommonStatus }
  })
  return {
    dict: {
      upload_driver_list: response.dict.upload_driver_list,
      upload_rule_list: response.dict.upload_rule_list,
      common_status_arr: statuses,
    },
  }
}
const createSetting = (params: UploadSettingAddPayload, options: ExecuteOptions = {}): Promise<{ id: number }> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_upload_settings, { body: params }, options)
const updateSetting = async (params: UploadSettingEditPayload, options: ExecuteOptions = {}): Promise<void> => {
  const { id, ...body } = params
  await executeAdminOperation(adminOperations.put_api_admin_v1_upload_settings_id, {
    path: { id: normalizeIDs(id, 'upload setting')[0] },
    body,
  }, options)
}
const deleteSettingOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_settings_id, {
    path: { id: normalizeIDs(params.id, 'upload setting')[0] },
  }, options)
}
const deleteSettingBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_upload_settings, {
    body: { ids: normalizeIDs(params.ids, 'upload setting') },
  }, options)
}
const changeSettingStatus = async (params: { id: Id; status: UploadCommonStatus }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_upload_settings_id_status, {
    path: { id: normalizeIDs(params.id, 'upload setting')[0] },
    body: { status: params.status },
  }, options)
}

export const UploadSettingApi = {
  pageInit: settingPageInit,
  list: async (params: UploadSettingListParams, options: ExecuteOptions = {}) => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_upload_settings, {
      query: normalizeSettingListParams(params),
    }, options)
    return { list: response.list.map(toUploadSetting), page: response.page }
  },
  create: createSetting,
  update: updateSetting,
  deleteOne: deleteSettingOne,
  deleteBatch: deleteSettingBatch,
  changeStatus: changeSettingStatus,
}
