import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import { adminOperations, type AdminOperationInput } from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'

export type MailCommonStatus = 1 | 2
export type MailLogStatus = 1 | 2 | 3
export type MailTemplateScene = 'login' | 'forget' | 'bind_email' | 'change_password'
export type MailLogScene = MailTemplateScene | 'test'
export type MailRegion = 'ap-guangzhou' | 'ap-hongkong'
type MailVerificationCodeStatus = NonNullable<components['schemas']['Go_internal_module_mail_LogDTO_Output']['verification_code_status']>

const mailVerificationCodeStatuses: readonly MailVerificationCodeStatus[] = ['sending', 'not_expired', 'expired', 'send_failed']
const mailVerificationCodeStatusSet = new Set<string>(mailVerificationCodeStatuses)

export interface MailPageInitResponse {
  dict: {
    common_status_arr: DictOption<MailCommonStatus>[]
    mail_scene_arr: DictOption<MailTemplateScene>[]
    mail_log_scene_arr: DictOption<MailLogScene>[]
    mail_log_status_arr: DictOption<MailLogStatus>[]
    mail_verification_code_status_arr: DictOption<MailVerificationCodeStatus>[]
    mail_region_arr: DictOption<MailRegion>[]
    default_region: string
    default_endpoint: string
    default_ttl_minutes: number
  }
}

export interface MailConfigItem {
  id: number | null
  configured: boolean
  secret_id_hint: string
  secret_key_hint: string
  region: string
  endpoint: string
  from_email: string
  from_name: string
  reply_to: string
  status: MailCommonStatus
  verify_code_ttl_minutes: number
  last_test_at: string | null
  last_test_error: string
  created_at: string | null
  updated_at: string | null
}

export interface MailConfigFormState {
  secret_id: string
  secret_key: string
  region: string
  endpoint: string
  from_email: string
  from_name: string
  reply_to: string
  status: MailCommonStatus
  verify_code_ttl_minutes: number
}

export interface MailTestPayload {
  to_email: string
  template_scene: MailTemplateScene
}

export interface MailTemplateItem {
  id: number
  scene: MailTemplateScene
  name: string
  subject: string
  tencent_template_id: number
  variables: string[]
  sample_variables: Record<string, string>
  status: MailCommonStatus
  created_at: string
  updated_at: string
}

export type MailTemplateListResponse = MailTemplateItem[]

export interface MailTemplateSampleVariableRow {
  key: string
  value: string
}

export interface MailTemplateFormState {
  id: number | null
  scene: MailTemplateScene | ''
  name: string
  subject: string
  tencent_template_id: number | null
  variables_text: string
  sample_variables: MailTemplateSampleVariableRow[]
  status: MailCommonStatus
}

export interface MailTemplatePayload {
  scene: MailTemplateScene
  name: string
  subject: string
  tencent_template_id: number
  variables: string[]
  sample_variables: Record<string, string>
  status: MailCommonStatus
}

export interface MailLogListParams {
  current_page: number
  page_size: number
  scene?: MailLogScene | ''
  status?: MailLogStatus | ''
  to_email?: string
  created_at_start?: string
  created_at_end?: string
}

type MailLogQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_mail_logs'>['query']>

export type MailLogItem = Omit<components['schemas']['Go_internal_module_mail_LogDTO_Output'], 'scene' | 'status' | 'template'> & {
  scene: MailLogScene
  status: MailLogStatus
  template?: MailLogTemplate | null
}

export interface MailLogListResponse extends Omit<components['schemas']['Go_internal_module_mail_LogListResponse_Output'], 'list'> {
  list: MailLogItem[]
}

export interface MailLogTemplate {
  id: number
  scene: MailTemplateScene
  name: string
  tencent_template_id: number
  variables: string[]
  status: MailCommonStatus
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

function normalizeLogParams(params: MailLogListParams): MailLogQueryParams {
  const query: MailLogQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.scene) {
    query.scene = params.scene
  }
  if (typeof params.status === 'number') {
    query.status = params.status
  }
  if (params.to_email?.trim()) {
    query.to_email = params.to_email.trim()
  }
  if (params.created_at_start) {
    query.created_at_start = params.created_at_start
  }
  if (params.created_at_end) {
    query.created_at_end = params.created_at_end
  }

  return query
}

function isCommonStatus(value: number): value is MailCommonStatus { return value === 1 || value === 2 }
function isLogStatus(value: number): value is MailLogStatus { return value === 1 || value === 2 || value === 3 }
function isTemplateScene(value: string): value is MailTemplateScene { return value === 'login' || value === 'forget' || value === 'bind_email' || value === 'change_password' }
function isLogScene(value: string): value is MailLogScene { return value === 'test' || isTemplateScene(value) }
function isMailRegion(value: string): value is MailRegion { return value === 'ap-guangzhou' || value === 'ap-hongkong' }
function isMailVerificationCodeStatus(value: string): value is MailVerificationCodeStatus { return mailVerificationCodeStatusSet.has(value) }

function isValidVerificationCodeExpiry(value: string): boolean {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/.exec(value)
  if (match === null) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  if (
    yearText === undefined || monthText === undefined || dayText === undefined
    || hourText === undefined || minuteText === undefined || secondText === undefined
  ) {
    return false
  }

  const [year = Number.NaN, month = Number.NaN, day = Number.NaN, hour = Number.NaN, minute = Number.NaN, second = Number.NaN] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number)
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const maximumDay = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  return maximumDay !== undefined && day >= 1 && day <= maximumDay
}

function toMailVerificationCodeStatusOptions(
  options: components['schemas']['Go_internal_shared_dict_Option_string_Output'][],
): DictOption<MailVerificationCodeStatus>[] {
  if (options.length !== mailVerificationCodeStatuses.length) {
    throw new Error('mail verification code status dictionary violates the contract')
  }

  const seen = new Set<string>()
  const normalized = options.map((option) => {
    if (!isMailVerificationCodeStatus(option.value) || seen.has(option.value)) {
      throw new Error('mail verification code status dictionary violates the contract')
    }
    seen.add(option.value)
    return { label: option.label, value: option.value }
  })
  if (mailVerificationCodeStatuses.some((status) => !seen.has(status))) {
    throw new Error('mail verification code status dictionary violates the contract')
  }
  return normalized
}

function toMailConfig(item: components['schemas']['Go_internal_module_mail_ConfigResponse_Output']): MailConfigItem {
  if (!isCommonStatus(item.status)) throw new Error('mail config status violates the contract')
  return { ...item, status: item.status }
}

function toMailTemplate(item: components['schemas']['Go_internal_module_mail_TemplateDTO_Output']): MailTemplateItem {
  if (!isTemplateScene(item.scene) || !isCommonStatus(item.status)) {
    throw new Error('mail template violates the contract')
  }
  return { ...item, scene: item.scene, status: item.status }
}

function toMailLogTemplate(item: components['schemas']['Go_internal_module_mail_LogTemplateDTO_Output']): MailLogTemplate {
  if (!isTemplateScene(item.scene) || !isCommonStatus(item.status)) {
    throw new Error('mail log template violates the contract')
  }
  return { ...item, scene: item.scene, status: item.status }
}

function toMailLog(item: components['schemas']['Go_internal_module_mail_LogDTO_Output']): MailLogItem {
  if (!isLogScene(item.scene) || !isLogStatus(item.status)) {
    throw new Error('mail log violates the contract')
  }
  const { verification_code: code, verification_code_status: codeStatus, verification_code_expires_at: codeExpiresAt } = item
  if (
    !(code === null && codeStatus === null && codeExpiresAt === null)
    && (code === null || codeStatus === null || codeExpiresAt === null
      || !/^[0-9]{6}$/.test(code)
      || !isMailVerificationCodeStatus(codeStatus)
      || !isValidVerificationCodeExpiry(codeExpiresAt))
  ) {
    throw new Error('mail verification code diagnostic violates the contract')
  }
  return {
    ...item,
    scene: item.scene,
    status: item.status,
    template: item.template ? toMailLogTemplate(item.template) : item.template,
  }
}

function toMailPageInit(response: components['schemas']['Go_internal_module_mail_PageInitResponse_Output']): MailPageInitResponse {
  const commonStatus = response.dict.common_status_arr.map((option) => { if (!isCommonStatus(option.value)) throw new Error('mail common status dictionary violates the contract'); return { label: option.label, value: option.value as MailCommonStatus } })
  const scenes = response.dict.mail_scene_arr.map((option) => { if (!isTemplateScene(option.value)) throw new Error('mail scene dictionary violates the contract'); return { label: option.label, value: option.value as MailTemplateScene } })
  const logScenes = response.dict.mail_log_scene_arr.map((option) => { if (!isLogScene(option.value)) throw new Error('mail log scene dictionary violates the contract'); return { label: option.label, value: option.value as MailLogScene } })
  const logStatuses = response.dict.mail_log_status_arr.map((option) => { if (!isLogStatus(option.value)) throw new Error('mail log status dictionary violates the contract'); return { label: option.label, value: option.value as MailLogStatus } })
  const verificationCodeStatuses = toMailVerificationCodeStatusOptions(
    response.dict.mail_verification_code_status_arr,
  )
  const regions = response.dict.mail_region_arr.map((option) => { if (!isMailRegion(option.value)) throw new Error('mail region dictionary violates the contract'); return { label: option.label, value: option.value as MailRegion } })
  return {
    dict: {
      common_status_arr: commonStatus,
      mail_scene_arr: scenes,
      mail_log_scene_arr: logScenes,
      mail_log_status_arr: logStatuses,
      mail_verification_code_status_arr: verificationCodeStatuses,
      mail_region_arr: regions,
      default_region: response.dict.default_region,
      default_endpoint: response.dict.default_endpoint,
      default_ttl_minutes: response.dict.default_ttl_minutes,
    },
  }
}

async function deleteLogs(id: Id | Id[], options: ExecuteOptions = {}): Promise<void> {
  const ids = normalizeIDs(id, 'mail log id')
  if (ids.length === 1) {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_mail_logs_id, {
      path: { id: ids[0] },
    }, options)
    return
  }
  await executeAdminOperation(adminOperations.delete_api_admin_v1_mail_logs, { body: { ids } }, options)
}

const createTemplate = (payload: MailTemplatePayload, options: ExecuteOptions = {}): Promise<{ id: number }> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_mail_templates, { body: payload }, options)

async function updateTemplate(id: Id, payload: MailTemplatePayload, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.put_api_admin_v1_mail_templates_id, {
    path: { id: assertPositiveID(id, 'mail template id') },
    body: payload,
  }, options)
}

async function updateTemplateStatus(id: Id, status: MailCommonStatus, options: ExecuteOptions = {}): Promise<void> {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_mail_templates_id_status, {
    path: { id: assertPositiveID(id, 'mail template id') },
    body: { status },
  }, options)
}

export const MailApi = {
  pageInit: async (options: ExecuteOptions = {}): Promise<MailPageInitResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_mail_page_init, {}, options)
    return toMailPageInit(response)
  },
  config: async (options: ExecuteOptions = {}): Promise<MailConfigItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_mail_config, {}, options)
    return toMailConfig(response)
  },
  async saveConfig(payload: MailConfigFormState, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_mail_config, { body: payload }, options)
  },
  async deleteConfig(options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_mail_config, {}, options)
  },
  async test(payload: MailTestPayload, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.post_api_admin_v1_mail_test, { body: payload }, options)
  },
  templates: async (options: ExecuteOptions = {}): Promise<MailTemplateListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_mail_templates, {}, options)
    return response.map(toMailTemplate)
  },
  createTemplate,
  addTemplate: createTemplate,
  updateTemplate,
  editTemplate: updateTemplate,
  updateTemplateStatus,
  changeTemplateStatus: updateTemplateStatus,
  async deleteTemplate(id: Id, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_mail_templates_id, {
      path: { id: assertPositiveID(id, 'mail template id') },
    }, options)
  },
  logs: async (params: MailLogListParams, options: ExecuteOptions = {}): Promise<MailLogListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_mail_logs, {
      query: normalizeLogParams(params),
    }, options)
    return { list: response.list.map(toMailLog), page: response.page }
  },
  log: async (id: Id, options: ExecuteOptions = {}): Promise<MailLogItem> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_mail_logs_id, {
      path: { id: assertPositiveID(id, 'mail log id') },
    }, options)
    return toMailLog(response)
  },
  async deleteLog(id: Id, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_mail_logs_id, {
      path: { id: assertPositiveID(id, 'mail log id') },
    }, options)
  },
  deleteLogs: (params: { id: Id | Id[] }, options: ExecuteOptions = {}) => deleteLogs(params.id, options),
}
