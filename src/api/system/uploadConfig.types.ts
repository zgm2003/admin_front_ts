import type { components } from '@/modules/http/generated/admin'
import type { AdminOperationInput } from '@/modules/http/generated/operations'
import type { DictOption } from '@/types/common'

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
  driver?: UploadDriverType | ''
}

export type UploadDriverListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_upload_drivers'>['query']>

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
    upload_image_ext_arr: DictOption<UploadImageExt>[]
    upload_file_ext_arr: DictOption<UploadFileExt>[]
  }
}

export interface UploadRuleListParams {
  current_page: number
  page_size: number
  title?: string
}

export type UploadRuleListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_upload_rules'>['query']>

type UploadRuleBody = NonNullable<AdminOperationInput<'post_api_admin_v1_upload_rules'>['body']>
export type UploadImageExt = NonNullable<UploadRuleBody['image_exts']>[number]
export type UploadFileExt = NonNullable<UploadRuleBody['file_exts']>[number]
export type UploadRuleContractItem = components['schemas']['Go_internal_module_uploadconfig_RuleItem_Output']
export interface UploadRuleItem extends Omit<UploadRuleContractItem, 'image_exts' | 'file_exts'> {
  image_exts: UploadImageExt[]
  file_exts: UploadFileExt[]
}

export type UploadRuleAddPayload = Omit<UploadRuleBody, 'image_exts' | 'file_exts'> & {
  image_exts: UploadImageExt[]
  file_exts: UploadFileExt[]
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
  driver_id?: number | ''
  rule_id?: number | ''
}

export type UploadSettingListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_upload_settings'>['query']>

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
