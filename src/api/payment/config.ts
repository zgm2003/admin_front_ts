import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type PaymentEnvironment = 'sandbox' | 'production'
export type PaymentEnabledMethod = 'web' | 'h5'
export type PaymentCertificateType = 'app_cert' | 'alipay_cert' | 'alipay_root_cert'
export type PaymentProvider = 'alipay'

export interface PaymentConfigInitResponse {
  dict: {
    provider_arr: DictOption<PaymentProvider>[]
    environment_arr: DictOption<PaymentEnvironment>[]
    common_status_arr: DictOption<number>[]
    enabled_method_arr: DictOption<PaymentEnabledMethod>[]
    certificate_type_arr: DictOption<PaymentCertificateType>[]
  }
}

export interface PaymentConfigListParams {
  current_page: number
  page_size: number
  name?: string
  provider?: PaymentProvider | ''
  environment?: PaymentEnvironment | ''
  status?: number | ''
}

export interface PaymentConfigListItem {
  id: number
  provider: PaymentProvider
  provider_text: string
  code: string
  name: string
  app_id: string
  private_key_hint: string
  app_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  notify_url: string
  return_url: string
  environment: PaymentEnvironment
  environment_text: string
  enabled_methods: PaymentEnabledMethod[]
  enabled_methods_text: string
  status: number
  status_text: string
  remark: string
  created_at: string
  updated_at: string
}

export interface PaymentConfigMutationPayload {
  id?: number
  provider: PaymentProvider
  code: string
  name: string
  app_id: string
  app_private_key?: string
  app_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  notify_url: string
  return_url: string
  environment: PaymentEnvironment
  enabled_methods: PaymentEnabledMethod[]
  status: number
  remark: string
}

export interface PaymentConfigCreateResponse {
  id: number
}

export interface PaymentCertificateUploadResponse {
  path: string
  file_name: string
  sha256: string
  size: number
}

export interface PaymentConfigTestResponse {
  ok: boolean
  checks: string[]
  message: string
}

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment config id must be positive')
  return value
}

export const PaymentConfigApi = {
  init: () => request.get<PaymentConfigInitResponse>(`${ADMIN_API_PREFIX}/payment/configs/page-init`),
  list: (params: PaymentConfigListParams) => request.get<PaginatedResponse<PaymentConfigListItem>>(`${ADMIN_API_PREFIX}/payment/configs`, { params }),
  add: (payload: PaymentConfigMutationPayload) => request.post<PaymentConfigCreateResponse, PaymentConfigMutationPayload>(`${ADMIN_API_PREFIX}/payment/configs`, payload),
  edit: (payload: PaymentConfigMutationPayload) => request.put<void, PaymentConfigMutationPayload>(`${ADMIN_API_PREFIX}/payment/configs/${positiveID(payload.id ?? 0)}`, payload),
  status: (id: number, status: number) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/payment/configs/${positiveID(id)}/status`, { status }),
  del: (id: number) => request.delete<void>(`${ADMIN_API_PREFIX}/payment/configs/${positiveID(id)}`),
  uploadCertificate: (payload: FormData) => request.post<PaymentCertificateUploadResponse, FormData>(`${ADMIN_API_PREFIX}/payment/certificates`, payload),
  test: (id: number) => request.post<PaymentConfigTestResponse>(`${ADMIN_API_PREFIX}/payment/configs/${positiveID(id)}/test`),
}
