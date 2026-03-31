import type { PageInfo } from '@/types/common'

export interface WalletSummaryItem {
  balance: number
  frozen: number
  total_recharge: number
  total_consume: number
  created_at?: string
}

export interface WalletTransactionItem {
  id: number
  biz_action_no: string
  type: number
  type_text: string
  available_delta: number
  frozen_delta: number
  balance_before: number
  balance_after: number
  order_no?: string
  title?: string
  remark?: string
  created_at: string
}

export type WalletTransactionPage = PageInfo

export interface RechargePresetOption {
  amount: number
  label?: string
}

export interface RechargeOrderState {
  orderNo: string
  payAmount: number
  channelId: number
  channelText: string
  payMethod: string
  payMethodText: string
  payStatus: number
  payStatusText: string
  bizStatus: number
  bizStatusText: string
  expireTime?: string
  payTime?: string | null
  transactionNo?: string | null
  transactionStatus?: number | null
}

export interface RechargeOrderListItem {
  id: number
  order_no: string
  title: string
  pay_amount: number
  pay_status: number
  pay_status_text: string
  biz_status: number
  biz_status_text: string
  pay_time?: string | null
  expire_time?: string | null
  created_at: string
  channel_id?: number | null
  channel_name?: string
  pay_method?: string
  pay_method_text?: string
  transaction_no?: string | null
  transaction_status?: number | null
  order_type?: number
}

export interface RechargePaymentView {
  mode: 'qrcode' | 'external' | 'text'
  content: string
  qrDataUrl?: string
  externalType?: 'html' | 'link'
  raw?: Record<string, unknown> | null
}
