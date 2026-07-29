import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
  type AdminOperationOutput,
} from '@/modules/http/generated/operations'

export type AiModelPriceFamily = 'gpt' | 'claude'
export type AiModelPriceItem = components['schemas']['Go_internal_module_ai_modelpricing_ModelPriceDTO_Output']
export type AiModelPriceRate = components['schemas']['Go_internal_module_ai_modelpricing_RateDTO_Output']
export type AiModelPriceRateInput = components['schemas']['Go_internal_module_ai_modelpricing_transport_admin_rateRequest_Input']
export type AiModelPriceMutationResponse = components['schemas']['Go_internal_module_ai_modelpricing_MutationResponse_Output']
export type AiModelPricePageInitResponse = AdminOperationOutput<'get_api_admin_v1_ai_model_prices_page_init'>
export type AiModelPriceListResponse = AdminOperationOutput<'get_api_admin_v1_ai_model_prices'>

export interface AiModelPriceListParams {
  family?: AiModelPriceFamily | ''
  model_id?: string
}

export interface AiModelPriceUpdateParams {
  model_id: string
  expected_version: number
  rates: AiModelPriceRateInput[]
  source_url: string
  verified_at: string
}

export interface AiModelPriceRestoreParams {
  model_id: string
  expected_version: number
}

type ListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_ai_model_prices'>['query']>
type UpdateBody = NonNullable<AdminOperationInput<'put_api_admin_v1_ai_model_prices_model_id'>['body']>

function requiredModelID(value: string): string {
  const modelID = value.trim()
  if (!modelID) throw new Error('AI model id is required')
  return modelID
}

function expectedVersion(value: number, allowZero: boolean): number {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`AI model price expected version must be ${allowZero ? 'non-negative' : 'positive'}`)
  }
  return value
}

function listQuery(params: AiModelPriceListParams): ListQuery {
  const query: ListQuery = {}
  if (params.family) query.family = params.family
  const modelID = params.model_id?.trim()
  if (modelID) query.model_id = modelID
  return query
}

function updateBody(params: AiModelPriceUpdateParams): UpdateBody {
  return {
    expected_version: expectedVersion(params.expected_version, true),
    rates: params.rates.map((rate) => ({ ...rate })),
    source_url: params.source_url.trim(),
    verified_at: params.verified_at.trim(),
  }
}

export const AiModelPriceApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<AiModelPricePageInitResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_model_prices_page_init, {}, options),

  list: (params: AiModelPriceListParams = {}, options: ExecuteOptions = {}): Promise<AiModelPriceListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_model_prices, {
      query: listQuery(params),
    }, options),

  detail: (params: { model_id: string }, options: ExecuteOptions = {}): Promise<AiModelPriceItem> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_ai_model_prices_model_id, {
      path: { model_id: requiredModelID(params.model_id) },
    }, options),

  update: (params: AiModelPriceUpdateParams, options: ExecuteOptions = {}): Promise<AiModelPriceMutationResponse> =>
    executeAdminOperation(adminOperations.put_api_admin_v1_ai_model_prices_model_id, {
      path: { model_id: requiredModelID(params.model_id) },
      body: updateBody(params),
    }, options),

  restore: (params: AiModelPriceRestoreParams, options: ExecuteOptions = {}): Promise<AiModelPriceMutationResponse> =>
    executeAdminOperation(adminOperations.delete_api_admin_v1_ai_model_prices_model_id_override, {
      path: { model_id: requiredModelID(params.model_id) },
      query: { expected_version: expectedVersion(params.expected_version, false) },
    }, options),
}
