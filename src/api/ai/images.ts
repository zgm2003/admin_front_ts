import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type AiImageTaskStatus = 'pending' | 'running' | 'success' | 'failed'
export type AiImageSize = 'auto' | '1024x1024' | '1536x1024' | '1024x1536'
export type AiImageQuality = 'auto' | 'low' | 'medium' | 'high'
export type AiImageOutputFormat = 'png' | 'jpeg' | 'webp'
export type AiImageModeration = 'auto' | 'low'
export type AiImageStorageProvider = 'cos' | 'remote_url'
export type AiImageAssetSource = 'upload' | 'mask' | 'generated'

export interface AiImageAgentOption {
  id: number
  name: string
  avatar?: string | null
}

export interface AiImageInitResponse {
  dict: {
    size_arr: DictOption<AiImageSize>[]
    quality_arr: DictOption<AiImageQuality>[]
    output_format_arr: DictOption<AiImageOutputFormat>[]
    moderation_arr: DictOption<AiImageModeration>[]
    status_arr: DictOption<AiImageTaskStatus>[]
    favorite_arr: DictOption<number>[]
  }
  agent_options: AiImageAgentOption[]
}

export interface AiImageTaskItem {
  id: number
  agent_id: number
  agent_name_snapshot: string
  provider_id_snapshot: number
  provider_name_snapshot: string
  model_id_snapshot: string
  model_display_name_snapshot: string
  prompt: string
  size: AiImageSize | string
  quality: AiImageQuality | string
  output_format: AiImageOutputFormat | string
  output_compression?: number | null
  moderation: AiImageModeration | string
  n: number
  status: AiImageTaskStatus
  status_name?: string
  error_message?: string
  actual_params_json?: Record<string, unknown>
  is_favorite: number
  finished_at?: string
  elapsed_ms: number
  created_at: string
  updated_at: string
}

export interface AiImageAssetItem {
  id: number
  storage_provider: AiImageStorageProvider
  storage_key: string
  storage_url: string
  mime_type: string
  width: number
  height: number
  size_bytes: number
  source_type: AiImageAssetSource
  role?: string
  sort_order?: number
  related_asset_id?: number | null
  revised_prompt?: string
  actual_params_json?: Record<string, unknown>
  created_at: string
}

export interface AiImageDetailResponse {
  task: AiImageTaskItem
  inputs: AiImageAssetItem[]
  mask?: AiImageAssetItem | null
  outputs: AiImageAssetItem[]
}

export interface AiImageListParams {
  current_page: number
  page_size: number
  status?: AiImageTaskStatus | ''
  is_favorite?: number | ''
}

export interface AiImageAssetCreatePayload {
  storage_provider: AiImageStorageProvider
  storage_key: string
  storage_url: string
  mime_type: string
  width: number
  height: number
  size_bytes: number
  source_type: Extract<AiImageAssetSource, 'upload' | 'mask'>
}

export interface AiImageTaskCreatePayload {
  agent_id: number
  prompt: string
  size?: AiImageSize | ''
  quality?: AiImageQuality | ''
  output_format?: AiImageOutputFormat | ''
  output_compression?: number | null
  moderation?: AiImageModeration | ''
  n?: number
  input_asset_ids?: number[]
  mask_asset_id?: number
  mask_target_asset_id?: number
}

export interface AiImageCreateTaskResponse {
  task: AiImageTaskItem
}

interface AiImageListQueryParams {
  current_page: number
  page_size: number
  status?: AiImageTaskStatus
  is_favorite?: number
}

const BASE = `${ADMIN_API_PREFIX}/ai-images`

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function optionalImageEnum<T extends string>(value: T | '' | undefined): T | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === '') {
    return undefined
  }
  return value
}

function optionalPositiveID(value: number | undefined, label: string): number | undefined {
  if (value === undefined) {
    return undefined
  }
  return positiveID(value, label)
}

function normalizeListParams(params: AiImageListParams): AiImageListQueryParams {
  const query: AiImageListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }
  if (params.status) query.status = params.status
  if (typeof params.is_favorite === 'number') query.is_favorite = params.is_favorite
  return query
}

function normalizeTaskPayload(payload: AiImageTaskCreatePayload): AiImageTaskCreatePayload {
  const body: AiImageTaskCreatePayload = {
    agent_id: positiveID(payload.agent_id, 'AI image agent id'),
    prompt: payload.prompt.trim(),
    size: optionalImageEnum(payload.size),
    quality: optionalImageEnum(payload.quality),
    output_format: optionalImageEnum(payload.output_format),
    output_compression: typeof payload.output_compression === 'number' ? payload.output_compression : undefined,
    moderation: optionalImageEnum(payload.moderation),
    n: payload.n,
    input_asset_ids: payload.input_asset_ids,
    mask_asset_id: optionalPositiveID(payload.mask_asset_id, 'AI image mask asset id'),
    mask_target_asset_id: optionalPositiveID(payload.mask_target_asset_id, 'AI image mask target asset id'),
  }
  return body
}

function deleteTask(id: number): Promise<void> {
  return request.delete<void>(`${BASE}/${id}`)
}

const pageInit = () => request.get<AiImageInitResponse>(`${BASE}/page-init`)
const createAsset = (payload: AiImageAssetCreatePayload) => request.post<AiImageAssetItem, AiImageAssetCreatePayload>(`${BASE}/assets`, payload)
const createTask = (payload: AiImageTaskCreatePayload) => request.post<AiImageCreateTaskResponse, AiImageTaskCreatePayload>(BASE, normalizeTaskPayload(payload))
const deleteOne = (params: { id: Id }) => deleteTask(positiveID(params.id, 'AI image task id'))
const deleteBatch = async (params: { ids: Id[] }): Promise<void> => {
  await Promise.all(params.ids.map((item) => deleteOne({ id: item })))
}

export const AiImageApi = {
  pageInit,
  list: (params: AiImageListParams) => request.get<PaginatedResponse<AiImageTaskItem>>(BASE, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiImageDetailResponse>(`${BASE}/${positiveID(params.id, 'AI image task id')}`),
  createAsset,
  createTask,
  favorite: (params: { id: Id; is_favorite: number }) => request.patch<AiImageTaskItem, { is_favorite: number }>(`${BASE}/${positiveID(params.id, 'AI image task id')}/favorite`, { is_favorite: params.is_favorite }),
  deleteOne,
  deleteBatch,
  addAsset: createAsset,
  addTask: createTask,
}
