import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type PaymentOrderProvider = 'alipay'
export type PaymentOrderPayMethod = 'web' | 'h5'
export type PaymentOrderStatus = 'pending' | 'paying' | 'paid' | 'closed' | 'failed'

export interface PaymentOrderInitResponse {
  dict: {
    provider_arr: DictOption<PaymentOrderProvider>[]
    pay_method_arr: DictOption<PaymentOrderPayMethod>[]
    order_status_arr: DictOption<PaymentOrderStatus>[]
  }
  config_options: Array<{
    label: string
    value: string
    provider: PaymentOrderProvider
    enabled_methods: PaymentOrderPayMethod[]
  }>
}

export interface PaymentOrderListParams {
  current_page: number
  page_size: number
  keyword?: string
  config_code?: string
  provider?: PaymentOrderProvider | ''
  pay_method?: PaymentOrderPayMethod | ''
  status?: PaymentOrderStatus | ''
  date_start?: string
  date_end?: string
}

export interface PaymentOrderListItem {
  id: number
  order_no: string
  config_code: string
  provider: PaymentOrderProvider
  provider_text: string
  pay_method: PaymentOrderPayMethod
  pay_method_text: string
  subject: string
  amount_cents: number
  amount_text: string
  status: PaymentOrderStatus
  status_text: string
  pay_url: string
  expired_at: string
  created_at: string
  updated_at: string
}

export interface PaymentOrderDetail extends PaymentOrderListItem {
  return_url: string
  alipay_trade_no: string
  paid_at: string
  closed_at: string
  failure_reason: string
}

export interface PaymentOrderCreatePayload {
  config_code: string
  pay_method: PaymentOrderPayMethod
  subject: string
  amount_cents: number
  return_url: string
  expire_minutes: number
}

export interface PaymentOrderCreateResponse {
  id: number
  order_no: string
  status: PaymentOrderStatus
}

export interface PaymentOrderPayResponse {
  id: number
  order_no: string
  status: PaymentOrderStatus
  pay_url: string
}

export interface PaymentOrderStatusResponse {
  id: number
  order_no: string
  status: PaymentOrderStatus
  status_text: string
  alipay_trade_no: string
  paid_at: string
  closed_at: string
}

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment order id must be positive')
  return value
}

export const PaymentOrderApi = {
  init: () => request.get<PaymentOrderInitResponse>(`${ADMIN_API_PREFIX}/payment/orders/page-init`),
  list: (params: PaymentOrderListParams) => request.get<PaginatedResponse<PaymentOrderListItem>>(`${ADMIN_API_PREFIX}/payment/orders`, { params }),
  detail: (id: number) => request.get<PaymentOrderDetail>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}`),
  add: (payload: PaymentOrderCreatePayload) => request.post<PaymentOrderCreateResponse, PaymentOrderCreatePayload>(`${ADMIN_API_PREFIX}/payment/orders`, payload),
  pay: (id: number) => request.post<PaymentOrderPayResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/pay`),
  sync: (id: number) => request.post<PaymentOrderStatusResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/sync`),
  close: (id: number) => request.patch<PaymentOrderStatusResponse>(`${ADMIN_API_PREFIX}/payment/orders/${positiveID(id)}/close`),
}
