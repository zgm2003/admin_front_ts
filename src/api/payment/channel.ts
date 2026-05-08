import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PaymentChannelInitResponse {
  dict: {
    provider_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
    yes_no_arr: DictOption<number>[]
  }
}

export interface PaymentChannelListParams {
  current_page: number
  page_size: number
  name?: string
  provider?: string
  status?: number | ''
}

export interface PaymentChannelListItem {
  id: number
  code: string
  name: string
  provider: string
  provider_text: string
  supported_methods: string[]
  supported_methods_text: string
  app_id: string
  merchant_id: string
  notify_url: string
  return_url: string
  private_key_hint: string
  app_cert_path: string
  alipay_cert_path: string
  alipay_root_cert_path: string
  is_sandbox: number
  status: number
  status_text: string
  remark: string
  created_at: string
  updated_at: string
}

export interface PaymentChannelMutationPayload {
  id?: number
  code: string
  name: string
  provider: string
  supported_methods: string[]
  app_id: string
  merchant_id: string
  notify_url: string
  return_url: string
  private_key?: string
  app_cert_path: string
  alipay_cert_path: string
  alipay_root_cert_path: string
  is_sandbox: number
  status: number
  remark: string
}

export interface PaymentChannelCreateResponse { id: number }

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment channel id must be positive')
  return value
}

export const PaymentChannelApi = {
  init: () => request.get<PaymentChannelInitResponse>(`${ADMIN_API_PREFIX}/payment/channels/page-init`),
  list: (params: PaymentChannelListParams) => request.get<PaginatedResponse<PaymentChannelListItem>>(`${ADMIN_API_PREFIX}/payment/channels`, { params }),
  add: (payload: PaymentChannelMutationPayload) => request.post<PaymentChannelCreateResponse, PaymentChannelMutationPayload>(`${ADMIN_API_PREFIX}/payment/channels`, payload),
  edit: (payload: PaymentChannelMutationPayload) => request.put<void, PaymentChannelMutationPayload>(`${ADMIN_API_PREFIX}/payment/channels/${positiveID(payload.id ?? 0)}`, payload),
  status: (id: number, status: number) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/payment/channels/${positiveID(id)}/status`, { status }),
  del: (id: number) => request.delete<void>(`${ADMIN_API_PREFIX}/payment/channels/${positiveID(id)}`),
}
