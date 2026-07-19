import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'

export type PaymentRechargeStatus = 'pending' | 'paying' | 'paid' | 'credited' | 'closed' | 'failed'
export type PaymentRechargePayMethod = 'web' | 'h5'
export type PaymentRechargeProvider = 'alipay'

export type WalletSummary = components['schemas']['Go_internal_module_payment_WalletSummary_Output']

export type RechargePackageItem = components['schemas']['Go_internal_module_payment_RechargePackageItem_Output']

export type RechargePaymentMethod = components['schemas']['Go_internal_module_payment_RechargePaymentMethod_Output']

export type PaymentRechargeListItem = components['schemas']['Go_internal_module_payment_RechargeListItem_Output']
export type PaymentRechargeListResponse = components['schemas']['Go_internal_module_payment_RechargeListResponse_Output']

export type PaymentRechargeDetail = components['schemas']['Go_internal_module_payment_RechargeDetail_Output']

export type PaymentRechargeInitResponse = components['schemas']['Go_internal_module_payment_RechargePageInitResponse_Output']

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

export type PaymentRechargePayResponse = components['schemas']['Go_internal_module_payment_RechargePayResponse_Output']

type PaymentRechargeListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_payment_recharges'>['query']>


function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment recharge id must be positive')
  return value
}

export const PaymentRechargeApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<PaymentRechargeInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_payment_recharges_page_init, {}, options),
  list: (params: PaymentRechargeListParams, options: ExecuteOptions = {}): Promise<PaymentRechargeListResponse> => {
    const query: PaymentRechargeListQuery = {
      current_page: params.current_page,
      page_size: params.page_size,
    }
    if (params.keyword) query.keyword = params.keyword
    if (params.status) query.status = params.status
    if (params.date_start) query.date_start = params.date_start
    if (params.date_end) query.date_end = params.date_end
    return executeAdminOperation(adminOperations.get_api_admin_v1_payment_recharges, { query }, options)
  },
  detail: (id: number, options: ExecuteOptions = {}): Promise<PaymentRechargeDetail> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_payment_recharges_id, {
      path: { id: positiveID(id) },
    }, options),
  create: (payload: PaymentRechargeCreatePayload, options: ExecuteOptions = {}): Promise<PaymentRechargePayResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_recharges, { body: payload }, options),
  pay: (id: number, options: ExecuteOptions = {}): Promise<PaymentRechargePayResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_recharges_id_pay, {
      path: { id: positiveID(id) },
    }, options),
}
