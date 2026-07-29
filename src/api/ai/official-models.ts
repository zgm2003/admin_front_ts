import request from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'

export type AiOfficialModelLifecycle = 'active' | 'deprecated' | 'retired'
export type AiOfficialModelRateCategory = 'input' | 'output' | 'cache_read' | 'cache_write' | 'media'

export interface AiOfficialModelOption {
  label: string
  value: string
}

export interface AiOfficialModelRate {
  category: AiOfficialModelRateCategory
  unit: string
  tier_key: string
  price: string
  unit_scale: number
}

export interface AiOfficialModelPrice {
  pricing_version: string
  source: 'official' | 'override'
  override_version: number
  source_url: string
  verified_at: string
  available: boolean
  rates: AiOfficialModelRate[]
}

export interface AiOfficialModelImageInput {
  mime_types: string[]
  max_files: number
  max_bytes: number
}

export interface AiOfficialModelCapabilities {
  input_modalities: string[]
  output_modalities: string[]
  supports_streaming: boolean
  supports_tools: boolean
  supports_structured_output: boolean
  supported_parameters: string[]
  native_file_input: boolean
  image_input: AiOfficialModelImageInput | null
}

export interface AiOfficialModelItem {
  catalog_vendor: string
  model_family: string
  model_id: string
  aliases: string[]
  lifecycle_status: AiOfficialModelLifecycle
  catalog_version: string
  context_window_tokens: number
  max_output_tokens: number
  context_tier_threshold_tokens: number
  capabilities: AiOfficialModelCapabilities
  pricing_profile: string
  official: AiOfficialModelPrice
  effective: AiOfficialModelPrice
  model_source_url: string
  pricing_source_url: string
  retrieved_at: string
  review_after: string
}

export interface AiOfficialModelPageInitResponse {
  dict: {
    vendor_options: AiOfficialModelOption[]
    family_options: AiOfficialModelOption[]
    lifecycle_options: AiOfficialModelOption[]
    input_modality_options: AiOfficialModelOption[]
  }
}

export interface AiOfficialModelListResponse {
  list: AiOfficialModelItem[]
}

export interface AiOfficialModelMutationResponse {
  before: AiOfficialModelPrice
  after: AiOfficialModelPrice
}

export interface AiOfficialModelListParams {
  vendor?: string
  family?: string
  lifecycle?: AiOfficialModelLifecycle | ''
  input_modality?: string
  model_id?: string
}

export interface AiOfficialModelRateInput {
  category: AiOfficialModelRateCategory
  unit: string
  tier_key: string
  price: string
  unit_scale: number
}

export interface AiOfficialModelPriceSyncParams {
  model_id: string
  expected_version: number
  rates: AiOfficialModelRateInput[]
  source_url: string
  verified_at: string
}

export interface AiOfficialModelPriceRestoreParams {
  model_id: string
  expected_version: number
}

function requiredModelID(value: string): string {
  const modelID = value.trim()
  if (!modelID) throw new Error('AI official model id is required')
  return modelID
}

function expectedVersion(value: number, allowZero: boolean): number {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) {
    throw new Error(`AI official model expected version must be ${allowZero ? 'non-negative' : 'positive'}`)
  }
  return value
}

function modelPath(modelID: string, suffix = ''): string {
  return `/api/admin/v1/ai-official-models/${encodeURIComponent(requiredModelID(modelID))}${suffix}`
}

function listQuery(params: AiOfficialModelListParams): Record<string, string> {
  const query: Record<string, string> = {}
  for (const key of ['vendor', 'family', 'lifecycle', 'input_modality'] as const) {
    const value = params[key]?.trim()
    if (value) query[key] = value
  }
  const modelID = params.model_id?.trim()
  if (modelID) query.model_id = modelID
  return query
}

function optionsFrom(options: ExecuteOptions): Pick<ExecuteOptions, 'signal'> {
  return { signal: options.signal }
}

export const AiOfficialModelApi = {
  pageInit: (options: ExecuteOptions = {}): Promise<AiOfficialModelPageInitResponse> =>
    request.get('/api/admin/v1/ai-official-models/page-init', optionsFrom(options)),

  list: (params: AiOfficialModelListParams = {}, options: ExecuteOptions = {}): Promise<AiOfficialModelListResponse> =>
    request.get('/api/admin/v1/ai-official-models', { ...optionsFrom(options), params: listQuery(params) }),

  detail: (params: { model_id: string }, options: ExecuteOptions = {}): Promise<AiOfficialModelItem> =>
    request.get(modelPath(params.model_id), optionsFrom(options)),

  syncPrice: (params: AiOfficialModelPriceSyncParams, options: ExecuteOptions = {}): Promise<AiOfficialModelMutationResponse> =>
    request.put(modelPath(params.model_id, '/price'), {
      expected_version: expectedVersion(params.expected_version, true),
      rates: params.rates.map((rate) => ({ ...rate })),
      source_url: params.source_url.trim(),
      verified_at: params.verified_at.trim(),
    }, optionsFrom(options)),

  restoreOfficialPrice: (
    params: AiOfficialModelPriceRestoreParams,
    options: ExecuteOptions = {},
  ): Promise<AiOfficialModelMutationResponse> => request.delete(modelPath(params.model_id, '/price-override'), {
    ...optionsFrom(options),
    params: { expected_version: expectedVersion(params.expected_version, false) },
  }),
}
