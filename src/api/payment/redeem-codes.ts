import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'

export type PaymentRedeemCodeListParams = NonNullable<AdminOperationInput<'get_api_admin_v1_payment_redeem_codes'>['query']>
export type PaymentRedeemCodeLookupPayload = NonNullable<AdminOperationInput<'post_api_admin_v1_payment_redeem_code_lookups'>['body']>
export type PaymentRedeemCodeGenerateBatchPayload = NonNullable<AdminOperationInput<'post_api_admin_v1_payment_redeem_code_batches'>['body']>
export type PaymentRedeemCodeExportPayload = NonNullable<AdminOperationInput<'post_api_admin_v1_payment_redeem_code_exports'>['body']>
export type PaymentRedeemCodeVoidPayload = NonNullable<AdminOperationInput<'patch_api_admin_v1_payment_redeem_codes'>['body']>

export type PaymentRedeemCodePageInitResponse = components['schemas']['Go_internal_module_payment_redeemcode_PageInitResponse_Output']
export type PaymentRedeemCodeListResponse = components['schemas']['Go_internal_module_payment_redeemcode_ListResponse_Output']
export type PaymentRedeemCodeLookupResponse = components['schemas']['Go_internal_module_payment_redeemcode_LookupResponse_Output']
export type PaymentRedeemCodeGenerateBatchResponse = components['schemas']['Go_internal_module_payment_redeemcode_GenerateBatchResponse_Output']
export type PaymentRedeemCodeExportResponse = components['schemas']['Go_internal_module_payment_redeemcode_ExportResponse_Output']
export type PaymentRedeemCodeVoidResponse = components['schemas']['Go_internal_module_payment_redeemcode_VoidResponse_Output']

export const PaymentRedeemCodeApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<PaymentRedeemCodePageInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_payment_redeem_codes_page_init, {}, options),
  list: (params: PaymentRedeemCodeListParams, options: ExecuteOptions = {}): Promise<PaymentRedeemCodeListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_payment_redeem_codes, { query: params }, options),
  lookup: (payload: PaymentRedeemCodeLookupPayload, options: ExecuteOptions = {}): Promise<PaymentRedeemCodeLookupResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_redeem_code_lookups, { body: payload }, options),
  generateBatch: (
    payload: PaymentRedeemCodeGenerateBatchPayload,
    options: ExecuteOptions = {},
  ): Promise<PaymentRedeemCodeGenerateBatchResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_redeem_code_batches, { body: payload }, options),
  export: (payload: PaymentRedeemCodeExportPayload, options: ExecuteOptions = {}): Promise<PaymentRedeemCodeExportResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_redeem_code_exports, { body: payload }, options),
  void: (payload: PaymentRedeemCodeVoidPayload, options: ExecuteOptions = {}): Promise<PaymentRedeemCodeVoidResponse> =>
    executeAdminOperation(adminOperations.patch_api_admin_v1_payment_redeem_codes, { body: payload }, options),
}
