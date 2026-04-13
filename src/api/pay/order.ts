import request from '@/lib/http'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface OrderListParams {
  current_page?: number
  page_size?: number
  order_type?: number | ''
  pay_status?: number | ''
  order_no?: string
  user_id?: number | ''
  start_date?: string
  end_date?: string
}

export interface OrderListItem {
  id: number
  order_no: string
  user_id: number
  user_name: string
  user_email: string
  order_type: number
  order_type_text: string
  title: string
  total_amount: number
  discount_amount: number
  pay_amount: number
  pay_status: number
  pay_status_text: string
  biz_status: number
  biz_status_text: string
  admin_remark?: string
  pay_time?: string
  created_at: string
}

export interface OrderInitResponse {
  dict: {
    order_type_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
    pay_status_arr: DictOption<number>[]
    biz_status_arr: DictOption<number>[]
    recharge_preset_arr: Array<number | string | { label?: string; value?: number | string }>
  }
}

export interface OrderStatusCountResponse {
  counts: Record<number, { label: string; count: number }>
}

export interface OrderDetailResponse {
  order: {
    id: number
    order_no: string
    user_id: number
    user_name: string
    user_email: string
    order_type: number
    order_type_text: string
    biz_type: string
    biz_id: number
    title: string
    total_amount: number
    discount_amount: number
    pay_amount: number
    pay_status: number
    pay_status_text: string
    biz_status: number
    biz_status_text: string
    pay_time?: string
    expire_time?: string
    close_time?: string
    close_reason?: string
    biz_done_at?: string
    admin_remark?: string
    channel?: {
      id: number
      name: string
      channel: number
    } | null
    pay_method?: string
    extra: Record<string, unknown>
    created_at: string
  }
  items: Array<{
    id: number
    title: string
    price: number
    quantity: number
    amount: number
  }>
}

export interface RechargeOrderCreateResponse {
  order_id: number
  order_no: string
  pay_amount: number
  expire_time: string
}

export interface RechargeMyOrderItem {
  id: number
  order_no: string
  title: string
  pay_amount: number
  pay_status: number
  pay_status_text: string
  biz_status: number
  biz_status_text: string
  pay_time?: string | null
  created_at: string
  expire_time?: string | null
  channel_id?: number | null
  channel_name?: string
  pay_method?: string
  pay_method_text?: string
  transaction_no?: string | null
  transaction_status?: number | null
}

export interface CreatePayResponse {
  transaction_no?: string | null
  txn_id?: number
  order_no?: string
  pay_amount?: number
  channel?: number
  pay_method?: string
  notify_url?: string
  return_url?: string
  pay_data?: Record<string, unknown>
}

export interface OrderQueryResultResponse {
  order_no: string
  pay_status?: number
  biz_status?: number
  pay_time?: string | null
  transaction?: {
    transaction_no?: string
    status?: number
    trade_no?: string
  } | null
}

export interface WalletInfoResponse {
  wallet_exists?: number
  balance?: number
  frozen?: number
  total_recharge?: number
  total_consume?: number
  created_at?: string
}

export interface WalletBillItem {
  id: number
  biz_action_no: string
  type: number
  type_text: string
  available_delta: number
  frozen_delta: number
  balance_before: number
  balance_after: number
  title: string
  remark?: string
  order_no?: string
  created_at: string
}

export interface OrderIdParams {
  id: number
}

export interface OrderCloseParams extends OrderIdParams {
  reason?: string
}

export interface OrderRemarkParams extends OrderIdParams {
  remark: string
}

export interface RechargeCreateParams {
  amount: number
  pay_method: string
  channel_id: number
}

export interface CreatePayParams {
  order_no: string
  pay_method?: string
  return_url?: string
}

export interface OrderNoParams {
  order_no: string
}

export const OrderApi = {
  init: (params?: Record<string, unknown>) => request.post<OrderInitResponse>('/api/admin/PayOrder/init', params),
  list: (params: OrderListParams) => request.post<PaginatedResponse<OrderListItem>>('/api/admin/PayOrder/list', params),
  detail: (params: OrderIdParams) => request.post<OrderDetailResponse>('/api/admin/PayOrder/detail', params),
  statusCount: (params?: Record<string, unknown>) => request.post<OrderStatusCountResponse>('/api/admin/PayOrder/statusCount', params),
  close: (params: OrderCloseParams) => request.post<void>('/api/admin/PayOrder/close', params),
  remark: (params: OrderRemarkParams) => request.post<void>('/api/admin/PayOrder/remark', params),
  recharge: (params: RechargeCreateParams) => request.post<RechargeOrderCreateResponse>('/api/admin/pay/recharge', params),
  createPay: (params: CreatePayParams) => request.post<CreatePayResponse>('/api/admin/pay/createPay', params),
  cancelOrder: (params: OrderNoParams & { reason?: string }) => request.post<void>('/api/admin/pay/cancelOrder', params),
  myOrders: (params: { current_page?: number; page_size?: number }) => request.post<PaginatedResponse<RechargeMyOrderItem>>('/api/admin/pay/myOrders', params),
  queryResult: (params: OrderNoParams) => request.post<OrderQueryResultResponse>('/api/admin/pay/queryResult', params),
  orderDetail: (params: OrderNoParams) => request.post<unknown>('/api/admin/pay/orderDetail', params),
  walletInfo: (params?: Record<string, unknown>) => request.post<WalletInfoResponse>('/api/admin/pay/walletInfo', params),
  walletBills: (params: { current_page?: number; page_size?: number }) => request.post<PaginatedResponse<WalletBillItem>>('/api/admin/pay/walletBills', params),
}
