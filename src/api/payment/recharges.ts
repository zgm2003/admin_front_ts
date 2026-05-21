import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type PaymentRechargeStatus = 'pending' | 'paying' | 'paid' | 'credited' | 'closed' | 'failed'
export type PaymentRechargePayMethod = 'web' | 'h5'
export type PaymentRechargeProvider = 'alipay'

export interface WalletSummary {
  balance_cents: number
  balance_text: string
  total_recharge_cents: number
  total_recharge_text: string
  total_consume_cents: number
  total_consume_text: string
}

export interface RechargePackageItem {
  code: string
  name: string
  amount_cents: number
  amount_text: string
  badge: string
}

export interface RechargePaymentMethod {
  provider: PaymentRechargeProvider
  label: string
  enabled: boolean
}

export interface PaymentRechargeListItem {
  id: number
  recharge_no: string
  payment_order_no: string
  package_code: string
  package_name: string
  amount_cents: number
  amount_text: string
  status: PaymentRechargeStatus
  status_text: string
  pay_url: string
  paid_at: string
  credited_at: string
  created_at: string
  updated_at: string
}

export interface PaymentRechargeDetail extends PaymentRechargeListItem {
  failure_reason: string
  alipay_trade_no: string
}

export interface PaymentRechargeInitResponse {
  wallet: WalletSummary
  packages: RechargePackageItem[]
  payment_method: RechargePaymentMethod
  dict: {
    status_arr: DictOption<PaymentRechargeStatus>[]
  }
  recent: PaymentRechargeListItem[]
}

export interface PaymentRechargeListParams {
  current_page: number
  page_size: number
  keyword?: string
  status?: PaymentRechargeStatus | ''
  date_start?: string
  date_end?: string
}

export interface PaymentRechargeCreatePayload {
  package_code: string
  pay_method: PaymentRechargePayMethod
  return_url: string
}

export interface PaymentRechargePayResponse {
  id: number
  recharge_no: string
  payment_order_no: string
  status: PaymentRechargeStatus
  pay_url: string
}

export interface PaymentRechargeStatusResponse {
  id: number
  recharge_no: string
  status: PaymentRechargeStatus
  status_text: string
  wallet: WalletSummary
  paid_at: string
  credited_at: string
  failure_reason: string
}

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment recharge id must be positive')
  return value
}

export const PaymentRechargeApi = {
  init: () => request.get<PaymentRechargeInitResponse>(`${ADMIN_API_PREFIX}/payment/recharges/page-init`),
  list: (params: PaymentRechargeListParams) => request.get<PaginatedResponse<PaymentRechargeListItem>>(`${ADMIN_API_PREFIX}/payment/recharges`, { params }),
  detail: (id: number) => request.get<PaymentRechargeDetail>(`${ADMIN_API_PREFIX}/payment/recharges/${positiveID(id)}`),
  add: (payload: PaymentRechargeCreatePayload) => request.post<PaymentRechargePayResponse, PaymentRechargeCreatePayload>(`${ADMIN_API_PREFIX}/payment/recharges`, payload),
  pay: (id: number) => request.post<PaymentRechargePayResponse>(`${ADMIN_API_PREFIX}/payment/recharges/${positiveID(id)}/pay`),
  sync: (id: number) => request.post<PaymentRechargeStatusResponse>(`${ADMIN_API_PREFIX}/payment/recharges/${positiveID(id)}/sync`),
  close: (id: number) => request.patch<PaymentRechargeStatusResponse>(`${ADMIN_API_PREFIX}/payment/recharges/${positiveID(id)}/close`),
}
