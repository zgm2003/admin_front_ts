import request from '@/utils/request'

export interface OrderListParams {
  page?: number
  page_size?: number
  order_type?: number | ''
  pay_status?: number | ''
  order_no?: string
  user_id?: number | ''
  start_date?: string
  end_date?: string
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
  channel?: number
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
  init: (params?: any) => request.post('/api/admin/PayOrder/init', params),
  list: (params: OrderListParams) => request.post('/api/admin/PayOrder/list', params),
  detail: (params: OrderIdParams) => request.post('/api/admin/PayOrder/detail', params),
  statusCount: (params?: any) => request.post('/api/admin/PayOrder/statusCount', params),
  close: (params: OrderCloseParams) => request.post('/api/admin/PayOrder/close', params),
  remark: (params: OrderRemarkParams) => request.post('/api/admin/PayOrder/remark', params),
  recharge: (params: RechargeCreateParams) => request.post('/api/admin/pay/recharge', params),
  createPay: (params: CreatePayParams) => request.post('/api/admin/pay/createPay', params),
  cancelOrder: (params: OrderNoParams & { reason?: string }) => request.post('/api/admin/pay/cancelOrder', params),
  myOrders: (params: Pick<OrderListParams, 'page' | 'page_size'>) => request.post('/api/admin/pay/myOrders', params),
  queryResult: (params: OrderNoParams) => request.post('/api/admin/pay/queryResult', params),
  orderDetail: (params: OrderNoParams) => request.post('/api/admin/pay/orderDetail', params),
  walletInfo: (params?: any) => request.post('/api/admin/pay/walletInfo', params),
  walletBills: (params: { page?: number; page_size?: number }) => request.post('/api/admin/pay/walletBills', params),
}
