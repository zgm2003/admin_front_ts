import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type UploadDriverType = 'cos'
export type UploadCommonStatus = 1 | 2

export interface UploadDriverInitResponse {
  dict: {
    upload_driver_arr: DictOption<UploadDriverType>[]
  }
}

export interface UploadDriverListParams {
  current_page: number
  page_size: number
  driver?: UploadDriverType | string
}

interface UploadDriverListQueryParams {
  current_page: number
  page_size: number
  driver?: UploadDriverType
}

export interface UploadDriverItem {
  id: number
  driver: UploadDriverType
  driver_show: string
  secret_id_hint: string
  secret_key_hint: string
  bucket: string
  region: string
  role_arn: string | null
  appid: string | null
  endpoint: string | null
  bucket_domain: string | null
  created_at: string
  updated_at: string
}

interface UploadDriverBasePayload {
  driver: UploadDriverType
  bucket: string
  region: string
  role_arn?: string
  appid?: string
  endpoint?: string
  bucket_domain?: string
}

export interface UploadDriverFormState extends Omit<UploadDriverBasePayload, 'driver'> {
  id: number | ''
  driver: UploadDriverType | ''
  secret_id: string
  secret_key: string
}

export interface UploadDriverAddPayload extends UploadDriverBasePayload {
  secret_id: string
  secret_key: string
}

export interface UploadDriverEditPayload extends UploadDriverBasePayload {
  id: number
  secret_id?: string
  secret_key?: string
}

export type UploadDriverForm = UploadDriverAddPayload | UploadDriverEditPayload

export interface UploadRuleInitResponse {
  dict: {
    upload_image_ext_arr: DictOption<string>[]
    upload_file_ext_arr: DictOption<string>[]
  }
}

export interface UploadRuleListParams {
  current_page: number
  page_size: number
  title?: string
}

interface UploadRuleListQueryParams {
  current_page: number
  page_size: number
  title?: string
}

export interface UploadRuleItem {
  id: number
  title: string
  max_size_mb: number
  image_exts: string[]
  file_exts: string[]
  created_at: string
  updated_at: string
}

export interface UploadRuleAddPayload {
  title: string
  max_size_mb: number
  image_exts: string[]
  file_exts: string[]
}

export interface UploadRuleEditPayload extends UploadRuleAddPayload {
  id: number
}

export type UploadRuleForm = UploadRuleAddPayload | UploadRuleEditPayload

export interface UploadSettingInitResponse {
  dict: {
    upload_driver_list: DictOption<number>[]
    upload_rule_list: DictOption<number>[]
    common_status_arr: DictOption<UploadCommonStatus>[]
  }
}

export interface UploadSettingListParams {
  current_page: number
  page_size: number
  remark?: string
  status?: UploadCommonStatus | ''
  driver_id?: number | string
  rule_id?: number | string
}

interface UploadSettingListQueryParams {
  current_page: number
  page_size: number
  remark?: string
  status?: UploadCommonStatus
  driver_id?: number
  rule_id?: number
}

export interface UploadSettingItem {
  id: number
  driver_id: number
  rule_id: number
  driver_name: string
  rule_name: string
  status: UploadCommonStatus
  status_name: string
  remark: string
  created_at: string
  updated_at: string
}

export interface UploadSettingAddPayload {
  driver_id: number
  rule_id: number
  status: UploadCommonStatus
  remark?: string
}

export interface UploadSettingFormState {
  id: number | ''
  driver_id: number | ''
  rule_id: number | ''
  status: UploadCommonStatus
  remark: string
}

export interface UploadSettingEditPayload extends UploadSettingAddPayload {
  id: number
}

export type UploadSettingForm = UploadSettingAddPayload | UploadSettingEditPayload

interface BatchDeletePayload {
  ids: number[]
}

interface StatusPayload {
  status: UploadCommonStatus
}

const DRIVER_BASE = `${ADMIN_API_PREFIX}/upload-drivers`
const RULE_BASE = `${ADMIN_API_PREFIX}/upload-rules`
const SETTING_BASE = `${ADMIN_API_PREFIX}/upload-settings`

function normalizeDriverListParams(params: UploadDriverListParams): UploadDriverListQueryParams {
  const query: UploadDriverListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.driver === 'cos') {
    query.driver = params.driver
  }

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
  const driverID = normalizeOptionalPositiveInteger(params.driver_id)
  if (driverID !== undefined) {
    query.driver_id = driverID
  }
  const ruleID = normalizeOptionalPositiveInteger(params.rule_id)
  if (ruleID !== undefined) {
    query.rule_id = ruleID
  }

  return query
}

function normalizeOptionalPositiveInteger(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number(trimmed)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }
  return undefined
}

function normalizeIDs(id: Id | Id[], label: string): number[] {
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

  return ids
}

function deleteResource(base: string, params: { id: Id | Id[] }, label: string) {
  const ids = normalizeIDs(params.id, label)
  if (ids.length === 1) {
    return request.delete<void>(`${base}/${ids[0]}`)
  }

  const body: BatchDeletePayload = { ids }
  return request.delete<void, BatchDeletePayload>(base, { data: body })
}

const driverPageInit = () => request.get<UploadDriverInitResponse>(`${DRIVER_BASE}/page-init`)
const createDriver = (params: UploadDriverAddPayload) => request.post<{ id: number }, UploadDriverAddPayload>(DRIVER_BASE, params)
const updateDriver = (params: UploadDriverEditPayload) => {
  const { id, ...body } = params
  return request.put<void, Omit<UploadDriverEditPayload, 'id'>>(`${DRIVER_BASE}/${id}`, body)
}
const deleteDriverOne = (params: { id: Id }) => deleteResource(DRIVER_BASE, params, 'upload driver')
const deleteDriverBatch = (params: { ids: Id[] }) => deleteResource(DRIVER_BASE, { id: params.ids }, 'upload driver')

export const UploadDriverApi = {
  pageInit: driverPageInit,
  list: (params: UploadDriverListParams) => request.get<PaginatedResponse<UploadDriverItem>>(DRIVER_BASE, { params: normalizeDriverListParams(params) }),
  create: createDriver,
  update: updateDriver,
  deleteOne: deleteDriverOne,
  deleteBatch: deleteDriverBatch,
}

const rulePageInit = () => request.get<UploadRuleInitResponse>(`${RULE_BASE}/page-init`)
const createRule = (params: UploadRuleAddPayload) => request.post<{ id: number }, UploadRuleAddPayload>(RULE_BASE, params)
const updateRule = (params: UploadRuleEditPayload) => {
  const { id, ...body } = params
  return request.put<void, UploadRuleAddPayload>(`${RULE_BASE}/${id}`, body)
}
const deleteRuleOne = (params: { id: Id }) => deleteResource(RULE_BASE, params, 'upload rule')
const deleteRuleBatch = (params: { ids: Id[] }) => deleteResource(RULE_BASE, { id: params.ids }, 'upload rule')

export const UploadRuleApi = {
  pageInit: rulePageInit,
  list: (params: UploadRuleListParams) => request.get<PaginatedResponse<UploadRuleItem>>(RULE_BASE, { params: normalizeRuleListParams(params) }),
  create: createRule,
  update: updateRule,
  deleteOne: deleteRuleOne,
  deleteBatch: deleteRuleBatch,
}

const settingPageInit = () => request.get<UploadSettingInitResponse>(`${SETTING_BASE}/page-init`)
const createSetting = (params: UploadSettingAddPayload) => request.post<{ id: number }, UploadSettingAddPayload>(SETTING_BASE, params)
const updateSetting = (params: UploadSettingEditPayload) => {
  const { id, ...body } = params
  return request.put<void, UploadSettingAddPayload>(`${SETTING_BASE}/${id}`, body)
}
const deleteSettingOne = (params: { id: Id }) => deleteResource(SETTING_BASE, params, 'upload setting')
const deleteSettingBatch = (params: { ids: Id[] }) => deleteResource(SETTING_BASE, { id: params.ids }, 'upload setting')
const changeSettingStatus = (params: { id: Id; status: UploadCommonStatus }) => {
  const ids = normalizeIDs(params.id, 'upload setting')
  const body: StatusPayload = { status: params.status }
  return request.patch<void, StatusPayload>(`${SETTING_BASE}/${ids[0]}/status`, body)
}

export const UploadSettingApi = {
  pageInit: settingPageInit,
  list: (params: UploadSettingListParams) => request.get<PaginatedResponse<UploadSettingItem>>(SETTING_BASE, { params: normalizeSettingListParams(params) }),
  create: createSetting,
  update: updateSetting,
  deleteOne: deleteSettingOne,
  deleteBatch: deleteSettingBatch,
  changeStatus: changeSettingStatus,
}
