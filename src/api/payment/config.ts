import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'

type PaymentConfigCreateBody = NonNullable<AdminOperationInput<'post_api_admin_v1_payment_configs'>['body']>
type PaymentCertificateUploadBody = NonNullable<AdminOperationInput<'post_api_admin_v1_payment_certificates'>['body']>
type PaymentConfigListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_payment_configs'>['query']>

export type PaymentEnvironment = PaymentConfigCreateBody['environment']
export type PaymentEnabledMethod = PaymentConfigCreateBody['enabled_methods'][number]
export type PaymentCertificateType = PaymentCertificateUploadBody['cert_type']
export type PaymentProvider = PaymentConfigCreateBody['provider']

export type PaymentConfigInitResponse = components['schemas']['Go_internal_module_payment_ConfigPageInitResponse_Output']

export interface PaymentConfigListParams {
  current_page: number
  page_size: number
  name?: string
  provider?: PaymentProvider | ''
  environment?: PaymentEnvironment | ''
  status?: 1 | 2 | ''
}

type PaymentConfigContractItem = components['schemas']['Go_internal_module_payment_ConfigListItem_Output']
type PaymentConfigEditableFields = Pick<
  PaymentConfigCreateBody,
  'provider' | 'environment' | 'enabled_methods' | 'status'
>
export type PaymentConfigListItem = Omit<PaymentConfigContractItem, keyof PaymentConfigEditableFields>
  & PaymentConfigEditableFields
export interface PaymentConfigListResponse extends Omit<components['schemas']['Go_internal_module_payment_ConfigListResponse_Output'], 'list'> {
  list: PaymentConfigListItem[]
}

export type PaymentConfigMutationPayload = PaymentConfigCreateBody & { id?: number }

export type PaymentConfigCreateResponse = components['schemas']['Go_internal_server_adminroute_IDData_Output']

export type PaymentCertificateUploadResponse = components['schemas']['Go_internal_module_payment_CertificateUploadResponse_Output']

export type PaymentConfigTestResponse = components['schemas']['Go_internal_module_payment_ConfigTestResponse_Output']

function positiveID(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('payment config id must be positive')
  return value
}

function requiredPositiveID(value: number | undefined): number {
  if (value === undefined) throw new Error('payment config id is required')
  return positiveID(value)
}

function isEnabledMethod(value: string): value is PaymentEnabledMethod {
  return value === 'web' || value === 'h5'
}

function toPaymentConfigItem(item: PaymentConfigContractItem): PaymentConfigListItem {
  if (
    item.provider !== 'alipay'
    || (item.environment !== 'sandbox' && item.environment !== 'production')
    || !item.enabled_methods.every(isEnabledMethod)
    || (item.status !== 1 && item.status !== 2)
  ) {
    throw new Error('payment config list item violates the editable contract')
  }
  return {
    ...item,
    provider: item.provider,
    environment: item.environment,
    enabled_methods: item.enabled_methods,
    status: item.status,
  }
}

function paymentConfigBody(payload: PaymentConfigMutationPayload): PaymentConfigCreateBody {
  return {
    provider: payload.provider,
    code: payload.code,
    name: payload.name,
    app_id: payload.app_id,
    app_private_key: payload.app_private_key,
    app_cert_path: payload.app_cert_path,
    platform_cert_path: payload.platform_cert_path,
    root_cert_path: payload.root_cert_path,
    notify_url: payload.notify_url,
    environment: payload.environment,
    enabled_methods: payload.enabled_methods,
    sort: payload.sort,
    status: payload.status,
    remark: payload.remark,
  }
}

export const PaymentConfigApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<PaymentConfigInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_payment_configs_page_init, {}, options),
  list: async (params: PaymentConfigListParams, options: ExecuteOptions = {}): Promise<PaymentConfigListResponse> => {
    const query: PaymentConfigListQuery = {
      current_page: params.current_page,
      page_size: params.page_size,
    }
    if (params.name) query.name = params.name
    if (params.provider) query.provider = params.provider
    if (params.environment) query.environment = params.environment
    if (typeof params.status === 'number') query.status = params.status
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_payment_configs, { query }, options)
    return { list: response.list.map(toPaymentConfigItem), page: response.page }
  },
  create: (payload: PaymentConfigMutationPayload, options: ExecuteOptions = {}): Promise<PaymentConfigCreateResponse> => {
    return executeAdminOperation(adminOperations.post_api_admin_v1_payment_configs, {
      body: paymentConfigBody(payload),
    }, options)
  },
  async update(payload: PaymentConfigMutationPayload, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.put_api_admin_v1_payment_configs_id, {
      path: { id: requiredPositiveID(payload.id) },
      body: paymentConfigBody(payload),
    }, options)
  },
  async changeStatus(id: number, status: 1 | 2, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_payment_configs_id_status, {
      path: { id: positiveID(id) },
      body: { status },
    }, options)
  },
  async deleteOne(id: number, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.delete_api_admin_v1_payment_configs_id, {
      path: { id: positiveID(id) },
    }, options)
  },
  uploadCertificate: (payload: PaymentCertificateUploadBody, options: ExecuteOptions = {}): Promise<PaymentCertificateUploadResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_certificates, { body: payload }, options),
  test: (id: number, options: ExecuteOptions = {}): Promise<PaymentConfigTestResponse> =>
    executeAdminOperation(adminOperations.post_api_admin_v1_payment_configs_id_test, {
      path: { id: positiveID(id) },
    }, options),
}
