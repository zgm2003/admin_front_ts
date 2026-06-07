import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export type AiCommonStatus = 1 | 2
export type AiAssetType = 'text' | 'image' | 'video'

export interface AiAssetInitResponse {
  common_status_arr: DictOption<AiCommonStatus>[]
  ai_asset_type_arr: DictOption<AiAssetType>[]
}

export interface AiAssetListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  keyword?: string
  type?: AiAssetType | ''
  status?: AiCommonStatus | ''
}

export interface AiAssetItem {
  id: number
  slug: string
  type: AiAssetType
  category: string
  title: string
  cover_url: string
  description: string
  content: string
  url: string
  tags_json: string
  status: AiCommonStatus
  created_at: string
  updated_at: string
}

export interface AiAssetMutationParams {
  id?: Id
  slug: string
  type: AiAssetType
  category: string
  title: string
  cover_url: string
  description: string
  content: string
  url: string
  tags_json: string
  status: AiCommonStatus
}

export interface AiAssetMutationBody {
  slug: string
  type: AiAssetType
  category: string
  title: string
  cover_url: string
  description: string
  content: string
  url: string
  tags_json: string
  status: AiCommonStatus
}

export interface AiAssetCreateResponse {
  id: number
}

interface AiAssetListQueryParams {
  current_page?: number
  page_size?: number
  keyword?: string
  type?: AiAssetType
  status?: AiCommonStatus
}

function positiveID(value: Id | number, label: string): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeIDs(values: Id[]): number[] {
  return values.map((value) => positiveID(value, 'AI asset id'))
}

function mutationID(value: Id | undefined): number {
  if (typeof value === 'undefined') {
    throw new Error('AI asset id must be provided')
  }

  return positiveID(value, 'AI asset id')
}

function requireOptionArray<T extends string | number>(value: unknown, field: string): DictOption<T>[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`)
  }

  return value as DictOption<T>[]
}

function normalizeAiAssetInitResponse(response: AiAssetInitResponse): AiAssetInitResponse {
  return {
    common_status_arr: requireOptionArray<AiCommonStatus>(response.common_status_arr, 'ai-assets.page-init.common_status_arr'),
    ai_asset_type_arr: requireOptionArray<AiAssetType>(response.ai_asset_type_arr, 'ai-assets.page-init.ai_asset_type_arr'),
  }
}

function normalizeListParams(params: AiAssetListParams): AiAssetListQueryParams {
  const query: AiAssetListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.keyword === 'string' && params.keyword.trim()) query.keyword = params.keyword.trim()
  if (params.type) query.type = params.type
  if (typeof params.status === 'number') query.status = params.status
  return query
}

function mutationBody(params: AiAssetMutationParams): AiAssetMutationBody {
  return {
    slug: params.slug,
    type: params.type,
    category: params.category,
    title: params.title,
    cover_url: params.cover_url,
    description: params.description,
    content: params.content,
    url: params.url,
    tags_json: params.tags_json,
    status: params.status,
  }
}

const pageInit = async () => normalizeAiAssetInitResponse(
  await request.get<AiAssetInitResponse>(`${ADMIN_API_PREFIX}/ai-assets/page-init`)
)
const list = (params: AiAssetListParams) => request.get<PaginatedResponse<AiAssetItem>>(`${ADMIN_API_PREFIX}/ai-assets`, { params: normalizeListParams(params) })
const detail = (params: { id: Id }) => request.get<AiAssetItem>(`${ADMIN_API_PREFIX}/ai-assets/${positiveID(params.id, 'AI asset id')}`)
const create = (params: AiAssetMutationParams) => request.post<AiAssetCreateResponse, AiAssetMutationBody>(`${ADMIN_API_PREFIX}/ai-assets`, mutationBody(params))
const update = (params: AiAssetMutationParams) => request.put<void, AiAssetMutationBody>(`${ADMIN_API_PREFIX}/ai-assets/${mutationID(params.id)}`, mutationBody(params))
const deleteOne = (params: { id: Id }) => request.delete<void>(`${ADMIN_API_PREFIX}/ai-assets/${positiveID(params.id, 'AI asset id')}`)
const deleteBatch = (params: { ids: Id[] }) => request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/ai-assets`, { data: { ids: normalizeIDs(params.ids) } })

export const AiAssetApi = {
  pageInit,
  list,
  detail,
  create,
  update,
  deleteOne,
  deleteBatch,
}
