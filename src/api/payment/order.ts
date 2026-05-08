import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PaymentOrderInitResponse {
  dict: {
    provider_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
    yes_no_arr: DictOption<number>[]
  }
}
export interface PaymentOrderListParams { current_page: number; page_size: number; order_no?: string; user_id?: number | ''; status?: number | ''; start_date?: string; end_date?: string }
export interface PaymentOrderListItem { id: number; order_no: string; user_id: number; channel_id: number; provider: string; pay_method: string; subject: string; amount_cents: number; status: number; status_text: string; out_trade_no: string; trade_no: string; paid_at: string; expired_at: string; closed_at: string; created_at: string }
export interface PaymentCreateOrderPayload { channel_id: number; pay_method: string; subject: string; amount_cents: number; return_url?: string; business_type?: string; business_ref?: string }
export interface PaymentCreateOrderResponse { order_no: string; amount_cents: number; expired_at: string }
export interface PaymentPayOrderPayload { return_url?: string }
export interface PaymentPayOrderResponse { order_no: string; out_trade_no: string; pay_method: string; pay_url: string; pay_data: Record<string, unknown> }
export interface PaymentResultResponse { order_no: string; status: number; status_text: string; trade_no: string; paid_at: string }

const byOrderNo = (orderNo: string) => {
  const value = orderNo.trim()
  if (!value) throw new Error('payment order_no is required')
  return encodeURIComponent(value)
}

export const PaymentOrderApi = {
  init: () => request.get<PaymentOrderInitResponse>(`${ADMIN_API_PREFIX}/payment/orders/page-init`),
  list: (params: PaymentOrderListParams) => request.get<PaginatedResponse<PaymentOrderListItem>>(`${ADMIN_API_PREFIX}/payment/orders`, { params }),
  create: (payload: PaymentCreateOrderPayload) => request.post<PaymentCreateOrderResponse, PaymentCreateOrderPayload>(`${ADMIN_API_PREFIX}/payment/orders`, payload),
  pay: (orderNo: string, payload: PaymentPayOrderPayload) => request.post<PaymentPayOrderResponse, PaymentPayOrderPayload>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/pay`, payload),
  result: (orderNo: string) => request.get<PaymentResultResponse>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/result`),
  cancel: (orderNo: string) => request.patch<void>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/cancel`),
  close: (orderNo: string) => request.patch<void>(`${ADMIN_API_PREFIX}/payment/orders/${byOrderNo(orderNo)}/close`),
}
