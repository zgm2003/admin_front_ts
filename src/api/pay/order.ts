import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface OrderListParams {
  current_page: number
  page_size: number
  order_type?: number | ''
  pay_status?: number | ''
  order_no?: string
  user_id?: number | ''
  start_date?: string
  end_date?: string
}

interface OrderListQueryParams {
  current_page: number
  page_size: number
  order_type?: number
  pay_status?: number
  order_no?: string
  user_id?: number
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
    channel_arr: DictOption<number>[]
    order_type_arr: DictOption<number>[]
    pay_method_arr: DictOption<string>[]
    pay_status_arr: DictOption<number>[]
    biz_status_arr: DictOption<number>[]
    recharge_preset_arr: DictOption<number>[]
  }
}

export interface OrderStatusCountItem {
  label: string
  value: number
  count: number
}

export type OrderStatusCountResponse = OrderStatusCountItem[]

export type OrderStatusCountMap = Partial<Record<number, OrderStatusCountItem>>

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
    success_transaction_id: number
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

export interface CreatePayPayload {
  pay_method?: string
  return_url?: string
}

export interface OrderNoParams {
  order_no: string
}

export interface OrderCloseBody {
  reason?: string
}

export interface OrderCancelBody {
  reason?: string
}

export interface OrderRemarkBody {
  remark: string
}

export interface EmptyQueryParams {
  _empty?: never
}

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function normalizeListParams(params: OrderListParams): OrderListQueryParams {
  const query: OrderListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (typeof params.order_type === 'number') {
    query.order_type = params.order_type
  }
  if (typeof params.pay_status === 'number') {
    query.pay_status = params.pay_status
  }
  const orderNo = trimOptional(params.order_no)
  if (orderNo) {
    query.order_no = orderNo
  }
  if (typeof params.user_id === 'number') {
    query.user_id = params.user_id
  }
  const startDate = trimOptional(params.start_date)
  if (startDate) {
    query.start_date = startDate
  }
  const endDate = trimOptional(params.end_date)
  if (endDate) {
    query.end_date = endDate
  }

  return query
}

export const OrderApi = {
  init: () => request.get<OrderInitResponse>(`${ADMIN_API_PREFIX}/pay-orders/page-init`),
  list: (params: OrderListParams) => request.get<PaginatedResponse<OrderListItem>>(`${ADMIN_API_PREFIX}/pay-orders`, { params: normalizeListParams(params) }),
  detail: (params: OrderIdParams) => request.get<OrderDetailResponse>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}`),
  statusCount: (params?: EmptyQueryParams) => request.get<OrderStatusCountResponse>(`${ADMIN_API_PREFIX}/pay-orders/status-count`, { params }),
  close: (params: OrderCloseParams) => request.patch<void, OrderCloseBody>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}/close`, { reason: params.reason }),
  remark: (params: OrderRemarkParams) => request.patch<void, OrderRemarkBody>(`${ADMIN_API_PREFIX}/pay-orders/${params.id}/remark`, { remark: params.remark }),
  recharge: (params: RechargeCreateParams) => request.post<RechargeOrderCreateResponse, RechargeCreateParams>(`${ADMIN_API_PREFIX}/recharge-orders`, params),
  createPay: (params: CreatePayParams) => request.post<CreatePayResponse, CreatePayPayload>(`${ADMIN_API_PREFIX}/recharge-orders/${params.order_no}/pay-attempts`, {
    pay_method: params.pay_method,
    return_url: params.return_url,
  }),
  cancelOrder: (params: OrderNoParams & { reason?: string }) => request.patch<void, OrderCancelBody>(`${ADMIN_API_PREFIX}/recharge-orders/${params.order_no}/cancel`, { reason: params.reason }),
  myOrders: (params: { current_page?: number; page_size?: number }) => request.get<PaginatedResponse<RechargeMyOrderItem>>(`${ADMIN_API_PREFIX}/recharge-orders`, { params }),
  queryResult: (params: OrderNoParams) => request.get<OrderQueryResultResponse>(`${ADMIN_API_PREFIX}/recharge-orders/${params.order_no}/result`),
  walletInfo: (params?: EmptyQueryParams) => request.get<WalletInfoResponse>(`${ADMIN_API_PREFIX}/wallet/summary`, { params }),
  walletBills: (params: { current_page?: number; page_size?: number }) => request.get<PaginatedResponse<WalletBillItem>>(`${ADMIN_API_PREFIX}/wallet/bills`, { params }),
}
