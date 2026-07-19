import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'

export type SmsCommonStatus = 1 | 2
export type SmsLogStatus = 1 | 2 | 3
export type SmsTemplateScene = 'login' | 'forget' | 'bind_phone' | 'change_password'
export type SmsLogScene = SmsTemplateScene | 'test'
export type SmsRegion = 'ap-guangzhou'

export interface SmsPageInitResponse {
  dict: {
    common_status_arr: DictOption<SmsCommonStatus>[]
    sms_scene_arr: DictOption<SmsTemplateScene>[]
    sms_log_scene_arr: DictOption<SmsLogScene>[]
    sms_log_status_arr: DictOption<SmsLogStatus>[]
    sms_region_arr: DictOption<SmsRegion>[]
    default_region: SmsRegion
    default_endpoint: string
    default_ttl_minutes: number
  }
}

export interface SmsConfigItem {
  id: number | null
  configured: boolean
  secret_id_hint: string
  secret_key_hint: string
  sms_sdk_app_id: string
  sign_name: string
  region: SmsRegion
  endpoint: string
  status: SmsCommonStatus
  verify_code_ttl_minutes: number
  last_test_at: string | null
  last_test_error: string
  created_at: string | null
  updated_at: string | null
}

export interface SmsConfigFormState {
  secret_id: string
  secret_key: string
  sms_sdk_app_id: string
  sign_name: string
  region: SmsRegion
  endpoint: string
  status: SmsCommonStatus
  verify_code_ttl_minutes: number
}

export interface SmsTestPayload {
  to_phone: string
  template_scene: SmsTemplateScene
}

export interface SmsTemplateItem {
  id: number
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  sample_variables: Record<string, string>
  status: SmsCommonStatus
  created_at: string
  updated_at: string
}

export type SmsTemplateListResponse = SmsTemplateItem[]

export interface SmsTemplateSampleVariableRow {
  key: string
  value: string
}

export interface SmsTemplateFormState {
  id: number | null
  scene: SmsTemplateScene | ''
  name: string
  tencent_template_id: string
  variables_text: string
  sample_variables: SmsTemplateSampleVariableRow[]
  status: SmsCommonStatus
}

export interface SmsTemplatePayload {
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  sample_variables: Record<string, string>
  status: SmsCommonStatus
}

export interface SmsLogListParams {
  current_page: number
  page_size: number
  scene?: SmsLogScene | ''
  status?: SmsLogStatus | ''
  to_phone?: string
  created_at_start?: string
  created_at_end?: string
}

type SmsLogQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_sms_logs'>['query']>

export interface SmsLogItem {
  id: number
  scene: SmsLogScene
  template_id: number | null
  to_phone: string
  status: SmsLogStatus
  tencent_request_id: string
  tencent_serial_no: string
  tencent_fee: number
  error_code: string
  error_message: string
  duration_ms: number
  sent_at: string | null
  created_at: string
  updated_at: string
  template?: SmsLogTemplate | null
}

export interface SmsLogListResponse extends Omit<components['schemas']['Go_internal_module_sms_LogListResponse_Output'], 'list'> {
  list: SmsLogItem[]
}

export interface SmsLogTemplate {
  id: number
  scene: SmsTemplateScene
  name: string
  tencent_template_id: string
  variables: string[]
  status: SmsCommonStatus
}

function assertPositiveID(id: Id, label: string): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return id
}

function normalizeIDs(id: Id | Id[], label: string): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    const numericID = assertPositiveID(value, label)
    if (seen.has(numericID)) {
      continue
    }
    seen.add(numericID)
    ids.push(numericID)
  }

  const first = ids[0]
  if (first === undefined) throw new Error(`${label}s must not be empty`)
  return [first, ...ids.slice(1)]
}

function normalizeLogParams(params: SmsLogListParams): SmsLogQueryParams {
  const query: SmsLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.scene) {
    query.scene = params.scene
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (params.to_phone?.trim()) {
    query.to_phone = params.to_phone.trim()
  }
  if (params.created_at_start) {
    query.created_at_start = params.created_at_start
  }
  if (params.created_at_end) {
    query.created_at_end = params.created_at_end
  }

  return query
}

function isCommonStatus(value: number): value is SmsCommonStatus {
  return value === 1 || value === 2
}

function isLogStatus(value: number): value is SmsLogStatus {
  return value === 1 || value === 2 || value === 3
}

function isTemplateScene(value: string): value is SmsTemplateScene {
  return value === 'login' || value === 'forget' || value === 'bind_phone' || value === 'change_password'
}

function isLogScene(value: string): value is SmsLogScene {
  return value === 'test' || isTemplateScene(value)
}

function isSmsRegion(value: string): value is SmsRegion {
  return value === 'ap-guangzhou'
}

function toSmsConfig(item: components['schemas']['Go_internal_module_sms_ConfigResponse_Output']): SmsConfigItem {
  if (!isSmsRegion(item.region) || !isCommonStatus(item.status)) {
    throw new Error('SMS config violates the contract')
  }
  return { ...item, region: item.region, status: item.status }
}

function toSmsTemplate(item: components['schemas']['Go_internal_module_sms_TemplateDTO_Output']): SmsTemplateItem {
  if (!isTemplateScene(item.scene) || !isCommonStatus(item.status)) {
    throw new Error('SMS template violates the contract')
  }
  return { ...item, scene: item.scene, status: item.status }
}

function toSmsLogTemplate(item: components['schemas']['Go_internal_module_sms_LogTemplateDTO_Output']): SmsLogTemplate {
  if (!isTemplateScene(item.scene) || !isCommonStatus(item.status)) {
    throw new Error('SMS log template violates the contract')
  }
  return { ...item, scene: item.scene, status: item.status }
}

function toSmsLog(item: components['schemas']['Go_internal_module_sms_LogDTO_Output']): SmsLogItem {
  if (!isLogScene(item.scene) || !isLogStatus(item.status)) {
    throw new Error('SMS log violates the contract')
  }
  return {
    ...item,
    scene: item.scene,
    status: item.status,
    template: item.template ? toSmsLogTemplate(item.template) : item.template,
  }
}

function toSmsPageInit(response: components['schemas']['Go_internal_module_sms_PageInitResponse_Output']): SmsPageInitResponse {
  const commonStatus = response.dict.common_status_arr.map((option) => {
    if (!isCommonStatus(option.value)) throw new Error('SMS common status dictionary violates the contract')
    return { label: option.label, value: option.value as SmsCommonStatus }
  })
  const scenes = response.dict.sms_scene_arr.map((option) => {
    if (!isTemplateScene(option.value)) throw new Error('SMS scene dictionary violates the contract')
    return { label: option.label, value: option.value as SmsTemplateScene }
  })
  const logScenes = response.dict.sms_log_scene_arr.map((option) => {
    if (!isLogScene(option.value)) throw new Error('SMS log scene dictionary violates the contract')
    return { label: option.label, value: option.value as SmsLogScene }
  })
  const logStatuses = response.dict.sms_log_status_arr.map((option) => {
    if (!isLogStatus(option.value)) throw new Error('SMS log status dictionary violates the contract')
    return { label: option.label, value: option.value as SmsLogStatus }
  })
  const regions = response.dict.sms_region_arr.map((option) => {
    if (!isSmsRegion(option.value)) throw new Error('SMS region dictionary violates the contract')
    return { label: option.label, value: option.value as SmsRegion }
  })
  if (!isSmsRegion(response.dict.default_region)) {
    throw new Error('SMS default region violates the contract')
  }
  return {
    dict: {
      common_status_arr: commonStatus,
      sms_scene_arr: scenes,
      sms_log_scene_arr: logScenes,
      sms_log_status_arr: logStatuses,
      sms_region_arr: regions,
      default_region: response.dict.default_region,
      default_endpoint: response.dict.default_endpoint,
      default_ttl_minutes: response.dict.default_ttl_minutes,
    },
  }
}

async function deleteLogs(id: Id | Id[], options: ExecuteOptions = {}): Promise<void> {
  const ids = normalizeIDs(id, 'sms log id')
  if (ids.length === 1) {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_sms_logs_id, {
      path: { id: ids[0] },
    }, options)
    return
  }
  await executeAdminOperation(adminOperations.delete_api_admin_v1_sms_logs, { body: { ids } }, options)
}

const createTemplate = (payload: SmsTemplatePayload, options: ExecuteOptions = {}): Promise<{ id: number }> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_sms_templates, { body: payload }, options)

async function updateTemplate(id: Id, payload: SmsTemplatePayload, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.put_api_admin_v1_sms_templates_id, {
    path: { id: assertPositiveID(id, 'sms template id') },
    body: payload,
  }, options)
}

async function updateTemplateStatus(id: Id, status: SmsCommonStatus, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_sms_templates_id_status, {
    path: { id: assertPositiveID(id, 'sms template id') },
    body: { status },
  }, options)
}

export const SmsApi = {
  pageInit: async (options: ExecuteOptions = {}): Promise<SmsPageInitResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_sms_page_init, {}, options)
    return toSmsPageInit(response)
  },
  config: async (options: ExecuteOptions = {}): Promise<SmsConfigItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_sms_config, {}, options)
    return toSmsConfig(response)
  },
  async saveConfig(payload: SmsConfigFormState, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_sms_config, { body: payload }, options)
  },
  async deleteConfig(options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_sms_config, {}, options)
  },
  async test(payload: SmsTestPayload, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.post_api_admin_v1_sms_test, { body: payload }, options)
  },
  templates: async (options: ExecuteOptions = {}): Promise<SmsTemplateListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_sms_templates, {}, options)
    return response.map(toSmsTemplate)
  },
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  async deleteTemplate(id: Id, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_sms_templates_id, {
      path: { id: assertPositiveID(id, 'sms template id') },
    }, options)
  },
  logs: async (params: SmsLogListParams, options: ExecuteOptions = {}): Promise<SmsLogListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_sms_logs, {
      query: normalizeLogParams(params),
    }, options)
    return { list: response.list.map(toSmsLog), page: response.page }
  },
  log: async (id: Id, options: ExecuteOptions = {}): Promise<SmsLogItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_sms_logs_id, {
      path: { id: assertPositiveID(id, 'sms log id') },
    }, options)
    return toSmsLog(response)
  },
  async deleteLog(id: Id, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_sms_logs_id, {
      path: { id: assertPositiveID(id, 'sms log id') },
    }, options)
  },
  deleteLogs: (params: { id: Id | Id[] }, options: ExecuteOptions = {}) => deleteLogs(params.id, options),
}
